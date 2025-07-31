'use client'
import { useState, useEffect } from 'react'

interface Company {
  id: string
  name: string
  email: string
  plan: string
  status: string
  trialEndsAt: string | null
  createdAt: string
  users: { name: string; email: string }[]
}

export default function AdminDashboard() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/admin/companies')
      const data = await response.json()
      setCompanies(data.companies || [])
    } catch (error) {
      console.error('Erro ao buscar empresas:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCompanyStatus = async (companyId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE'
    
    try {
      const response = await fetch('/api/admin/companies/toggle-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, status: newStatus })
      })

      if (response.ok) {
        fetchCompanies() // Recarregar lista
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error)
    }
  }

  const extendTrial = async (companyId: string, days: number) => {
    try {
      const response = await fetch('/api/admin/companies/extend-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, days })
      })

      if (response.ok) {
        fetchCompanies() // Recarregar lista
        alert(`✅ Trial estendido por ${days} dias!`)
      }
    } catch (error) {
      console.error('Erro ao estender trial:', error)
    }
  }

  const getDaysLeft = (trialEndsAt: string | null) => {
    if (!trialEndsAt) return null
    
    const now = new Date()
    const endDate = new Date(trialEndsAt)
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            🔧 Painel Administrativo - StockPro
          </h1>
          <p className="text-gray-600 mt-2">
            Gerencie todos os clientes e suas assinaturas
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-blue-600">
              {companies.length}
            </div>
            <div className="text-gray-600">Total de Clientes</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-green-600">
              {companies.filter(c => c.status === 'ACTIVE').length}
            </div>
            <div className="text-gray-600">Clientes Ativos</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-yellow-600">
              {companies.filter(c => c.status === 'TRIAL').length}
            </div>
            <div className="text-gray-600">Em Trial</div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-red-600">
              {companies.filter(c => c.status === 'SUSPENDED').length}
            </div>
            <div className="text-gray-600">Suspensos</div>
          </div>
        </div>

        {/* Companies Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Lista de Clientes
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                    Trial
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuários
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {companies.map((company) => {
                  const daysLeft = getDaysLeft(company.trialEndsAt)
                  return (
                    <tr key={company.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {company.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {company.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {company.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          company.status === 'ACTIVE' 
                            ? 'bg-green-100 text-green-800'
                            : company.status === 'SUSPENDED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {company.status === 'ACTIVE' ? 'Ativo' : 
                           company.status === 'SUSPENDED' ? 'Suspenso' : 'Trial'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {company.status === 'TRIAL' && daysLeft !== null ? (
                          <div>
                            <div className={`font-medium ${daysLeft <= 1 ? 'text-red-600' : daysLeft <= 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                              {daysLeft > 0 ? `${daysLeft} dias restantes` : 'Expirado'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(company.trialEndsAt!).toLocaleDateString('pt-BR')}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {company.users.length} usuário(s)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button
                          onClick={() => toggleCompanyStatus(company.id, company.status)}
                          className={`px-3 py-1 rounded text-white text-xs ${
                            company.status === 'ACTIVE'
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-green-600 hover:bg-green-700'
                          }`}
                        >
                          {company.status === 'ACTIVE' ? 'Suspender' : 'Ativar'}
                        </button>
                        
                        {company.status === 'TRIAL' && (
                          <button
                            onClick={() => extendTrial(company.id, 7)}
                            className="px-3 py-1 rounded text-white text-xs bg-blue-600 hover:bg-blue-700"
                          >
                            +7 dias
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}