'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useToastContext } from '@/components/ToastProvider'
import LoadingButton from '@/components/LoadingButton'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login, register } = useAuth()
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
      if (isLogin) {
        await login(email, password)
        toast.success('Login realizado!', 'Bem-vindo de volta!')
      } else {
        await register(email, password)
        toast.success('Conta criada!', 'Bem-vindo ao StockPro!')
      }
      
      router.push('/')
    } catch (error: any) {
      console.error('Erro de autenticação:', error)
      
      if (error.code === 'auth/user-not-found') {
        toast.error('Usuário não encontrado', 'Verifique o email informado')
      } else if (error.code === 'auth/wrong-password') {
        toast.error('Senha incorreta', 'Verifique sua senha')
      } else if (error.code === 'auth/email-already-in-use') {
        toast.error('Email já cadastrado', 'Use outro email ou faça login')
      } else if (error.code === 'auth/weak-password') {
        toast.error('Senha muito fraca', 'Use pelo menos 6 caracteres')
      } else {
        toast.error('Erro de autenticação', 'Tente novamente')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 sm:p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🍷 StockPro</h1>
          <p className="text-gray-600">Sistema de Gestão de Estoque</p>
        </div>

        <div className="flex mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 px-4 text-center font-medium rounded-l-lg transition-colors ${
              isLogin 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 px-4 text-center font-medium rounded-r-lg transition-colors ${
              !isLogin 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Criar Conta
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="seu@email.com"
              required
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••"
              required
              disabled={loading}
              minLength={6}
            />
          </div>

          <LoadingButton
            type="submit"
            isLoading={loading}
            loadingText={isLogin ? 'Entrando...' : 'Criando conta...'}
            variant="primary"
            size="lg"
            className="w-full"
          >
            {isLogin ? '🔑 Entrar' : '✨ Criar Conta'}
          </LoadingButton>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          <p>
            {isLogin ? 'Não tem uma conta? ' : 'Já tem uma conta? '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-600 hover:text-blue-800 font-medium"
              disabled={loading}
            >
              {isLogin ? 'Criar conta' : 'Fazer login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}