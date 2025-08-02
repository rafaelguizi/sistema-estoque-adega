'use client'
import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToastContext } from '@/components/ToastProvider'
import LoadingButton from '@/components/LoadingButton'

// Componente de Loading
function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando checkout...</p>
      </div>
    </div>
  )
}

// Interfaces
interface PlanoInfo {
  id: string
  nome: string
  emoji: string
  preco: number
  precoOriginal: number
  recursos: string[]
  descricao: string
}

interface FormData {
  // Dados pessoais
  nome: string
  email: string
  telefone: string
  cpf: string
  
  // Dados da empresa
  nomeEmpresa: string
  emailEmpresa: string
  cnpj: string
  
  // Método de pagamento
  metodoPagamento: 'cartao' | 'pix' | 'boleto'
  
  // Termos
  aceitaTermos: boolean
  aceitaNewsletter: boolean
}

interface DadosCompra {
  plano: PlanoInfo
  cliente: FormData
  metodoPagamento: 'cartao' | 'pix' | 'boleto'
}

// Componente principal do checkout
function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToastContext()
  
  const [loading, setLoading] = useState<boolean>(false)
  const [planoSelecionado, setPlanoSelecionado] = useState<PlanoInfo | null>(null)
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    nomeEmpresa: '',
    emailEmpresa: '',
    cnpj: '',
    metodoPagamento: 'cartao',
    aceitaTermos: false,
    aceitaNewsletter: true
  })

  const planos: Record<string, PlanoInfo> = {
    basico: {
      id: 'basico',
      nome: 'Básico',
      emoji: '💎',
      preco: 49,
      precoOriginal: 79,
      descricao: 'Ideal para pequenos negócios',
      recursos: [
        'Até 1.000 produtos',
        '1 usuário',
        'PDV básico',
        'Relatórios simples',
        'Suporte por email'
      ]
    },
    profissional: {
      id: 'profissional',
      nome: 'Profissional',
      emoji: '🚀',
      preco: 99,
      precoOriginal: 149,
      descricao: 'Para empresas em crescimento',
      recursos: [
        'Produtos ilimitados',
        'Até 3 usuários',
        'PDV avançado',
        'Relatórios completos',
        'Suporte prioritário'
      ]
    },
    enterprise: {
      id: 'enterprise',
      nome: 'Enterprise',
      emoji: '⭐',
      preco: 199,
      precoOriginal: 299,
      descricao: 'Para grandes operações',
      recursos: [
        'Tudo do Profissional',
        'Usuários ilimitados',
        'API personalizada',
        'Suporte dedicado',
        'Treinamento incluído'
      ]
    }
  }

  // Carregar plano da URL
  useEffect(() => {
    const planoId = searchParams.get('plano')
    if (planoId && planos[planoId]) {
      setPlanoSelecionado(planos[planoId])
    } else {
      // Se não tem plano, redireciona para vendas
      router.push('/vendas')
    }
  }, [searchParams, router])

  // Validação de CPF simples
  const validarCPF = (cpf: string): boolean => {
    const cpfLimpo = cpf.replace(/\D/g, '')
    return cpfLimpo.length === 11
  }

  // Validação de CNPJ simples
  const validarCNPJ = (cnpj: string): boolean => {
    const cnpjLimpo = cnpj.replace(/\D/g, '')
    return cnpjLimpo.length === 14
  }

  // Máscara para telefone
  const formatarTelefone = (valor: string): string => {
    const numero = valor.replace(/\D/g, '')
    if (numero.length <= 10) {
      return numero.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    }
    return numero.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }

  // Máscara para CPF
  const formatarCPF = (valor: string): string => {
    const numero = valor.replace(/\D/g, '')
    return numero.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  // Máscara para CNPJ
  const formatarCNPJ = (valor: string): string => {
    const numero = valor.replace(/\D/g, '')
    return numero.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  // Handle mudança nos inputs
  const handleInputChange = (field: keyof FormData, value: string | boolean): void => {
    setFormData((prev: FormData) => ({
      ...prev,
      [field]: value
    }))
  }

  // Validar formulário
  const validarFormulario = (): string[] => {
    const erros: string[] = []

    if (!formData.nome.trim()) erros.push('Nome é obrigatório')
    if (!formData.email.trim()) erros.push('Email é obrigatório')
    if (!formData.telefone.trim()) erros.push('Telefone é obrigatório')
    if (!formData.nomeEmpresa.trim()) erros.push('Nome da empresa é obrigatório')
    if (!formData.emailEmpresa.trim()) erros.push('Email da empresa é obrigatório')
    
    if (formData.cpf && !validarCPF(formData.cpf)) {
      erros.push('CPF inválido')
    }
    
    if (formData.cnpj && !validarCNPJ(formData.cnpj)) {
      erros.push('CNPJ inválido')
    }
    
    if (!formData.aceitaTermos) {
      erros.push('Você deve aceitar os termos de uso')
    }

    return erros
  }

  // Processar checkout - VERSÃO CORRIGIDA
  const processarCheckout = async (): Promise<void> => {
    const erros = validarFormulario()
    
    if (erros.length > 0) {
      toast.error('Formulário inválido', erros[0])
      return
    }

    if (!planoSelecionado) {
      toast.error('Erro', 'Plano não selecionado')
      return
    }

    setLoading(true)
    
    try {
      const dadosCheckout: DadosCompra = {
        plano: planoSelecionado,
        cliente: formData,
        metodoPagamento: formData.metodoPagamento
      }
      
      console.log('📦 Enviando dados do checkout:', dadosCheckout)
      
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dadosCheckout)
      })
      
      const resultado = await response.json()
      
      if (!response.ok) {
        throw new Error(resultado.error || 'Erro no checkout')
      }
      
      console.log('✅ Checkout processado (SIMULAÇÃO):', resultado)
      
      toast.success('Processando...', 'Redirecionando para pagamento simulado')
      
      // Salvar dados temporariamente
      localStorage.setItem('stockpro_checkout_temp', JSON.stringify({
        credenciais: resultado.credenciais,
        plano: planoSelecionado,
        cliente: formData,
        clienteData: resultado.clienteData,
        modo: 'SIMULACAO'
      }))
      
      // CORREÇÃO: Redirecionar direto para sucesso com URL correta
      setTimeout(() => {
        const successUrl = `/pagamento/sucesso?mock=true&payment_id=${resultado.preferencia.id}&status=approved`
        console.log('🔄 Redirecionando para:', successUrl)
        router.push(successUrl)
      }, 1500)
      
    } catch (error: any) {
      console.error('❌ Erro no checkout:', error)
      toast.error('Erro no checkout', error.message || 'Tente novamente em alguns instantes')
    } finally {
      setLoading(false)
    }
  }

  if (!planoSelecionado) {
    return <CheckoutLoading />
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">📦</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">StockPro</h1>
                <p className="text-sm text-gray-500">Finalizar Compra</p>
              </div>
            </div>
            
            <button
              onClick={() => router.push('/vendas')}
              className="text-gray-500 hover:text-gray-700"
            >
              ← Voltar aos planos
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Formulário */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Dados Pessoais */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="mr-2">👤</span>
                Dados Pessoais
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 font-medium"
                    placeholder="João da Silva"
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 font-medium"
                    placeholder="joao@email.com"
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    value={formData.telefone}
                    onChange={(e) => handleInputChange('telefone', formatarTelefone(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 font-medium"
                    placeholder="(11) 99999-9999"
                    maxLength={15}
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPF (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => handleInputChange('cpf', formatarCPF(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 font-medium"
                    placeholder="000.000.000-00"
                    maxLength={14}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Dados da Empresa */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="mr-2">🏢</span>
                Dados da Empresa
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Empresa *
                  </label>
                  <input
                    type="text"
                    value={formData.nomeEmpresa}
                    onChange={(e) => handleInputChange('nomeEmpresa', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 font-medium"
                    placeholder="Adega do João"
                    disabled={loading}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email da Empresa *
                  </label>
                  <input
                    type="email"
                    value={formData.emailEmpresa}
                    onChange={(e) => handleInputChange('emailEmpresa', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 font-medium"
                    placeholder="contato@adegadojoao.com"
                    disabled={loading}
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CNPJ (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => handleInputChange('cnpj', formatarCNPJ(e.target.value))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500 font-medium"
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Método de Pagamento */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <span className="mr-2">💳</span>
                Método de Pagamento
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'cartao', nome: 'Cartão de Crédito', emoji: '💳', descricao: 'Débito automático mensal' },
                  { id: 'pix', nome: 'PIX', emoji: '📱', descricao: 'Pagamento à vista' },
                  { id: 'boleto', nome: 'Boleto', emoji: '🧾', descricao: 'Vencimento em 3 dias' }
                ].map((metodo) => (
                  <div
                    key={metodo.id}
                    onClick={() => handleInputChange('metodoPagamento', metodo.id)}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      formData.metodoPagamento === metodo.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-3xl mb-2">{metodo.emoji}</div>
                      <h3 className="font-medium text-gray-900">{metodo.nome}</h3>
                      <p className="text-sm text-gray-600 mt-1">{metodo.descricao}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>🔒 Pagamento 100% seguro</strong> - Processado pelo Mercado Pago, 
                  líder em segurança de pagamentos na América Latina.
                </p>
              </div>
            </div>

            {/* Termos e Condições */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="space-y-4">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="termos"
                    checked={formData.aceitaTermos}
                    onChange={(e) => handleInputChange('aceitaTermos', e.target.checked)}
                    className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={loading}
                  />
                  <label htmlFor="termos" className="text-sm text-gray-700">
                    Eu aceito os{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-700 underline">
                      Termos de Uso
                    </a>{' '}
                    e a{' '}
                    <a href="#" className="text-blue-600 hover:text-blue-700 underline">
                      Política de Privacidade
                    </a>{' '}
                    do StockPro *
                  </label>
                </div>
                
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="newsletter"
                    checked={formData.aceitaNewsletter}
                    onChange={(e) => handleInputChange('aceitaNewsletter', e.target.checked)}
                    className="mt-1 mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={loading}
                  />
                  <label htmlFor="newsletter" className="text-sm text-gray-700">
                    Quero receber dicas e novidades do StockPro por email
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Resumo do Pedido */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                📋 Resumo do Pedido
              </h2>
              
              {/* Plano Selecionado */}
              <div className="border border-gray-200 rounded-lg p-4 mb-6">
                <div className="flex items-center mb-3">
                  <span className="text-2xl mr-2">{planoSelecionado.emoji}</span>
                  <div>
                    <h3 className="font-bold text-gray-900">Plano {planoSelecionado.nome}</h3>
                    <p className="text-sm text-gray-600">{planoSelecionado.descricao}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  {planoSelecionado.recursos.slice(0, 3).map((recurso: string, index: number) => (
                    <div key={index} className="flex items-center text-gray-600">
                      <span className="text-green-500 mr-2">✅</span>
                      {recurso}
                    </div>
                  ))}
                  {planoSelecionado.recursos.length > 3 && (
                    <div className="text-gray-500 text-xs">
                      +{planoSelecionado.recursos.length - 3} recursos adicionais
                    </div>
                  )}
                </div>
              </div>
              
              {/* Valores */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Plano {planoSelecionado.nome}</span>
                  <span className="line-through text-gray-400">R\$ {planoSelecionado.precoOriginal}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Desconto de lançamento</span>
                  <span className="text-green-600 font-medium">
                    -R\$ {planoSelecionado.precoOriginal - planoSelecionado.preco}
                  </span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-900">Total mensal</span>
                    <span className="text-2xl font-bold text-blue-600">
                      R\$ {planoSelecionado.preco}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Benefícios */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-green-800 mb-2">🎁 Incluído no seu plano:</h4>
                <div className="space-y-1 text-sm text-green-700">
                  <div>✅ 7 dias de teste grátis</div>
                  <div>✅ Suporte técnico incluído</div>
                  <div>✅ Backup automático</div>
                  <div>✅ Atualizações gratuitas</div>
                </div>
              </div>
              
              {/* Botão de Finalizar */}
              <LoadingButton
                onClick={processarCheckout}
                isLoading={loading}
                loadingText="Processando..."
                variant="primary"
                size="lg"
                className="w-full"
                disabled={!formData.aceitaTermos}
              >
                🚀 Finalizar Compra
              </LoadingButton>
              
              <p className="text-xs text-gray-500 text-center mt-3">
                Ao finalizar, você será redirecionado para o Mercado Pago
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente principal exportado
export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutContent />
    </Suspense>
  )
}