// Versão simplificada sem dependência externa
export interface DadosCompra {
  plano: {
    id: string
    nome: string
    preco: number
  }
  cliente: {
    nome: string
    email: string
    telefone: string
    cpf?: string
    nomeEmpresa: string
    emailEmpresa: string
    cnpj?: string
  }
  metodoPagamento: 'cartao' | 'pix' | 'boleto'
}

export interface PreferenceResponse {
  id: string
  init_point: string
  sandbox_init_point: string
}

// Simular criação de preferência (sem Mercado Pago real)
export const criarPreferencia = async (dadosCompra: DadosCompra): Promise<PreferenceResponse> => {
  try {
    // Gerar ID único para a compra
    const externalReference = `STOCKPRO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    console.log('🛒 Simulando criação de preferência:', {
      plano: dadosCompra.plano,
      cliente: dadosCompra.cliente.nome,
      empresa: dadosCompra.cliente.nomeEmpresa,
      valor: dadosCompra.plano.preco
    })
    
    // Simular delay de API
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Retornar dados simulados
    const mockPreference: PreferenceResponse = {
      id: externalReference,
      init_point: `${process.env.NEXT_PUBLIC_URL}/pagamento/sucesso?mock=true&payment_id=${externalReference}&status=approved`,
      sandbox_init_point: `${process.env.NEXT_PUBLIC_URL}/pagamento/sucesso?mock=true&payment_id=${externalReference}&status=approved`
    }
    
    console.log('✅ Preferência simulada criada:', mockPreference.id)
    
    return mockPreference
    
  } catch (error) {
    console.error('❌ Erro ao simular preferência:', error)
    throw new Error('Erro ao processar pagamento')
  }
}

// Simular verificação de pagamento
export const verificarPagamento = async (paymentId: string) => {
  try {
    console.log('📋 Simulando verificação de pagamento:', paymentId)
    
    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    return {
      id: paymentId,
      status: 'approved',
      status_detail: 'accredited',
      transaction_amount: 99,
      currency_id: 'BRL',
      payer: {
        email: 'cliente@teste.com'
      },
      payment_method: {
        type: 'credit_card'
      },
      external_reference: paymentId,
      date_created: new Date().toISOString(),
      date_approved: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('❌ Erro ao simular verificação:', error)
    throw new Error('Erro ao verificar status do pagamento')
  }
}

// Gerar credenciais de acesso
export const gerarCredenciais = (nomeEmpresa: string, email: string) => {
  // Limpar nome da empresa para email
  const empresaLimpa = nomeEmpresa
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]/g, '') // Remove caracteres especiais
    .substring(0, 15) // Máximo 15 caracteres
  
  // Email baseado na empresa
  const emailAcesso = `${empresaLimpa}@stockpro.com`
  
  // Senha temporária segura (8 caracteres)
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let senha = ''
  for (let i = 0; i < 8; i++) {
    senha += caracteres.charAt(Math.floor(Math.random() * caracteres.length))
  }
  
  return {
    email: emailAcesso,
    senha: senha,
    senhaTemporaria: true
  }
}

// Função para integração real com Mercado Pago (para implementar depois)
export const integrarMercadoPagoReal = async () => {
  console.log(`
🔧 PARA INTEGRAÇÃO REAL COM MERCADO PAGO:

1. Instalar dependência:
   npm install mercadopago

2. Configurar variáveis de ambiente:
   MERCADO_PAGO_ACCESS_TOKEN=seu_token_aqui
   MERCADO_PAGO_PUBLIC_KEY=sua_chave_publica_aqui

3. Substituir as funções simuladas pelas reais

4. Configurar webhook para confirmação automática
  `)
}