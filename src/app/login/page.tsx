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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">SP</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            StockPro - Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sistema de Controle de Estoque
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                placeholder="seu@email.com"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                placeholder="Sua senha"
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
              Entrar
            </LoadingButton>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Precisa de acesso?{' '}
              <button
                type="button"
                onClick={() => router.push('/register')}
                className="text-blue-600 hover:text-blue-500 font-medium underline"
              >
                Solicite uma conta aqui
              </button>
            </p>
          </div>

          {/* Informações para o usuário */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
              <span className="mr-2">ℹ️</span>
              Informações
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Use o email e senha fornecidos pelo administrador</li>
              <li>• Contas são criadas apenas pelo administrador do sistema</li>
              <li>• Em caso de problemas, entre em contato com o suporte</li>
              <li>• Todos os dados são sincronizados em tempo real</li>
            </ul>
          </div>

          {/* Credenciais de teste (remover em produção) */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <h4 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
              <span className="mr-2">🧪</span>
              Teste do Sistema
            </h4>
            <div className="text-xs text-yellow-700 space-y-1">
              <p>Para testar o sistema, você pode criar uma conta na página de registro.</p>
              <p>Ou use as credenciais fornecidas pelo administrador.</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}