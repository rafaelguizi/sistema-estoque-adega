'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useFirestore } from '@/hooks/useFirestore'
import { useToastContext } from '@/components/ToastProvider'
import LoadingButton from '@/components/LoadingButton'
import MobileHeader from '@/components/MobileHeader'
import ProtectedRoute from '@/components/ProtectedRoute'

interface Fornecedor {
  id: string
  nome: string
  razaoSocial?: string
  cnpj?: string
  telefone?: string
  email?: string
  endereco?: string
  contato?: string
  ativo: boolean
  dataCadastro: string
  userId: string
}

export default function Fornecedores() {
  const router = useRouter()
  const { user } = useAuth()
  const toast = useToastContext()
  
  // Hooks do Firestore
  const { 
    data: fornecedores, 
    loading: loadingFornecedores, 
    addDocument, 
    updateDocument, 
    deleteDocument 
  } = useFirestore<Fornecedor>('fornecedores')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    nome: '',
    razaoSocial: '',
    cnpj: '',
    telefone: '',
    email: '',
    endereco: '',
    contato: ''
  })

  // Filtrar fornecedores pela busca
  const fornecedoresFiltrados = fornecedores ? fornecedores.filter(fornecedor =>
    fornecedor.nome.toLowerCase().includes(busca.toLowerCase()) ||
    fornecedor.razaoSocial?.toLowerCase().includes(busca.toLowerCase()) ||
    fornecedor.cnpj?.includes(busca) ||
    fornecedor.email?.toLowerCase().includes(busca.toLowerCase())
  ) : []

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
    setEditingId(null)
    setShowForm(false)
  }

  // Editar fornecedor
  const editarFornecedor = async (fornecedor: Fornecedor) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 400))

      setFormData({
        nome: fornecedor.nome,
        razaoSocial: fornecedor.razaoSocial || '',
        cnpj: fornecedor.cnpj || '',
        telefone: fornecedor.telefone || '',
        email: fornecedor.email || '',
        endereco: fornecedor.endereco || '',
        contato: fornecedor.contato || ''
      })
      setEditingId(fornecedor.id)
      setShowForm(true)
    } finally {
      setLoading(false)
    }
  }

  // Salvar fornecedor (novo ou editado)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('Erro de autenticação', 'Usuário não encontrado!')
      return
    }

    if (!formData.nome.trim()) {
      toast.warning('Campo obrigatório', 'Nome é obrigatório!')
      return
    }

    setLoading(true)
    try {
      const novoFornecedor = {
        ...formData,
        ativo: true,
        dataCadastro: editingId ? 
          fornecedores?.find(f => f.id === editingId)?.dataCadastro || new Date().toLocaleDateString('pt-BR') :
          new Date().toLocaleDateString('pt-BR'),
        userId: user.uid
      }

      if (editingId) {
        await updateDocument(editingId, novoFornecedor)
        toast.success('Fornecedor atualizado!', 'Dados atualizados com sucesso!')
      } else {
        await addDocument(novoFornecedor)
        toast.success('Fornecedor cadastrado!', 'Novo fornecedor criado com sucesso!')
      }

      resetForm()
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error)
      toast.error('Erro ao salvar', 'Não foi possível salvar o fornecedor!')
    } finally {
      setLoading(false)
    }
  }

  // Alternar status ativo/inativo
  const toggleStatus = async (id: string) => {
    if (!fornecedores) return

    setLoading(true)
    try {
      const fornecedor = fornecedores.find(f => f.id === id)
      if (!fornecedor) return

      await updateDocument(id, { ...fornecedor, ativo: !fornecedor.ativo })

      const novoStatus = !fornecedor.ativo
      toast.success(
        `Fornecedor ${novoStatus ? 'ativado' : 'inativado'}!`,
        `Status alterado com sucesso!`
      )
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast.error('Erro ao alterar status', 'Não foi possível alterar o status!')
    } finally {
      setLoading(false)
    }
  }

  // Excluir fornecedor
  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este fornecedor?')) {
      setLoading(true)
      try {
        await deleteDocument(id)
        toast.success('Fornecedor excluído!', 'Fornecedor removido com sucesso!')
      } catch (error) {
        console.error('Erro ao excluir fornecedor:', error)
        toast.error('Erro ao excluir', 'Não foi possível excluir o fornecedor!')
      } finally {
        setLoading(false)
      }
    }
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
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <MobileHeader title="Gestão de Fornecedores" currentPage="/fornecedores" />

        <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">

          {/* Loading de carregamento inicial */}
          {loadingFornecedores && (
            <div className="bg-white rounded-lg shadow-lg p-8 sm:p-12 mb-6">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-green-500 border-t-transparent mb-4 sm:mb-6"></div>
                <p className="text-gray-600 font-medium text-base sm:text-lg">Carregando fornecedores...</p>
                <p className="text-gray-500 text-sm mt-2">Sincronizando dados do Firebase</p>
              </div>
            </div>
          )}

          {/* Cabeçalho da página */}
          {!loadingFornecedores && (
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">🏭 Gestão de Fornecedores</h1>
                <p className="text-gray-600 text-sm sm:text-base">Cadastre e gerencie seus fornecedores</p>
              </div>
              <LoadingButton
                onClick={showForm ? resetForm : () => setShowForm(true)}
                variant={showForm ? "secondary" : "success"}
                size="md"
                className="w-full sm:w-auto"
                disabled={loading}
              >
                {showForm ? '❌ Cancelar' : '➕ Novo Fornecedor'}
              </LoadingButton>
            </div>
          )}

          {/* Estatísticas */}
          {!loadingFornecedores && fornecedores && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6">
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl sm:text-3xl">🏭</div>
                  </div>
                  <div className="ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Total de Fornecedores</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{fornecedores.length}</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl sm:text-3xl">✅</div>
                  </div>
                  <div className="ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Fornecedores Ativos</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">
                      {fornecedores.filter(f => f.ativo).length}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="text-2xl sm:text-3xl">❌</div>
                  </div>
                  <div className="ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Fornecedores Inativos</p>
                    <p className="text-xl sm:text-2xl font-bold text-red-600">
                      {fornecedores.filter(f => !f.ativo).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Formulário */}
          {showForm && (
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg mb-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">
                {editingId ? '✏️ Editar Fornecedor' : '➕ Novo Fornecedor'}
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
                    className="w-full p-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-800 font-medium text-sm sm:text-base"
                    placeholder="Nome do fornecedor"
                    disabled={loading}
                  />
                </div>

                {/* Razão Social */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social</label>
                  <input
                    type="text"
                    value={formData.razaoSocial}
                    onChange={(e) => setFormData({...formData, razaoSocial: e.target.value})}
                    className="w-full p-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-800 font-medium text-sm sm:text-base"
                    placeholder="Razão social"
                    disabled={loading}
                  />
                </div>

                {/* CNPJ */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({...formData, cnpj: e.target.value.replace(/\D/g, '')})}
                    className="w-full p-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-800 font-medium text-sm sm:text-base"
                    placeholder="00.000.000/0000-00"
                    maxLength={14}
                    disabled={loading}
                  />
                </div>

                {/* Telefone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                  <input
                    type="text"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value.replace(/\D/g, '')})}
                    className="w-full p-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-800 font-medium text-sm sm:text-base"
                    placeholder="(11) 99999-9999"
                    maxLength={11}
                    disabled={loading}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full p-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-800 font-medium text-sm sm:text-base"
                    placeholder="contato@fornecedor.com"
                    disabled={loading}
                  />
                </div>

                {/* Contato */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pessoa de Contato</label>
                  <input
                    type="text"
                    value={formData.contato}
                    onChange={(e) => setFormData({...formData, contato: e.target.value})}
                    className="w-full p-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-800 font-medium text-sm sm:text-base"
                    placeholder="Nome do responsável"
                    disabled={loading}
                  />
                </div>

                {/* Endereço */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Endereço</label>
                  <textarea
                    value={formData.endereco}
                    onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                    className="w-full p-3 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white text-gray-800 font-medium text-sm sm:text-base"
                    placeholder="Endereço completo"
                    rows={3}
                    disabled={loading}
                  />
                </div>

                <div className="md:col-span-2 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <LoadingButton
                    type="submit"
                    isLoading={loading}
                    loadingText="Salvando..."
                    variant="success"
                    size="md"
                    className="flex-1"
                  >
                    {editingId ? '💾 Atualizar' : '✅ Cadastrar'}
                  </LoadingButton>
                  <LoadingButton
                    type="button"
                    onClick={resetForm}
                    variant="secondary"
                    size="md"
                    className="flex-1"
                    disabled={loading}
                  >
                    ❌ Cancelar
                  </LoadingButton>
                </div>
              </form>
            </div>
          )}

          {/* Busca */}
          {!loadingFornecedores && (
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full p-3 sm:p-4 border-2 border-gray-400 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white pl-10 sm:pl-12 text-gray-800 font-medium text-sm sm:text-base"
                  placeholder="🔍 Buscar fornecedores por nome, razão social, CNPJ ou email..."
                />
                <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base">
                  🔍
                </div>
              </div>
            </div>
          )}

          {/* Lista de Fornecedores */}
          {!loadingFornecedores && (
            <div className="bg-white shadow-lg rounded-lg overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-bold text-gray-800">
                  📋 Lista de Fornecedores ({fornecedoresFiltrados.length})
                </h3>
              </div>
              
              {fornecedoresFiltrados.length === 0 ? (
                <div className="p-6 sm:p-8 text-center">
                  <div className="text-3xl sm:text-4xl mb-4">🏭</div>
                  <h4 className="text-base sm:text-lg font-semibold text-gray-600 mb-2">
                    {!fornecedores || fornecedores.length === 0 
                      ? "Nenhum fornecedor cadastrado" 
                      : "Nenhum fornecedor encontrado"
                    }
                  </h4>
                  <p className="text-gray-500 text-sm sm:text-base mb-4">
                    {!fornecedores || fornecedores.length === 0 
                      ? "Cadastre seus primeiros fornecedores para começar!"
                      : "Tente alterar os termos de busca."
                    }
                  </p>
                  <LoadingButton
                    onClick={() => setShowForm(true)}
                    variant="success"
                    size="md"
                    className="w-full sm:w-auto"
                  >
                    ➕ Novo Fornecedor
                  </LoadingButton>
                </div>
              ) : (
                <>
                  {/* Versão Mobile - Cards */}
                  <div className="block sm:hidden">
                    <div className="divide-y divide-gray-200">
                      {fornecedoresFiltrados.map((fornecedor) => (
                        <div key={fornecedor.id} className="p-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="text-sm font-bold text-gray-900 truncate">{fornecedor.nome}</h4>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  fornecedor.ativo
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {fornecedor.ativo ? '✅ Ativo' : '❌ Inativo'}
                                </span>
                              </div>

                              <div className="space-y-1 text-xs text-gray-600">
                                {fornecedor.razaoSocial && (
                                  <p><span className="font-medium">Razão Social:</span> {fornecedor.razaoSocial}</p>
                                )}
                                {fornecedor.cnpj && (
                                  <p><span className="font-medium">CNPJ:</span> {formatCNPJ(fornecedor.cnpj)}</p>
                                )}
                                {fornecedor.telefone && (
                                  <p><span className="font-medium">Telefone:</span> {formatTelefone(fornecedor.telefone)}</p>
                                )}
                                {fornecedor.email && (
                                  <p><span className="font-medium">Email:</span> {fornecedor.email}</p>
                                )}
                                {fornecedor.contato && (
                                  <p><span className="font-medium">Contato:</span> {fornecedor.contato}</p>
                                )}
                                <p><span className="font-medium">Cadastro:</span> {fornecedor.dataCadastro}</p>
                              </div>
                            </div>

                            {/* Ações Mobile */}
                            <div className="flex flex-col space-y-2 ml-4">
                              <LoadingButton
                                onClick={() => editarFornecedor(fornecedor)}
                                isLoading={loading}
                                variant="primary"
                                size="sm"
                                className="text-xs px-2 py-1"
                              >
                                ✏️
                              </LoadingButton>
                              <LoadingButton
                                onClick={() => toggleStatus(fornecedor.id)}
                                isLoading={loading}
                                variant={fornecedor.ativo ? "warning" : "success"}
                                size="sm"
                                className="text-xs px-2 py-1"
                              >
                                {fornecedor.ativo ? '⏸️' : '▶️'}
                              </LoadingButton>
                              <LoadingButton
                                onClick={() => handleDelete(fornecedor.id)}
                                isLoading={loading}
                                variant="danger"
                                size="sm"
                                className="text-xs px-2 py-1"
                              >
                                🗑️
                              </LoadingButton>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Versão Desktop - Tabela */}
                  <div className="hidden sm:block overflow-x-auto">
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
                            <td className="px-6 py-4 text-sm font-medium">
                              <div className="flex space-x-2">
                                <LoadingButton
                                  onClick={() => editarFornecedor(fornecedor)}
                                  isLoading={loading}
                                  variant="primary"
                                  size="sm"
                                >
                                  ✏️
                                </LoadingButton>
                                <LoadingButton
                                  onClick={() => toggleStatus(fornecedor.id)}
                                  isLoading={loading}
                                  variant={fornecedor.ativo ? "warning" : "success"}
                                  size="sm"
                                >
                                  {fornecedor.ativo ? '⏸️' : '▶️'}
                                </LoadingButton>
                                <LoadingButton
                                  onClick={() => handleDelete(fornecedor.id)}
                                  isLoading={loading}
                                  variant="danger"
                                  size="sm"
                                >
                                  🗑️
                                </LoadingButton>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

        </main>
      </div>
    </ProtectedRoute>
  )
}