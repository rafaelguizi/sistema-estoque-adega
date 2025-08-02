import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { jwtVerify } from 'jose'

const prisma = new PrismaClient()
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export async function POST(request: NextRequest) {
  try {
    const { novaSenha, confirmarSenha } = await request.json()

    // Verificar token
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Token não encontrado' },
        { status: 401 }
      )
    }

    let decoded
    try {
      const { payload } = await jwtVerify(token, secret)
      decoded = payload
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      )
    }

    // Validar senhas
    if (!novaSenha || !confirmarSenha) {
      return NextResponse.json(
        { error: 'Nova senha e confirmação são obrigatórias' },
        { status: 400 }
      )
    }

    if (novaSenha !== confirmarSenha) {
      return NextResponse.json(
        { error: 'As senhas não coincidem' },
        { status: 400 }
      )
    }

    // Validar força da senha
    const validacao = validarSenha(novaSenha)
    if (!validacao.valida) {
      return NextResponse.json(
        { error: 'Senha não atende aos critérios de segurança', detalhes: validacao.erros },
        { status: 400 }
      )
    }

    // Alterar senha
    const senhaHash = await bcrypt.hash(novaSenha, 12)
    
    await prisma.user.update({
      where: { id: decoded.userId as string },
      data: {
        password: senhaHash,
        primeiroAcesso: false,
        senhaTemporaria: false
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Senha alterada com sucesso'
    })
  } catch (error) {
    console.error('Erro ao alterar senha:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

// Função para validar força da senha
function validarSenha(senha: string): { valida: boolean; erros: string[] } {
  const erros: string[] = []
  
  if (senha.length < 8) {
    erros.push('A senha deve ter pelo menos 8 caracteres')
  }
  
  if (!/[A-Z]/.test(senha)) {
    erros.push('A senha deve conter pelo menos uma letra maiúscula')
  }
  
  if (!/[a-z]/.test(senha)) {
    erros.push('A senha deve conter pelo menos uma letra minúscula')
  }
  
  if (!/[0-9]/.test(senha)) {
    erros.push('A senha deve conter pelo menos um número')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(senha)) {
    erros.push('A senha deve conter pelo menos um caractere especial')
  }
  
  return {
    valida: erros.length === 0,
    erros
  }
}