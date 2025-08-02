'use client'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToastContext } from '@/components/ToastProvider'
import LoadingButton from '@/components/LoadingButton'

interface DadosCompra {
  plano: string
  valor: number
  transacaoId: string
  email: string
  empresa: string
  credenciais: {
    email: string
    senha: string
  }
}

export default function PagamentoSucessoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToastContext()
  
  const [loading, setLoading] = useState(true)
  const [dadosCompra, setDadosCompra] = useState<DadosCompra | null>(null)
  const [emailEnviado, setEmailEnviado] = useState(false)

  useEffect(() => {
    const verificarPagamento = async () => {
      try {
        const paymentId = searchParams.get('payment_id')
        const status = searchParams.get('status')
        const mock = searchParams.get('mock')
        
        // Verificar dados salvos no localStorage
        const dadosTemp = localStorage.getItem('stockpro_checkout_temp')
        
        if (dadosTemp) {
          const dados = JSON.parse(dadosTemp)
          console.log('📋 Dados recuperados:', dados)
          
          const dadosCompraFormatados: DadosCompra = {
            plano: dados.plano.nome,
            valor: dados.plano.preco,
            transacaoId: dados.clienteData?.id || 'MOCK_' + Date.now(),
            email: dados.cliente.emailEmpresa || dados.cliente.email,
            empresa: dados.cliente.nomeEmpresa,
            credenciais: dados.credenciais
          }
          
          setDadosCompra(dadosCompraFormatados)
          toast.success('Pagamento confirmado! (SIMULAÇÃO)', 'Sua conta foi criada com sucesso')
          
          // Simular envio de email
          setTimeout(() => {
            setEmailEnviado(true)
          }, 2000)
          
          // Limpar dados temporários
          localStorage.removeItem('stockpro_checkout_temp')
          
          setLoading(false)
          return
        }
        
        // Simular dados para teste se não há dados no localStorage
        if (mock === 'true') {
          const dadosMock: DadosCompra = {
            plano: 'Profissional',
            valor: 99,
            transacaoId: 'MOCK_' + Date.now(),
            email: 'cliente@teste.com',
            empresa: 'Empresa Teste',
            credenciais: {
              email: 'empresateste@stockpro.com',
              senha: 'TEMP123ABC'
            }
          }
          
          setDadosCompra(dadosMock)
          toast.success('Pagamento confirmado!', 'Sua conta foi criada com sucesso')
          
          // Simular envio de email
          setTimeout(() => {
            setEmailEnviado(true)
          }, 2000)
          
          setLoading(false)
          return
        }
        
        if (paymentId && status === 'approved') {
          // Aqui seria a verificação real com Mercado Pago
          // const response = await fetch(`/api/verificar-pagamento/${paymentId}`)
          // const dados = await response.json()
          
          // Por enquanto, simular sucesso
          toast.success('Pagamento confirmado!', 'Processando sua conta...')
        } else {
          // Redirecionar para erro se não aprovado
          router.push('/pagamento/erro?motivo=status_invalido')
        }
        
      } catch (error) {
        console.error('Erro ao verificar pagamento:', error)
        router.push('/pagamento/erro?motivo=erro_verificacao')
      } finally {
        setLoading(false)
      }
    }
    
    verificarPagamento()
  }, [searchParams, router, toast])

  const acessarSistema = () => {
    router.push('/login')
  }

  const baixarRecibo = () => {
    // Simular download do recibo
    toast.info('Download iniciado', 'Recibo será baixado em instantes')
  }

  const copiarCredencial = (texto: string, tipo: string) => {
    navigator.clipboard.writeText(texto)
    toast.success(`${tipo} copiado!`, 'Colado na área de transferência')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-green-500 border-t-transparent mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verificando pagamento...</h2>
          <p className="text-gray-600">Aguarde enquanto confirmamos sua compra</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header de Sucesso */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Pagamento Confirmado!
          </h1>
          <p className="text-xl text-gray-600">
            Bem-vindo ao StockPro! Sua conta foi criada com sucesso.
          </p>
          <div className="mt-4 inline-flex items-center px-4 py-2 bg-green-100 border border-green-300 rounded-full">
            <span className="text-green-800 text-sm font-medium">
              ✅ Sistema ativo e pronto para uso
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Dados da Compra */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-3">📋</span>
              Detalhes da Compra
            </h2>
            
            {dadosCompra && (
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Plano Adquirido</span>
                  <span className="font-semibold text-gray-900">🚀 {dadosCompra.plano}</span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Valor Pago</span>
                  <span className="font-semibold text-green-600">R\$ {dadosCompra.valor},00</span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">ID da Transação</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm text-gray-900">{dadosCompra.transacaoId}</span>
                    <button
                      onClick={() => copiarCredencial(dadosCompra.transacaoId, 'ID')}
                      className="text-blue-600 hover:text-blue-700 text-xs"
                    >
                      📋
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Empresa</span>
                  <span className="text-gray-900">{dadosCompra.empresa}</span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">Email da Empresa</span>
                  <span className="text-gray-900">{dadosCompra.email}</span>
                </div>
                
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-600">Data da Compra</span>
                  <span className="text-gray-900">{new Date().toLocaleDateString('pt-BR')}</span>
                </div>
              </div>
            )}
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <LoadingButton
                onClick={baixarRecibo}
                variant="secondary"
                size="md"
                className="w-full"
              >
                📄 Baixar Recibo
              </LoadingButton>
            </div>
          </div>

          {/* Credenciais de Acesso */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-3">🔑</span>
              Seus Dados de Acesso
            </h2>
            
            {dadosCompra && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">Credenciais do Sistema</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-blue-800 mb-1">
                        Email de Login
                      </label>
                      <div className="bg-white border border-blue-300 rounded-lg p-3 flex items-center justify-between">
                        <code className="text-blue-900 font-mono text-sm">{dadosCompra.credenciais.email}</code>
                        <button
                          onClick={() => copiarCredencial(dadosCompra.credenciais.email, 'Email')}
                          className="text-blue-600 hover:text-blue-700 ml-2"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-blue-800 mb-1">
                        Senha Temporária
                      </label>
                      <div className="bg-white border border-blue-300 rounded-lg p-3 flex items-center justify-between">
                        <code className="text-blue-900 font-mono font-bold text-lg">{dadosCompra.credenciais.senha}</code>
                        <button
                          onClick={() => copiarCredencial(dadosCompra.credenciais.senha, 'Senha')}
                          className="text-blue-600 hover:text-blue-700 ml-2"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>⚠️ Importante:</strong> Altere sua senha no primeiro acesso por segurança.
                    </p>
                  </div>
                </div>
                
                {/* Status do Email */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    {emailEnviado ? (
                      <>
                        <span className="text-green-500 text-xl mr-3">✅</span>
                        <div>
                          <h4 className="font-semibold text-green-900">Email enviado!</h4>
                          <p className="text-sm text-green-700">
                            Enviamos suas credenciais para {dadosCompra.email}
                          </p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-500 border-t-transparent mr-3"></div>
                        <div>
                          <h4 className="font-semibold text-green-900">Enviando email...</h4>
                          <p className="text-sm text-green-700">
                            Suas credenciais serão enviadas para {dadosCompra.email}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Próximos Passos */}
        <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">🚀</span>
            Próximos Passos
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="text-4xl mb-3">1️⃣</div>
              <h3 className="font-semibold text-gray-900 mb-2">Acesse o Sistema</h3>
              <p className="text-sm text-gray-600 mb-4">
                Use suas credenciais para fazer login no StockPro
              </p>
              <div className="text-xs text-blue-600 bg-blue-100 rounded-lg p-2">
                💡 Dica: Salve suas credenciais em local seguro
              </div>
            </div>
            
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="text-4xl mb-3">2️⃣</div>
              <h3 className="font-semibold text-gray-900 mb-2">Configure sua Empresa</h3>
              <p className="text-sm text-gray-600 mb-4">
                Cadastre seus produtos e configure o sistema
              </p>
              <div className="text-xs text-green-600 bg-green-100 rounded-lg p-2">
                �� Comece com 10-20 produtos principais
              </div>
            </div>
            
            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <div className="text-4xl mb-3">3️⃣</div>
              <h3 className="font-semibold text-gray-900 mb-2">Comece a Vender</h3>
              <p className="text-sm text-gray-600 mb-4">
                Use o PDV para realizar suas primeiras vendas
              </p>
              <div className="text-xs text-purple-600 bg-purple-100 rounded-lg p-2">
                🛒 PDV otimizado para vendas rápidas
              </div>
            </div>
          </div>
        </div>

        {/* Recursos Disponíveis */}
        <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">⭐</span>
            O que você pode fazer agora
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📦</span>
                <div>
                  <h4 className="font-semibold text-gray-900">Gerenciar Produtos</h4>
                  <p className="text-sm text-gray-600">Cadastre, edite e organize seu estoque</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🛒</span>
                <div>
                  <h4 className="font-semibold text-gray-900">PDV Integrado</h4>
                  <p className="text-sm text-gray-600">Vendas rápidas com código de barras</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📊</span>
                <div>
                  <h4 className="font-semibold text-gray-900">Relatórios</h4>
                  <p className="text-sm text-gray-600">Acompanhe vendas e performance</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📱</span>
                <div>
                  <h4 className="font-semibold text-gray-900">Acesso Mobile</h4>
                  <p className="text-sm text-gray-600">Funciona em qualquer dispositivo</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-2xl">☁️</span>
                <div>
                  <h4 className="font-semibold text-gray-900">Backup Automático</h4>
                  <p className="text-sm text-gray-600">Seus dados sempre seguros na nuvem</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🎯</span>
                <div>
                  <h4 className="font-semibold text-gray-900">Alertas Inteligentes</h4>
                  <p className="text-sm text-gray-600">Notificações de estoque baixo</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <LoadingButton
            onClick={acessarSistema}
            variant="primary"
            size="lg"
            className="px-8 py-4 text-lg"
          >
            🚀 Acessar o StockPro Agora
          </LoadingButton>
          
          <LoadingButton
            onClick={() => router.push('/vendas')}
            variant="secondary"
            size="lg"
            className="px-8 py-4 text-lg"
          >
            🏠 Voltar ao Site
          </LoadingButton>
        </div>

        {/* Suporte */}
        <div className="text-center mt-12">
          <div className="bg-gray-100 rounded-lg p-6 max-w-2xl mx-auto">
            <h3 className="font-semibold text-gray-900 mb-2">💬 Precisa de Ajuda?</h3>
            <p className="text-gray-600 mb-4">
              Nossa equipe está pronta para te ajudar a começar
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
              <a 
                href="mailto:suporte@stockpro.com" 
                className="text-blue-600 hover:text-blue-700"
              >
                📧 suporte@stockpro.com
              </a>
              <a 
                href="https://wa.me/5511999999999" 
                 
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-700"
              >
                📱 (11) 99999-9999
              </a>
              <span className="text-purple-600">💬 Chat ao vivo</span>
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>🎯 Dica:</strong> Acesse nosso canal no YouTube para tutoriais completos sobre como usar o StockPro!
              </p>
            </div>
          </div>
        </div>

        {/* Rodapé com informações importantes */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>🔒 Seus dados estão seguros e protegidos</p>
          <p>✅ Conta ativa por 7 dias grátis, depois R\$ {dadosCompra?.valor}/mês</p>
          <p>📞 Suporte técnico incluído em todos os planos</p>
        </div>
      </div>
    </div>
  )
}