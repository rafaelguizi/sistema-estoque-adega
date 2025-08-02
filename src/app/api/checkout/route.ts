import { NextRequest, NextResponse } from 'next/server'
import { criarPreferencia, gerarCredenciais, DadosCompra } from '@/lib/mercadopago'

export async function POST(request: NextRequest) {
  try {
    const dadosCompra: DadosCompra = await request.json()
    
    console.log('🛒 Processando checkout (MODO SIMULAÇÃO):', {
      cliente: dadosCompra.cliente.nome,
      empresa: dadosCompra.cliente.nomeEmpresa,
      plano: dadosCompra.plano.nome,
      valor: dadosCompra.plano.preco
    })
    
    // Validar dados obrigatórios
    if (!dadosCompra.cliente.nome || !dadosCompra.cliente.email || !dadosCompra.cliente.nomeEmpresa) {
      return NextResponse.json(
        { error: 'Dados obrigatórios não informados' },
        { status: 400 }
      )
    }
    
    // Gerar credenciais de acesso
    const credenciais = gerarCredenciais(
      dadosCompra.cliente.nomeEmpresa,
      dadosCompra.cliente.email
    )
    
    console.log('🔑 Credenciais geradas:', {
      email: credenciais.email,
      senha: credenciais.senha
    })
    
    // Criar preferência (simulada)
    const preferencia = await criarPreferencia(dadosCompra)
    
    console.log('💳 Preferência criada (simulada):', preferencia.id)
    
    // Simular salvamento no banco de dados
    const clienteData = {
      id: preferencia.id,
      nome: dadosCompra.cliente.nome,
      email: dadosCompra.cliente.email,
      empresa: dadosCompra.cliente.nomeEmpresa,
      plano: dadosCompra.plano.nome,
      valor: dadosCompra.plano.preco,
      credenciais,
      status: 'pendente',
      createdAt: new Date().toISOString(),
      modo: 'SIMULACAO'
    }
    
    console.log('💾 Dados do cliente (simulação):', clienteData)
    
    return NextResponse.json({
      success: true,
      preferencia,
      credenciais,
      clienteData,
      message: 'Checkout processado com sucesso (MODO SIMULAÇÃO)',
      aviso: 'Este é um pagamento simulado para demonstração'
    })
    
  } catch (error) {
    console.error('❌ Erro no checkout:', error)
    
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}