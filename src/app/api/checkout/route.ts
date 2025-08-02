import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const dadosCheckout = await request.json()
    
    console.log('📦 Dados recebidos no checkout:', dadosCheckout)

    // Gerar credenciais
    const emailLogin = dadosCheckout.cliente.emailEmpresa
    const senhaTemporaria = gerarSenhaTemporaria()
    const senhaHash = await bcrypt.hash(senhaTemporaria, 12)

    // 🆕 CRIAR EMPRESA E USUÁRIO NO BANCO
    const company = await prisma.company.create({
      data: {
        name: dadosCheckout.cliente.nomeEmpresa,
        email: dadosCheckout.cliente.emailEmpresa,
        plan: dadosCheckout.plano.id.toUpperCase(),
        status: 'ACTIVE',
        
        // Dados adicionais
        nomeFantasia: dadosCheckout.cliente.nomeEmpresa,
        cnpj: dadosCheckout.cliente.cnpj || null,
        telefone: dadosCheckout.cliente.telefone || null,
        
        // Dados da compra
        valorPago: dadosCheckout.plano.preco,
        metodoPagamento: dadosCheckout.metodoPagamento,
        transacaoId: `TXN_${Date.now()}`,
        dataCompra: new Date()
      }
    })

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: emailLogin,
        password: senhaHash,
        name: dadosCheckout.cliente.nome,
        role: 'ADMIN',
        companyId: company.id,
        primeiroAcesso: true,
        senhaTemporaria: true
      }
    })

    // Simular resposta do Mercado Pago
    const response = {
      success: true,
      preferencia: {
        id: `PREF_${Date.now()}`,
        init_point: `/pagamento/sucesso?mock=true&payment_id=PAY_${Date.now()}&status=approved`
      },
      credenciais: {
        email: emailLogin,
        senha: senhaTemporaria
      },
      clienteData: {
        id: user.id,
        companyId: company.id,
        nome: user.name,
        empresa: company.name
      }
    }

    console.log('✅ Checkout processado com sucesso:', response)
    
    return NextResponse.json(response)
    
  } catch (error: any) {
    console.error('❌ Erro no checkout:', error)
    return NextResponse.json(
      { error: 'Erro ao processar checkout', details: error.message },
      { status: 500 }
    )
  }
}

// Gerar senha temporária
function gerarSenhaTemporaria(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let senha = ''
  for (let i = 0; i < 8; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return senha
}