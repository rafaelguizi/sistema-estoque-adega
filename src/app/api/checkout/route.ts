import { NextRequest, NextResponse } from 'next/server'
import { criarPreferencia, gerarCredenciais, DadosCompra } from '@/lib/mercadopago'

export async function POST(request: NextRequest) {
  try {
    const dadosCompra: DadosCompra = await request.json()
    
    console.log('🛒 Processando checkout:', dadosCompra)
    
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
    
    console.log('🔑 Credenciais geradas:', credenciais)
    
    // Criar preferência no Mercado Pago
    const preferencia = await criarPreferencia(dadosCompra)
    
    console.log('💳 Preferência criada:', preferencia.id)
    
    // Aqui você salvaria no banco de dados (Firebase)
    // const clienteData = {
    //   ...dadosCompra.cliente,
    //   credenciais,
    //   plano: dadosCompra.plano,
    //   status: 'pendente',
    //   mercadoPagoId: preferencia.id,
    //   createdAt: new Date().toISOString()
    // }
    
    return NextResponse.json({
      success: true,
      preferencia,
      credenciais,
      message: 'Checkout processado com sucesso'
    })
    
  } catch (error) {
    console.error('❌ Erro no checkout:', error)
    
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}