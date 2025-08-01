'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useToastContext } from '@/components/ToastProvider'
import LoadingButton from '@/components/LoadingButton'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { register } = useAuth()
  const router = useRouter()
  const toast = useToastContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password || !confirmPassword) {
      toast.error('Campos obrigatórios', 'Preencha todos os campos!')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Senhas diferentes', 'As senhas não coincidem!')
      return
    }

    if (password.length < 6) {
      toast.error('Senha muito fraca', 'Use pelo menos 6 caracteres!')
      return
    }

    setLoading(true)
    
    try {
      await register(email, password)
      toast.success('Conta criada!', 'Bem-vindo ao StockPro!')
      router.push('/dashboard')
    } catch (error: any) {
      console.error('Erro de registro:', error)
      
      let errorMessage = 'Tente novamente'
      let errorTitle = 'Erro ao criar conta'
      
      if (error.code === 'auth/email-already-in-use') {
        errorTitle = 'Email já cadastrado'
        errorMessage = 'Use outro email ou faça login'
      } else if (error.code === 'auth/weak-password') {
        errorTitle = 'Senha muito fraca'
        errorMessage = 'Use pelo menos 6 caracteres'
      } else if (error.code === 'auth/invalid-email') {
        errorTitle = 'Email inválido'
        errorMessage = 'Formato de email incorreto'
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
            Criar Conta - StockPro
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
                Senha (mínimo 6 caracteres)
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

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Senha
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirme sua senha"
                disabled={loading}
                minLength={6}
              />
            </div>
          </div>

          <div>
            <LoadingButton
              type="submit"
              isLoading={loading}
              loadingText="Criando conta..."
              variant="primary"
              size="lg"
              className="w-full"
            >
              ✨ Criar Conta com Firebase
            </LoadingButton>
          </div>

          <div className="text-center">
            <a href="/login" className="text-blue-600 hover:text-blue-500">
              Já tem conta? Faça login aqui
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