'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useToastContext } from '@/components/ToastProvider'
import LoadingButton from '@/components/LoadingButton'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()
  const toast = useToastContext()
  const { user, loading: authLoading, login } = useAuth()

  // Redirecionar se já estiver logado
  useEffect(() => {
    if (!authLoading && user) {
      router.push('/dashboard')
    }
  }, [user, authLoading, router])

  // Mostrar loading se ainda está verificando autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Se já estiver logado, não mostrar a página de login
  if (user) {
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 🆕 TENTAR LOGIN COM API PERSONALIZADA PRIMEIRO (para clientes do sistema de vendas)
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        })

        if (response.ok) {
          const data = await response.json()
          console.log('✅ Login API realizado:', data.user)
          
          // 🆕 VERIFICAR SE É PRIMEIRO ACESSO
          if (data.user.primeiroAcesso || data.user.senhaTemporaria) {
            toast.warning('Primeiro acesso detectado', 'Você precisa alterar sua senha por segurança')
            router.push('/alterar-senha?obrigatorio=true')
            return
          }
          
          toast.success('Login realizado!', `Bem-vindo, ${data.user.name}!`)
          router.push('/dashboard')
          return
        }
      } catch (apiError) {
        console.log('🔄 API login falhou, tentando Firebase...')
      }

      // 🔄 FALLBACK PARA FIREBASE (usuários existentes)
      await login(email, password)
      toast.success('Login realizado!', 'Bem-vindo de volta!')
      router.push('/dashboard')
      
    } catch (error: any) {
      console.error('❌ Erro de autenticação:', error)
      
      let errorMessage = 'Erro ao fazer login'
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Usuário não encontrado. Verifique o email informado.'
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Senha incorreta. Verifique sua senha.'
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Formato de email inválido.'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Muitas tentativas. Aguarde alguns minutos.'
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Email ou senha incorretos.'
      } else if (error.message.includes('Firebase') && error.message.includes('não inicializado')) {
        errorMessage = 'Sistema temporariamente indisponível.'
      } else if (error.message.includes('Usuário não encontrado') || error.message.includes('Senha incorreta')) {
        errorMessage = 'Email ou senha incorretos.'
      } else {
        errorMessage = 'Erro de conexão. Tente novamente.'
      }
      
      setError(errorMessage)
      toast.error('Erro no login', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">📦</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            StockPro - Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sistema Profissional de Controle de Estoque
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <div className="flex items-center">
                  <span className="text-red-500 mr-2">❌</span>
                  {error}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email de Acesso
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm font-medium"
                  placeholder="seu@email.com"
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Senha de Acesso
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none relative block w-full px-4 py-3 border-2 border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm font-medium"
                  placeholder="••••••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <LoadingButton
                type="submit"
                isLoading={loading}
                loadingText="Entrando..."
                variant="primary"
                size="lg"
                className="w-full"
              >
                🔓 Entrar no Sistema
              </LoadingButton>
            </div>

            {/* 🆕 SEÇÃO PARA NOVOS CLIENTES */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-800 mb-2">
                  🎉 Novo no StockPro?
                </h4>
                <p className="text-sm text-green-700 mb-3">
                  Experimente grátis por 7 dias! Sem cartão de crédito.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/vendas')}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  🚀 Começar Teste Grátis
                </button>
              </div>
            </div>

            {/* SEÇÃO PARA CONTATO */}
            <div className="text-center">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  💼 Precisa de ajuda?
                </h4>
                <p className="text-sm text-blue-700 mb-2">
                  Nossa equipe está pronta para te ajudar
                </p>
                <div className="space-y-1 text-xs text-blue-600">
                  <p>📧 rafaelfelipegb.arf@gmail.com</p>
                  <p>📱 WhatsApp: (19) 99181-3749</p>
                  <p>🌐 www.stockprov2.com</p>
                </div>
              </div>
            </div>

            {/* 🆕 INFORMAÇÕES PARA CLIENTES DO SISTEMA DE VENDAS */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
                <span className="mr-2">🔑</span>
                Acabou de comprar?
              </h4>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>• Use o email e senha enviados por email</li>
                <li>• No primeiro login, você será obrigado a alterar a senha</li>
                <li>• Acesso liberado imediatamente após a compra</li>
                <li>• Dados seguros e backup automático</li>
              </ul>
            </div>

            {/* Benefícios do Sistema */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-purple-800 mb-2 flex items-center">
                <span className="mr-2">⭐</span>
                Por que escolher o StockPro?
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-purple-700">
                <div>• Controle completo</div>
                <div>• PDV integrado</div>
                <div>• Relatórios avançados</div>
                <div>• Mobile responsivo</div>
                <div>• Código de barras</div>
                <div>• Suporte 24/7</div>
              </div>
            </div>
          </form>
        </div>

        {/* Rodapé */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            © 2024 StockPro - Sistema Profissional de Gestão de Estoque
          </p>
        </div>
      </div>
    </div>
  )
}