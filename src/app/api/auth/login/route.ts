import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'

const prisma = new PrismaClient()
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 401 }
      )
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Senha incorreta' },
        { status: 401 }
      )
    }

    // Verificar status da empresa
    if (user.company.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Conta suspensa por falta de pagamento' },
        { status: 403 }
      )
    }

    // 🆕 ATUALIZAR ÚLTIMO LOGIN
    await prisma.user.update({
      where: { id: user.id },
      data: { ultimoLogin: new Date() }
    })

    // Criar token JWT (ATUALIZADO com novos campos)
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role,
      companyStatus: user.company.status,
      // 🆕 NOVOS CAMPOS
      primeiroAcesso: user.primeiroAcesso,
      senhaTemporaria: user.senhaTemporaria
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret)

    // Criar resposta com cookie (ATUALIZADA com novos campos)
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company.name,
        // 🆕 NOVOS CAMPOS PARA CONTROLE DE PRIMEIRO ACESSO
        primeiroAcesso: user.primeiroAcesso,
        senhaTemporaria: user.senhaTemporaria,
        plan: user.company.plan,
        companyId: user.companyId
      }
    })

    // Definir cookie seguro
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 // 7 dias
    })

    return response

  } catch (error) {
    console.error('Erro no login:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}