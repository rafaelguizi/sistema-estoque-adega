'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useToastContext } from '@/components/ToastProvider'
import LoadingButton from '@/components/LoadingButton'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    userName: '',
    userEmail: '',
    password: '',
    confirmPassword: '',
    plan: 'BASIC'
  })
  const [loading, setLoading] = useState(false)
  
  const { register } = useAuth()
  const router = useRouter()
  const toast = useToastContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    console.log('🚀 Iniciando processo de registro...')
    console.log('📝 Dados do formulário:', {
      companyName: formData.companyName,
      companyEmail: formData.companyEmail,
      userName: formData.userName,
      userEmail: formData.userEmail,
      plan: formData.plan
    })

    // Validações
    if (formData.password !== formData.confirmPassword) {
      console.log('❌ Erro: Senhas não coincidem')
      toast.error('Senhas não coincidem', 'Verifique as senhas digitadas')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      console.log('❌ Erro: Senha muito fraca')
      toast.error('Senha muito fraca', 'Senha deve ter pelo menos 6 caracteres')
      setLoading(false)
      return
    }

    if (!formData.companyName || !formData.userName || !formData.userEmail) {
      console.log('❌ Erro: Campos obrigatórios vazios')
      toast.error('Campos obrigatórios', 'Preencha todos os campos obrigatórios')
      setLoading(false)
      return
    }

    try {
      console.log('🔥 Tentando criar usuário no Firebase Auth...')
      
      // 1. Criar usuário no Firebase Auth
      const userCredential = await register(formData.userEmail, formData.password)
      console.log('✅ Usuário criado no Firebase Auth com sucesso!', userCredential.user.uid)
      
      // 2. Salvar dados no Firestore
      console.log('💾 Tentando salvar dados no Firestore...')

      const { db } = await import('@/lib/firebase')
      const { doc, setDoc } = await import('firebase/firestore')

      if (!db) {
        console.log('❌ Erro: Firebase Firestore não está disponível')
        throw new Error('Firebase Firestore não inicializado')
      }

      // 3. Salvar dados adicionais no Firestore
      const userData = {
        companyName: formData.companyName,
        companyEmail: formData.companyEmail,
        userName: formData.userName,
        userEmail: formData.userEmail,
        plan: formData.plan,
        createdAt: new Date().toISOString(),
        trialStartDate: new Date().toISOString(),
        trialEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true,
        subscription: {
          plan: formData.plan,
          status: 'trial',
          startDate: new Date().toISOString()
        }
      }

      console.log('📄 Dados para salvar:', userData)

      await setDoc(doc(db, 'users', userCredential.user.uid), userData)
      console.log('✅ Dados salvos no Firestore com sucesso!')

      toast.success('Conta criada com sucesso!', 'Bem-vindo ao StockPro! Trial de 7 dias iniciado.')
      console.log('🎉 Registro concluído! Redirecionando...')
      router.push('/dashboard')
      
    } catch (error: any) {
      console.error('💥 Erro completo:', error)
      console.log('🔍 Código do erro:', error.code)
      console.log('📝 Mensagem do erro:', error.message)
      console.log('🔧 Stack do erro:', error.stack)
      
      let errorMessage = 'Tente novamente'
      let errorTitle = 'Erro ao criar conta'
      
      if (error.code === 'auth/email-already-in-use') {
        errorTitle = 'Email já cadastrado'
        errorMessage = 'Este email já possui uma conta. Faça login ou use outro email.'
      } else if (error.code === 'auth/weak-password') {
        errorTitle = 'Senha muito fraca'
        errorMessage = 'Use pelo menos 6 caracteres com letras e números'
      } else if (error.code === 'auth/invalid-email') {
        errorTitle = 'Email inválido'
        errorMessage = 'Formato de email incorreto'
      } else if (error.message === 'Firebase não inicializado') {
        errorTitle = 'Erro de configuração'
        errorMessage = 'Sistema temporariamente indisponível'
      } else if (error.message.includes('Firestore')) {
        errorTitle = 'Erro no banco de dados'
        errorMessage = 'Problema ao salvar dados. Tente novamente.'
      }
      
      console.log('🚨 Exibindo erro:', errorTitle, '-', errorMessage)
      toast.error(errorTitle, errorMessage)
    } finally {
      setLoading(false)
      console.log('🏁 Processo finalizado')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            🚀 Criar Nova Conta
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Comece seu trial gratuito de 7 dias com Firebase
          </p>
        </div>

        <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-xl" onSubmit={handleSubmit}>
          {/* Dados da Empresa */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">📊 Dados da Empresa</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Empresa *
              </label>
              <input
                type="text"
                required
                value={formData.companyName}
                onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                className="block w-full px-4 py-3 text-gray-900 bg-gray-50 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                placeholder="Ex: Adega do João"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email da Empresa *
              </label>
              <input
                type="email"
                required
                value={formData.companyEmail}
                onChange={(e) => setFormData({...formData, companyEmail: e.target.value})}
                className="block w-full px-4 py-3 text-gray-900 bg-gray-50 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                placeholder="contato@adegadojoao.com"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plano *
              </label>
              <select
                value={formData.plan}
                onChange={(e) => setFormData({...formData, plan: e.target.value})}
                className="block w-full px-4 py-3 text-gray-900 bg-gray-50 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                disabled={loading}
              >
                <option value="BASIC">💎 Básico - R\$ 39/mês</option>
                <option value="PRO">🚀 Profissional - R\$ 59/mês</option>
                <option value="ENTERPRISE">⭐ Enterprise - R\$ 99/mês</option>
              </select>
            </div>
          </div>

          {/* Dados do Usuário */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">👤 Dados do Administrador</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                required
                value={formData.userName}
                onChange={(e) => setFormData({...formData, userName: e.target.value})}
                className="block w-full px-4 py-3 text-gray-900 bg-gray-50 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                placeholder="João da Silva"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email de Login *
              </label>
              <input
                type="email"
                required
                value={formData.userEmail}
                onChange={(e) => setFormData({...formData, userEmail: e.target.value})}
                className="block w-full px-4 py-3 text-gray-900 bg-gray-50 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                placeholder="joao@adegadojoao.com"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha *
              </label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="block w-full px-4 py-3 text-gray-900 bg-gray-50 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Senha *
              </label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                className="block w-full px-4 py-3 text-gray-900 bg-gray-50 border-2 border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-all duration-200"
                placeholder="Digite a senha novamente"
                minLength={6}
                disabled={loading}
              />
            </div>
          </div>

          <div className="pt-4">
            <LoadingButton
              type="submit"
              isLoading={loading}
              loadingText="Criando conta..."
              variant="primary"
              size="lg"
              className="w-full"
            >
              🚀 Criar Conta e Iniciar Trial
            </LoadingButton>
          </div>

          <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <a href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Fazer login
              </a>
            </p>
          </div>

          {/* Informações do Trial */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
            <h4 className="text-sm font-medium text-green-800 mb-2">🎁 Trial Gratuito</h4>
            <ul className="text-xs text-green-700 space-y-1">
              <li>✅ 7 dias grátis para testar</li>
              <li>✅ Acesso completo ao sistema</li>
              <li>✅ Dados sincronizados na nuvem</li>
              <li>✅ Sem compromisso</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  )
}