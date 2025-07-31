'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Fornecedor {
  id: number
  nome: string
  razaoSocial?: string
  cnpj?: string
  telefone?: string
  email?: string
  endereco?: string
  contato?: string
  ativo: boolean
  dataCadastro: string
}

export default function Fornecedores() {
  const router = useRouter()
  
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null)
  const [busca, setBusca] = useState('')
  
  const [formData, setFormData] = useState({
    nome: '',
    razaoSocial: '',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    contato: ''
  })

  // Carregar fornecedores do localStorage
  useEffect(() => {
    const fornecedoresSalvos = localStorage.getItem('stockpro_fornecedores')
    if (fornecedoresSalvos) {
      try {
        setFornecedores(JSON.parse(fornecedoresSalvos))
      } catch (error) {
        console.error('Erro ao carregar fornecedores:', error)
      }
    }
  }, [])

  // Salvar fornecedores no localStorage
  const salvarFornecedores = (novosFornecedores: Fornecedor[]) => {
    localStorage.setItem('stockpro_fornecedores', JSON.stringify(novosFornecedores))
    setFornecedores(novosFornecedores)
  }

  // Filtrar fornecedores pela busca
  const fornecedoresFiltrados = fornecedores.filter(fornecedor =>
    fornecedor.nome.toLowerCase().includes(busca.toLowerCase()) ||
    fornecedor.razaoSocial?.toLowerCase().includes(busca.toLowerCase()) ||
    fornecedor.cnpj?.includes(busca) ||
    fornecedor.email?.toLowerCase().includes(busca.toLowerCase())
  )

  // Resetar formulário
  const resetForm = () => {
    setFormData({
      nome: '',
      razaoSocial: '',
      cnpj: '',
      telefone: '',
      email: '',
      endereco: '',
      contato: ''
    })
    setEditingFornecedor(null)
    setShowForm(false)
  }

  // Editar fornecedor
  const editarFornecedor = (fornecedor: Fornecedor) => {
    setFormData({
      nome: fornecedor.nome,
      razaoSocial: fornecedor.razaoSocial || '',
      cnpj: fornecedor.cnpj || '',
      telefone: fornecedor.telefone || '',
      email: fornecedor.email || '',
      endereco: fornecedor.endereco || '',
      contato: fornecedor.contato || ''
    })
    setEditingFornecedor(fornecedor)
    setShowForm(true)
  }

  // Salvar fornecedor (novo ou editado)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome.trim()) {
      alert('Nome é obrigatório!')
      return
    }

    const agora = new Date()

    if (editingFornecedor) {
      // Editando fornecedor existente
      const fornecedoresAtualizados = fornecedores.map(f =>
        f.id === editingFornecedor.id
          ? { ...f, ...formData }
          : f
      )
      salvarFornecedores(fornecedoresAtualizados)
      alert('Fornecedor atualizado com sucesso!')
    } else {
      // Criando novo fornecedor
      const novoFornecedor: Fornecedor = {
        id: Date.now(),
        ...formData,
        ativo: true,
        dataCadastro: agora.toLocaleDateString('pt-BR')
      }
      
      salvarFornecedores([...fornecedores, novoFornecedor])
      alert('Fornecedor cadastrado com sucesso!')
    }

    resetForm()
  }

  // Alternar status ativo/inativo
  const toggleStatus = (id: number) => {
    const fornecedoresAtualizados = fornecedores.map(f =>
      f.id === id ? { ...f, ativo: !f.ativo } : f
    )
    salvarFornecedores(fornecedoresAtualizados)
  }

  // Formatação de CNPJ
  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  // Formatação de telefone
  const formatTelefone = (telefone: string) => {
    if (telefone.length === 11) {
      return telefone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    return telefone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-2xl font-bold text-gray-800 hover:text-purple-600"
              >
                📦 StockPro
              </button>
              <span className="text-gray-400">|</span>
              <h2 className="text-xl font-semibold text-gray-700">Fornecedores</h2>
            </div>
            <div className="flex space-x-4">
              <button 
                onClick={() => router.push('/produtos')}
                className="text-purple-600 hover:text-purple-800"
              >
                📦 Produtos
              </button>
              <button 
                onClick={() => router.push('/movimentacoes')}
                className="text-blue-600 hover:text-blue-800"
              >
                ✏️ Movimentações
              </button>
              <button 
                onClick={() => router.push('/relatorios')}
                className="text-orange-600 hover:text-orange-800"
              >
                📊 Relatórios
              </button>
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-purple-600 hover:text-purple-800"
              >
                ← Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Cabeçalho da página */}
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">🏭 Gestão de Fornecedores</h1>
              <p className="text-gray-600">Cadastre e gerencie seus fornecedores</p>
            </div>
            <button
              onClick={showForm ? resetForm : () => setShowForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg"
            >
              {showForm ? '❌ Cancelar' : '➕ Novo Fornecedor'}
            </button>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-3xl">🏭</div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total de Fornecedores</p>
                  <p className="text-2xl font-bold text-gray-900">{fornecedores.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-3xl">✅</div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Fornecedores Ativos</p>
                  <p className="text-2xl font-bold text-green-600">
                    {fornecedores.filter(f => f.ativo).length}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="text-3xl">❌</div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Fornecedores Inativos</p>
                  <p className="text-2xl font-bold text-red-600">
                    {fornecedores.filter(f => !f.ativo).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Formulário */}
          {showForm && (
            <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                {editingFornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Nome */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    className="w-full p-3 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 text-gray-800 font-bold"
                    placeholder="Nome do fornecedor"
                  />
                </div>

                {/* Razão Social */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social</label>
                  <input
                    type="text"
                    value={formData.razaoSocial}
                    onChange={(e) => setFormData({...formData, razaoSocial: e.target.value})}
                    className="w-full p-3 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 text-gray-800 font-bold"
                    placeholder="Razão social"
                  />
                </div>

                {/* CNPJ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({...formData, cnpj: e.target.value.replace(/\D/g, '')})}
                    className="w-full p-3 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 text-gray-800 font-bold"
                    placeholder="00.000.000/0000-00"
                    maxLength={14}
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value.replace(/\D/g, '')})}
                    className="w-full p-3 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 text-gray-800 font-bold"
                    placeholder="(11) 99999-9999"
                    maxLength={11}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full p-3 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 text-gray-800 font-bold"
                    placeholder="contato@fornecedor.com"
                  />
                </div>

                {/* Contato */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pessoa de Contato</label>
                  <input
                    type="text"
                    value={formData.contato}
                    onChange={(e) => setFormData({...formData, contato: e.target.value})}
                    className="w-full p-3 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 text-gray-800 font-bold"
                    placeholder="Nome do responsável"
                  />
                </div>

                {/* Endereço */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                  <textarea
                    value={formData.endereco}
                    onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                    className="w-full p-3 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-gray-50 text-gray-800 font-bold"
                    placeholder="Endereço completo"
                    rows={3}
                  />
                </div>

                <div className="md:col-span-2 flex space-x-4">
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg"
                  >
                    {editingFornecedor ? '💾 Atualizar' : '✅ Cadastrar'}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg"
                  >
                    ❌ Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Busca */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full p-4 border-2 border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white pl-12 text-gray-800 font-bold"
                placeholder="🔍 Buscar fornecedores por nome, razão social, CNPJ ou email..."
              />
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                🔍
              </div>
            </div>
          </div>

          {/* Lista de Fornecedores */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-800">
                Lista de Fornecedores ({fornecedoresFiltrados.length})
              </h3>
            </div>
            
            {fornecedoresFiltrados.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-4">🏭</div>
                <h4 className="text-lg font-semibold text-gray-600 mb-2">
                  {fornecedores.length === 0 
                    ? "Nenhum fornecedor cadastrado" 
                    : "Nenhum fornecedor encontrado"
                  }
                </h4>
                <p className="text-gray-500">
                  {fornecedores.length === 0 
                    ? "Cadastre seus primeiros fornecedores para começar!"
                    : "Tente alterar os termos de busca."
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fornecedor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CNPJ</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cadastro</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fornecedoresFiltrados.map((fornecedor) => (
                      <tr key={fornecedor.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{fornecedor.nome}</div>
                            {fornecedor.razaoSocial && (
                              <div className="text-sm text-gray-500">{fornecedor.razaoSocial}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            {fornecedor.telefone && (
                              <div className="text-sm text-gray-900">📞 {formatTelefone(fornecedor.telefone)}</div>
                            )}
                            {fornecedor.email && (
                              <div className="text-sm text-gray-500">✉️ {fornecedor.email}</div>
                            )}
                            {fornecedor.contato && (
                              <div className="text-sm text-gray-500">👤 {fornecedor.contato}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {fornecedor.cnpj ? formatCNPJ(fornecedor.cnpj) : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            fornecedor.ativo 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {fornecedor.ativo ? '✅ Ativo' : '❌ Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {fornecedor.dataCadastro}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium space-x-2">
                          <button
                            onClick={() => editarFornecedor(fornecedor)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => toggleStatus(fornecedor.id)}
                            className={`${
                              fornecedor.ativo 
                                ? 'text-red-600 hover:text-red-900' 
                                : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {fornecedor.ativo ? '❌ Inativar' : '✅ Ativar'}
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
      </main>
    </div>
  )
}