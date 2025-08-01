import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'

// Configuração do cliente Mercado Pago
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
  options: {
    timeout: 5000,
    idempotencyKey: 'abc'
  }
})

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

// Criar preferência de pagamento
export const criarPreferencia = async (dadosCompra: DadosCompra): Promise<PreferenceResponse> => {
  try {
    const preference = new Preference(client)
    
    // Gerar ID único para a compra
    const externalReference = `STOCKPRO_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const preferenceData = {
      items: [
        {
          id: dadosCompra.plano.id,
          title: `StockPro - Plano ${dadosCompra.plano.nome}`,
          description: `Assinatura mensal do sistema de controle de estoque`,
          quantity: 1,
          unit_price: dadosCompra.plano.preco,
          currency_id: 'BRL'
        }
      ],
      payer: {
        name: dadosCompra.cliente.nome,
        email: dadosCompra.cliente.email,
        phone: {
          number: dadosCompra.cliente.telefone.replace(/\D/g, '')
        },
        identification: dadosCompra.cliente.cpf ? {
          type: 'CPF',
          number: dadosCompra.cliente.cpf.replace(/\D/g, '')
        } : undefined
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_URL}/pagamento/sucesso`,
        failure: `${process.env.NEXT_PUBLIC_URL}/pagamento/erro?motivo=rejected`,
        pending: `${process.env.NEXT_PUBLIC_URL}/pagamento/erro?motivo=pending`
      },
      auto_return: 'approved',
      external_reference: externalReference,
      notification_url: `${process.env.NEXT_PUBLIC_URL}/api/webhook/mercadopago`,
      payment_methods: {
        excluded_payment_types: [],
        excluded_payment_methods: [],
        installments: 12, // Até 12x
        default_installments: 1
      },
      shipments: {
        cost: 0,
        mode: 'not_specified'
      },
      metadata: {
        cliente_id: externalReference,
        empresa: dadosCompra.cliente.nomeEmpresa,
        email_empresa: dadosCompra.cliente.emailEmpresa,
        plano: dadosCompra.plano.nome,
        metodo_preferido: dadosCompra.metodoPagamento
      }
    }
    
    const response = await preference.create({ body: preferenceData })
    
    console.log('✅ Preferência criada:', response.id)
    
    return {
      id: response.id!,
      init_point: response.init_point!,
      sandbox_init_point: response.sandbox_init_point!
    }
    
  } catch (error) {
    console.error('❌ Erro ao criar preferência:', error)
    throw new Error('Erro ao processar pagamento')
  }
}

// Verificar status do pagamento
export const verificarPagamento = async (paymentId: string) => {
  try {
    const payment = new Payment(client)
    const response = await payment.get({ id: paymentId })
    
    console.log('📋 Status do pagamento:', response)
    
    return {
      id: response.id,
      status: response.status,
      status_detail: response.status_detail,
      transaction_amount: response.transaction_amount,
      currency_id: response.currency_id,
      payer: response.payer,
      payment_method: response.payment_method,
      external_reference: response.external_reference,
      date_created: response.date_created,
      date_approved: response.date_approved
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar pagamento:', error)
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