'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useToastContext } from '@/components/ToastProvider'
import LoadingButton from '@/components/LoadingButton'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login } = useAuth()
  const router = useRouter()
  const toast = useToastContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      toast.error('Campos obrigatórios', 'Preencha email e senha!')
      return
    }

    setLoading(true)
    
    try {
      await login(email, password)
      toast.success('Login realizado!', 'Bem-vindo de volta!')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Erro de autenticação:', error)
      
      let errorMessage = 'Tente novamente'
      let errorTitle = 'Erro de autenticação'
      
      if (error.code === 'auth/user-not-found') {
        errorTitle = 'Usuário não encontrado'
        errorMessage = 'Verifique o email informado'
      } else if (error.code === 'auth/wrong-password') {
        errorTitle = 'Senha incorreta'
        errorMessage = 'Verifique sua senha'
      } else if (error.code === 'auth/invalid-email') {
        errorTitle = 'Email inválido'
        errorMessage = 'Formato de email incorreto'
      } else if (error.code === 'auth/too-many-requests') {
        errorTitle = 'Muitas tentativas'
        errorMessage = 'Aguarde alguns minutos'
      } else if (error.message === 'Firebase não inicializado') {
        errorTitle = 'Erro de configuração'
        errorMessage = 'Firebase não está configurado'
      }
      
      toast.error(errorTitle, errorMessage)
      
      // Log detalhado para debug
      console.log('Código do erro:', error.code)
      console.log('Mensagem do erro:', error.message)
      console.log('Erro completo:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">🍷</span>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            StockPro - Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sistema de Controle de Estoque com Firebase
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Sua senha"
                disabled={loading}
                minLength={6}
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
              🔑 Entrar com Firebase
            </LoadingButton>
          </div>

          <div className="text-center">
            <a href="/register" className="text-blue-600 hover:text-blue-500">
              Não tem conta? Cadastre-se aqui
            </a>
          </div>
        </form>

        {/* Debug Info */}
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
          <p><strong>Debug:</strong> Verifique o console do navegador para mais detalhes</p>
        </div>
      </div>
    </div>
  )
}