'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LoadingButton from '@/components/LoadingButton'

interface Plano {
  id: string
  nome: string
  emoji: string
  preco: number
  precoOriginal?: number
  descricao: string
  recursos: string[]
  popular?: boolean
  cta: string
}

export default function VendasPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const planos: Plano[] = [
    {
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
        'Suporte por email',
        'Backup automático',
        'Acesso mobile'
      ],
      cta: 'Começar Agora'
    },
    {
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
        'Suporte prioritário',
        'Código de barras',
        'Dashboard avançado',
        'Controle de fornecedores'
      ],
      popular: true,
      cta: 'Mais Popular'
    },
    {
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
        'Treinamento incluído',
        'Integração ERP',
        'Relatórios personalizados',
        'Consultoria especializada'
      ],
      cta: 'Solicitar Demo'
    }
  ]

  const handleEscolherPlano = async (planoId: string) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      router.push(`/checkout?plano=${planoId}`)
    } finally {
      setLoading(false)
    }
  }

  const scrollToPlanos = () => {
    document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-white">
      
      {/* Header/Navbar */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-xl">📦</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">StockPro</h1>
                <p className="text-xs text-gray-500">Sistema de Estoque</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#recursos" className="text-gray-600 hover:text-gray-900 font-medium">Recursos</a>
              <a href="#planos" className="text-gray-600 hover:text-gray-900 font-medium">Planos</a>
              <a href="#contato" className="text-gray-600 hover:text-gray-900 font-medium">Contato</a>
              <button
                onClick={() => router.push('/login')}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 font-medium"
              >
                Fazer Login
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-8">
              <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                🎉 Oferta de Lançamento - 40% OFF
              </span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Revolucione seu
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> Controle de Estoque</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Sistema profissional completo com PDV integrado, código de barras, 
              relatórios avançados e muito mais. Usado por +1.000 empresas no Brasil.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <LoadingButton
                onClick={scrollToPlanos}
                variant="primary"
                size="lg"
                className="px-8 py-4 text-lg"
              >
                🚀 Experimente Grátis por 7 dias
              </LoadingButton>
              
              <button className="text-blue-600 hover:text-blue-700 font-medium flex items-center">
                ▶️ Ver demonstração (2 min)
              </button>
            </div>
            
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-500">
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                Sem taxa de setup
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                Cancele quando quiser
              </div>
              <div className="flex items-center">
                <span className="text-green-500 mr-2">✅</span>
                Suporte incluído
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recursos Principais */}
      <section id="recursos" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Tudo que você precisa em um só lugar
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Sistema completo para gerenciar seu estoque com eficiência e profissionalismo
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                emoji: '📦',
                titulo: 'Controle Total',
                descricao: 'Gerencie produtos, categorias, fornecedores e estoque em tempo real'
              },
              {
                emoji: '🛒',
                titulo: 'PDV Integrado',
                descricao: 'Ponto de venda completo com código de barras e vendas rápidas'
              },
              {
                emoji: '📊',
                titulo: 'Relatórios Avançados',
                descricao: 'Análises detalhadas de vendas, lucro e performance do negócio'
              },
              {
                emoji: '📱',
                titulo: 'Acesso Mobile',
                descricao: 'Funciona perfeitamente em celulares, tablets e computadores'
              },
              {
                emoji: '☁️',
                titulo: 'Nuvem Segura',
                descricao: 'Dados protegidos com backup automático e sincronização instantânea'
              },
              {
                emoji: '🎯',
                titulo: 'Alertas Inteligentes',
                descricao: 'Notificações automáticas de estoque baixo e produtos em falta'
              }
            ].map((recurso, index) => (
              <div key={index} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                <div className="text-4xl mb-4">{recurso.emoji}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{recurso.titulo}</h3>
                <p className="text-gray-600">{recurso.descricao}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demonstração Visual */}
      <section className="py-20 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Interface moderna e intuitiva
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Desenvolvido para ser simples de usar, mas poderoso o suficiente 
                para empresas de todos os tamanhos.
              </p>
              
              <div className="space-y-4">
                {[
                  'Dashboard com métricas em tempo real',
                  'PDV otimizado para vendas rápidas',
                  'Relatórios visuais e exportáveis',
                  'Gestão completa de produtos'
                ].map((item, index) => (
                  <div key={index} className="flex items-center">
                    <span className="text-green-500 text-xl mr-3">✅</span>
                    <span className="text-gray-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white mb-6">
                <h3 className="text-xl font-bold mb-2">🚀 Dashboard StockPro</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="opacity-80">Vendas Hoje</p>
                    <p className="text-2xl font-bold">R$ 2.847,50</p>
                  </div>
                  <div>
                    <p className="opacity-80">Produtos</p>
                    <p className="text-2xl font-bold">1.247</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">📦 Vinho Tinto Premium</span>
                    <span className="text-green-600 font-bold">R$ 89,90</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">🍾 Champagne Especial</span>
                    <span className="text-green-600 font-bold">R$ 159,90</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">🥃 Whisky 12 Anos</span>
                    <span className="text-green-600 font-bold">R$ 299,90</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Planos e Preços */}
      <section id="planos" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Escolha o plano ideal para seu negócio
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Todos os planos incluem 7 dias grátis para você testar sem compromisso
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {planos.map((plano) => (
              <div 
                key={plano.id}
                className={`relative rounded-2xl p-8 ${
                  plano.popular 
                    ? 'bg-gradient-to-b from-blue-50 to-purple-50 border-2 border-blue-500 shadow-xl' 
                    : 'bg-white border border-gray-200 shadow-lg'
                } hover:shadow-xl transition-all duration-200`}
              >
                {plano.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                      🔥 MAIS POPULAR
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <div className="text-4xl mb-2">{plano.emoji}</div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plano.nome}</h3>
                  <p className="text-gray-600 mb-4">{plano.descricao}</p>
                  
                  <div className="mb-4">
                    {plano.precoOriginal && (
                      <span className="text-gray-400 line-through text-lg mr-2">
                        R$ {plano.precoOriginal}
                      </span>
                    )}
                    <span className="text-4xl font-bold text-gray-900">
                      R$ {plano.preco}
                    </span>
                    <span className="text-gray-600">/mês</span>
                  </div>
                  
                  {plano.precoOriginal && (
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium inline-block">
                      Economize R$ {plano.precoOriginal - plano.preco}/mês
                    </div>
                  )}
                </div>
                
                <div className="space-y-3 mb-8">
                  {plano.recursos.map((recurso, index) => (
                    <div key={index} className="flex items-center">
                      <span className="text-green-500 text-lg mr-3">✅</span>
                      <span className="text-gray-700">{recurso}</span>
                    </div>
                  ))}
                </div>
                
                <LoadingButton
                  onClick={() => handleEscolherPlano(plano.id)}
                  isLoading={loading}
                  loadingText="Redirecionando..."
                  variant={plano.popular ? "primary" : "secondary"}
                  size="lg"
                  className="w-full"
                >
                  {plano.cta}
                </LoadingButton>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              💳 Aceitamos cartão de crédito, PIX e boleto bancário
            </p>
            <p className="text-sm text-gray-500">
              Todos os preços já incluem impostos. Sem taxas ocultas.
            </p>
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              O que nossos clientes dizem
            </h2>
            <p className="text-xl text-gray-600">
              Mais de 1.000 empresas já confiam no StockPro
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                nome: 'João Silva',
                empresa: 'Adega Premium',
                depoimento: 'Revolucionou nossa gestão! Antes perdíamos vendas por falta de controle, agora temos tudo organizado.',
                avatar: '👨‍💼'
              },
              {
                nome: 'Maria Santos',
                empresa: 'Distribuidora Central',
                depoimento: 'O PDV é fantástico! Vendas muito mais rápidas e relatórios que nos ajudam a tomar decisões.',
                avatar: '👩‍💼'
              },
              {
                nome: 'Carlos Oliveira',
                empresa: 'Mercado do Bairro',
                depoimento: 'Suporte excepcional e sistema muito fácil de usar. Recomendo para qualquer negócio.',
                avatar: '👨‍🔧'
              }
            ].map((depoimento, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">{depoimento.avatar}</div>
                  <div>
                    <h4 className="font-bold text-gray-900">{depoimento.nome}</h4>
                    <p className="text-gray-600 text-sm">{depoimento.empresa}</p>
                  </div>
                </div>
                <p className="text-gray-700 italic">"{depoimento.depoimento}"</p>
                <div className="flex text-yellow-400 mt-3">
                  ⭐⭐⭐⭐⭐
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Perguntas Frequentes
            </h2>
          </div>
          
          <div className="space-y-6">
            {[
              {
                pergunta: 'Como funciona o período de teste gratuito?',
                resposta: 'Você tem 7 dias para testar todas as funcionalidades sem pagar nada. Não é necessário cartão de crédito para começar.'
              },
              {
                pergunta: 'Posso cancelar a qualquer momento?',
                resposta: 'Sim! Não há fidelidade. Você pode cancelar sua assinatura a qualquer momento pelo painel administrativo.'
              },
              {
                pergunta: 'Meus dados ficam seguros?',
                resposta: 'Absolutamente! Usamos criptografia de ponta e backup automático. Seus dados ficam seguros na nuvem do Google.'
              },
              {
                pergunta: 'Funciona no celular?',
                resposta: 'Sim! O StockPro é totalmente responsivo e funciona perfeitamente em celulares, tablets e computadores.'
              },
              {
                pergunta: 'Preciso instalar algum programa?',
                resposta: 'Não! O StockPro funciona direto no navegador. Basta acessar o link e fazer login.'
              }
            ].map((faq, index) => (
              <div key={index} className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-2">❓ {faq.pergunta}</h3>
                <p className="text-gray-700">{faq.resposta}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para revolucionar seu estoque?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Junte-se a mais de 1.000 empresas que já transformaram sua gestão com o StockPro
          </p>
          
          <LoadingButton
            onClick={scrollToPlanos}
            variant="secondary"
            size="lg"
            className="px-8 py-4 text-lg bg-white text-blue-600 hover:bg-gray-100"
          >
            🚀 Começar Teste Grátis Agora
          </LoadingButton>
          
          <p className="mt-4 text-sm opacity-80">
            ✅ 7 dias grátis • ✅ Sem cartão de crédito • ✅ Suporte incluído
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer id="contato" className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold">📦</span>
                </div>
                <span className="text-xl font-bold">StockPro</span>
              </div>
              <p className="text-gray-400">
                Sistema profissional de controle de estoque para empresas modernas.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Produto</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#recursos" className="hover:text-white">Recursos</a></li>
                <li><a href="#planos" className="hover:text-white">Planos</a></li>
                <li><a href="#" className="hover:text-white">Demonstração</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Suporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Central de Ajuda</a></li>
                <li><a href="#" className="hover:text-white">Tutoriais</a></li>
                <li><a href="#" className="hover:text-white">Contato</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4">Contato</h3>
              <div className="space-y-2 text-gray-400">
                <p>📧 contato@stockpro.com</p>
                <p>📱 (11) 99999-9999</p>
                <p>💬 WhatsApp: (11) 99999-9999</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 StockPro. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}