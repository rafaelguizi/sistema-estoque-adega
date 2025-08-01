'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToastContext } from '@/components/ToastProvider'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const router = useRouter()
  const toast = useToastContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    console.log('🔑 Tentando fazer login...')

    try {
      // Importar Firebase dinamicamente
      const { auth } = await import('@/lib/firebase')
      const { signInWithEmailAndPassword } = await import('firebase/auth')

      if (!auth) {
        console.log('❌ Firebase Auth não disponível')
        throw new Error('Firebase Auth não inicializado')
      }

      console.log('🔥 Fazendo login com Firebase...')
      await signInWithEmailAndPassword(auth, email, password)
      
      console.log('✅ Login realizado com sucesso!')
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
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
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
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
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
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                placeholder="Sua senha"
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Precisa de acesso?{' '}
              <a href="/register" className="text-blue-600 hover:text-blue-500 font-medium">
                Solicite uma conta aqui
              </a>
            </p>
          </div>

          {/* Informações para o administrador */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <h4 className="text-sm font-medium text-blue-800 mb-2">ℹ️ Informações</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Use o email e senha fornecidos pelo administrador</li>
              <li>• Contas são criadas apenas pelo administrador do sistema</li>
              <li>• Em caso de problemas, entre em contato com o suporte</li>
            </ul>
          </div>

          {/* Debug Info */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-4">
            <p className="text-xs text-gray-600">
              <strong>Debug:</strong> Login direto com Firebase (sem contexto)
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}