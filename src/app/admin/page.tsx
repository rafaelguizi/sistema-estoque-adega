'use client'
import { useState, useEffect } from 'react'
import { useToastContext } from '@/components/ToastProvider'
import LoadingButton from '@/components/LoadingButton'

interface User {
  id: string
  companyName: string
  companyEmail: string
  userName: string
  userEmail: string
  plan: string
  createdAt: string
  trialEndDate: string
  isActive: boolean
  subscription: {
    plan: string
    status: string
    startDate: string
  }
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formData, setFormData] = useState({
    companyName: '',
    companyEmail: '',
    userName: '',
    userEmail: '',
    password: '',
    confirmPassword: '',
    plan: 'BASIC'
  })
  
  const toast = useToastContext()

  // Carregar usuários
  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      console.log('📋 Carregando usuários...')
      const { db } = await import('@/lib/firebase')
      const { collection, getDocs, orderBy, query } = await import('firebase/firestore')

      if (!db) {
        throw new Error('Firebase não inicializado')
      }

      const usersRef = collection(db, 'users')
      const q = query(usersRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      
      const usersList: User[] = []
      snapshot.forEach((doc) => {
        usersList.push({
          id: doc.id,
          ...doc.data()
        } as User)
      })

      setUsers(usersList)
      console.log('✅ Usuários carregados:', usersList.length)
    } catch (error) {
      console.error('❌ Erro ao carregar usuários:', error)
      toast.error('Erro', 'Não foi possível carregar os usuários')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    console.log('🚀 Criando novo usuário...')

    // Validações
    if (formData.password !== formData.confirmPassword) {
      toast.error('Senhas não coincidem', 'Verifique as senhas digitadas')
      setFormLoading(false)
      return
    }

    if (formData.password.length < 6) {
      toast.error('Senha muito fraca', 'Senha deve ter pelo menos 6 caracteres')
      setFormLoading(false)
      return
    }

    if (!formData.companyName || !formData.userName || !formData.userEmail) {
      toast.error('Campos obrigatórios', 'Preencha todos os campos obrigatórios')
      setFormLoading(false)
      return
    }

    try {
      // Importar Firebase dinamicamente
      const { auth, db } = await import('@/lib/firebase')
      const { createUserWithEmailAndPassword } = await import('firebase/auth')
      const { doc, setDoc } = await import('firebase/firestore')

      if (!auth || !db) {
        throw new Error('Firebase não inicializado')
      }

      console.log('🔥 Criando usuário no Firebase Auth...')
      
      // 1. Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.userEmail, formData.password)
      console.log('✅ Usuário criado no Auth:', userCredential.user.uid)
      
      // 2. Salvar dados no Firestore
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

      await setDoc(doc(db, 'users', userCredential.user.uid), userData)
      console.log('✅ Dados salvos no Firestore')

      // 3. Criar coleção de produtos isolada para o usuário
      await setDoc(doc(db, `users/${userCredential.user.uid}/products`, 'init'), {
        initialized: true,
        createdAt: new Date().toISOString()
      })
      console.log('✅ Coleção de produtos criada')

      toast.success('Usuário criado!', `${formData.userName} foi adicionado com sucesso`)
      
      // Limpar formulário
      setFormData({
        companyName: '',
        companyEmail: '',
        userName: '',
        userEmail: '',
        password: '',
        confirmPassword: '',
        plan: 'BASIC'
      })
      
      setShowForm(false)
      loadUsers() // Recarregar lista
      
    } catch (error: any) {
      console.error('💥 Erro ao criar usuário:', error)
      
      let errorMessage = 'Tente novamente'
      let errorTitle = 'Erro ao criar usuário'
      
      if (error.code === 'auth/email-already-in-use') {
        errorTitle = 'Email já cadastrado'
        errorMessage = 'Este email já possui uma conta'
      } else if (error.code === 'auth/weak-password') {
        errorTitle = 'Senha muito fraca'
        errorMessage = 'Use pelo menos 6 caracteres'
      } else if (error.code === 'auth/invalid-email') {
        errorTitle = 'Email inválido'
        errorMessage = 'Formato de email incorreto'
      }
      
      toast.error(errorTitle, errorMessage)
    } finally {
      setFormLoading(false)
    }
  }

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const { db } = await import('@/lib/firebase')
      const { doc, updateDoc } = await import('firebase/firestore')

      if (!db) {
        throw new Error('Firebase não inicializado')
      }

      await updateDoc(doc(db, 'users', userId), {
        isActive: !currentStatus
      })

      toast.success('Status atualizado!', `Usuário ${!currentStatus ? 'ativado' : 'desativado'}`)
      loadUsers()
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error)
      toast.error('Erro', 'Não foi possível atualizar o status')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getPlanBadge = (plan: string) => {
    const badges = {
      BASIC: '💎 Básico',
      PRO: '🚀 Pro',
      ENTERPRISE: '⭐ Enterprise'
    }
    return badges[plan as keyof typeof badges] || plan
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      trial: '🎁 Trial',
      active: '✅ Ativo',
      expired: '❌ Expirado'
    }
    return badges[status as keyof typeof badges] || status
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando usuários...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🛡️ Painel Administrativo</h1>
              <p className="text-gray-600">Gerencie usuários e acessos do sistema</p>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showForm ? '❌ Cancelar' : '➕ Novo Usuário'}
            </button>
          </div>
        </div>

        {/* Formulário de Criação */}
        {showForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">➕ Criar Novo Usuário</h2>
            
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dados da Empresa */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 border-b pb-2">📊 Dados da Empresa</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome da Empresa *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.companyName}
                      onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex: Adega do João"
                      disabled={formLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email da Empresa *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.companyEmail}
                      onChange={(e) => setFormData({...formData, companyEmail: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="contato@empresa.com"
                      disabled={formLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Plano *
                    </label>
                    <select
                      value={formData.plan}
                      onChange={(e) => setFormData({...formData, plan: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={formLoading}
                    >
                      <option value="BASIC">💎 Básico - R$ 39/mês</option>
                      <option value="PRO">🚀 Profissional - R$ 59/mês</option>
                      <option value="ENTERPRISE">⭐ Enterprise - R$ 99/mês</option>
                    </select>
                  </div>
                </div>

                {/* Dados do Usuário */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 border-b pb-2">👤 Dados do Usuário</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.userName}
                      onChange={(e) => setFormData({...formData, userName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="João da Silva"
                      disabled={formLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email de Login *
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.userEmail}
                      onChange={(e) => setFormData({...formData, userEmail: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="joao@empresa.com"
                      disabled={formLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Senha *
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Mínimo 6 caracteres"
                      minLength={6}
                      disabled={formLoading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmar Senha *
                    </label>
                    <input
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Digite a senha novamente"
                      minLength={6}
                      disabled={formLoading}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  disabled={formLoading}
                >
                  Cancelar
                </button>
                <LoadingButton
                  type="submit"
                  isLoading={formLoading}
                  loadingText="Criando..."
                  variant="primary"
                >
                  🚀 Criar Usuário
                </LoadingButton>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Usuários */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              👥 Usuários Cadastrados ({users.length})
            </h2>
          </div>

          {users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum usuário cadastrado ainda.</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-blue-600 hover:text-blue-700"
              >
                Criar primeiro usuário
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plano
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trial até
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.userName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.userEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">
                            {user.companyName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.companyEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {getPlanBadge(user.plan)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            user.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? '✅ Ativo' : '❌ Inativo'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {getStatusBadge(user.subscription.status)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(user.trialEndDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => toggleUserStatus(user.id, user.isActive)}
                          className={`${
                            user.isActive 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {user.isActive ? '🚫 Desativar' : '✅ Ativar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}