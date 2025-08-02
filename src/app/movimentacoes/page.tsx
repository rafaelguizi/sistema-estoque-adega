'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useFirestore } from '@/hooks/useFirestore'
import { useToastContext } from '@/components/ToastProvider'
import LoadingButton from '@/components/LoadingButton'
import MobileHeader from '@/components/MobileHeader'
import ProtectedRoute from '@/components/ProtectedRoute'

interface Produto {
  id: string
  codigo: string
  nome: string
  categoria: string
  estoqueMinimo: number
  valorCompra: number
  valorVenda: number
  estoque: number
  ativo: boolean
  dataCadastro: string
  userId: string
  // 🆕 NOVOS CAMPOS PARA VALIDADE
  temValidade?: boolean
  dataValidade?: string
  diasAlerta?: number
}

interface Movimentacao {
  id: string
  produto: string
  codigo: string
  produtoId: string
  tipo: 'entrada' | 'saida'
  quantidade: number
  valorUnitario: number
  valorTotal: number
  data: string
  hora: string
  observacao: string
  userId: string
}

// 🆕 COMPONENTE DE BUSCA DE PRODUTOS
interface ProdutoSelectorProps {
  produtos: Produto[]
  onSelect: (produto: Produto | null) => void
  produtoSelecionado?: Produto | null
  disabled?: boolean
}

function ProdutoSelector({ produtos, onSelect, produtoSelecionado, disabled }: ProdutoSelectorProps) {
  const [busca, setBusca] = useState('')
  const [mostrarLista, setMostrarLista] = useState(false)
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>(produtos)

  // Filtrar produtos conforme busca
  const filtrarProdutos = (termoBusca: string) => {
    if (!termoBusca.trim()) {
      setProdutosFiltrados(produtos)
      return
    }

    const filtrados = produtos.filter(produto =>
      produto.nome.toLowerCase().includes(termoBusca.toLowerCase()) ||
      produto.codigo.toLowerCase().includes(termoBusca.toLowerCase()) ||
      produto.categoria?.toLowerCase().includes(termoBusca.toLowerCase())
    )
    
    setProdutosFiltrados(filtrados)
  }

  const handleBuscaChange = (valor: string) => {
    setBusca(valor)
    filtrarProdutos(valor)
    setMostrarLista(true)
    
    // Se limpar a busca, limpar seleção
    if (!valor.trim()) {
      onSelect(null)
    }
  }

  const handleSelect = (produto: Produto) => {
    onSelect(produto)
    setBusca(produto.nome)
    setMostrarLista(false)
  }

  const limparSelecao = () => {
    setBusca('')
    onSelect(null)
    setMostrarLista(false)
    setProdutosFiltrados(produtos)
  }

  return (
    <div className="relative">
      {/* Campo de busca */}
      <div className="relative">
        <input
          type="text"
          value={busca}
          onChange={(e) => handleBuscaChange(e.target.value)}
          onFocus={() => {
            setMostrarLista(true)
            filtrarProdutos(busca)
          }}
          className="w-full border-2 border-gray-400 rounded-lg px-4 py-3 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm pr-10"
          placeholder="🔍 Busque por nome, código ou categoria..."
          disabled={disabled}
        />
        
        {busca && (
          <button
            type="button"
            onClick={limparSelecao}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        )}
      </div>

      {/* Lista de produtos */}
      {mostrarLista && !disabled && (
        <div className="absolute z-20 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {produtosFiltrados.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {busca ? 'Nenhum produto encontrado' : 'Nenhum produto disponível'}
            </div>
          ) : (
            <>
              {produtosFiltrados.map(produto => (
                <button
                  key={produto.id}
                  type="button"
                  onClick={() => handleSelect(produto)}
                  className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 focus:bg-blue-100 focus:outline-none transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{produto.nome}</div>
                      <div className="text-sm text-gray-500 flex items-center space-x-2">
                        <span>#{produto.codigo}</span>
                        {produto.categoria && (
                          <>
                            <span>•</span>
                            <span>{produto.categoria}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>Estoque: {produto.estoque}</span>
                        <span>•</span>
                        <span>R$ {produto.valorVenda.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-1">
                      {produto.estoque <= 0 && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                          Sem estoque
                        </span>
                      )}
                      {produto.estoque > 0 && produto.estoque <= produto.estoqueMinimo && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                          Estoque baixo
                        </span>
                      )}
                      {produto.temValidade && produto.dataValidade && (
                        <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                          📅 Com validade
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}
        </div>
      )}

      {/* Produto selecionado */}
      {produtoSelecionado && !mostrarLista && (
        <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-lg">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="font-medium text-blue-900 text-lg">{produtoSelecionado.nome}</div>
              <div className="text-sm text-blue-700 mt-1 space-y-1">
                <div className="flex items-center space-x-4">
                  <span><strong>Código:</strong> #{produtoSelecionado.codigo}</span>
                  {produtoSelecionado.categoria && (
                    <span><strong>Categoria:</strong> {produtoSelecionado.categoria}</span>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <span><strong>Estoque atual:</strong> {produtoSelecionado.estoque} unidades</span>
                  <span><strong>Estoque mínimo:</strong> {produtoSelecionado.estoqueMinimo}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span><strong>Preço compra:</strong> R$ {produtoSelecionado.valorCompra.toFixed(2)}</span>
                  <span><strong>Preço venda:</strong> R$ {produtoSelecionado.valorVenda.toFixed(2)}</span>
                </div>
                
                {/* Alertas do produto */}
                <div className="flex items-center space-x-2 mt-2">
                  {produtoSelecionado.estoque <= 0 && (
                    <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                      🚫 Sem estoque
                    </span>
                  )}
                  {produtoSelecionado.estoque > 0 && produtoSelecionado.estoque <= produtoSelecionado.estoqueMinimo && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      ⚠️ Estoque baixo
                    </span>
                  )}
                  {produtoSelecionado.temValidade && (
                    <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                      �� Produto com validade
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={limparSelecao}
              className="ml-4 text-blue-600 hover:text-blue-800 font-medium"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Overlay para fechar lista */}
      {mostrarLista && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setMostrarLista(false)}
        />
      )}
    </div>
  )
}

export default function Movimentacoes() {
  const router = useRouter()
  const { user } = useAuth()
  const toast = useToastContext()
  
  // Hooks do Firestore
  const { 
    data: produtos, 
    loading: loadingProdutos,
    updateDocument: updateProduto
  } = useFirestore<Produto>('produtos')

  const { 
    data: movimentacoes, 
    loading: loadingMovimentacoes, 
    addDocument: addMovimentacao, 
    deleteDocument: deleteMovimentacao
  } = useFirestore<Movimentacao>('movimentacoes')

  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // 🆕 ESTADO PARA PRODUTO SELECIONADO
  const [produtoSelecionado, setProdutoSelecionado] = useState<Produto | null>(null)
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    tipo: 'entrada' as 'entrada' | 'saida',
    quantidade: '',
    observacao: ''
  })

  // Estados de filtro
  const [busca, setBusca] = useState('')
  const [filtroTipo, setFiltroTipo] = useState('')
  const [filtroData, setFiltroData] = useState('')
  const [filtroProduto, setFiltroProduto] = useState('')

  const resetForm = () => {
    setFormData({
      tipo: 'entrada',
      quantidade: '',
      observacao: ''
    })
    setProdutoSelecionado(null)
    setShowForm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast.error('Erro de autenticação', 'Usuário não encontrado!')
      return
    }

    setLoading(true)
    try {
      // Validações
      if (!produtoSelecionado || !formData.quantidade) {
        toast.error('Campos obrigatórios', 'Selecione um produto e informe a quantidade!')
        return
      }

      const quantidade = parseInt(formData.quantidade)

      if (quantidade <= 0) {
        toast.error('Quantidade inválida', 'Quantidade deve ser maior que zero!')
        return
      }

      if (!produtoSelecionado.ativo) {
        toast.error('Produto inativo', 'Não é possível movimentar produtos inativos!')
        return
      }

      // Verificar estoque para saídas
      if (formData.tipo === 'saida' && produtoSelecionado.estoque < quantidade) {
        toast.error('Estoque insuficiente', `Estoque atual: ${produtoSelecionado.estoque} unidades`)
        return
      }

      // Calcular novo estoque
      const novoEstoque = formData.tipo === 'entrada' 
        ? produtoSelecionado.estoque + quantidade 
        : produtoSelecionado.estoque - quantidade

      if (novoEstoque < 0) {
        toast.error('Erro no cálculo', 'Estoque não pode ficar negativo!')
        return
      }

      // Usar valor padrão do produto (entrada = valor compra, saída = valor venda)
      const valorUnitario = formData.tipo === 'entrada' ? produtoSelecionado.valorCompra : produtoSelecionado.valorVenda

      const novaMovimentacao = {
        produto: produtoSelecionado.nome,
        codigo: produtoSelecionado.codigo,
        produtoId: produtoSelecionado.id,
        tipo: formData.tipo,
        quantidade,
        valorUnitario,
        valorTotal: valorUnitario * quantidade,
        data: new Date().toLocaleDateString('pt-BR'),
        hora: new Date().toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        observacao: formData.observacao,
        userId: user.uid
      }

      // Salvar movimentação
      await addMovimentacao(novaMovimentacao)

      // Atualizar estoque do produto
      await updateProduto(produtoSelecionado.id, { ...produtoSelecionado, estoque: novoEstoque })

      const tipoTexto = formData.tipo === 'entrada' ? 'Entrada' : 'Saída'
      toast.success(
        `${tipoTexto} registrada!`, 
        `${quantidade} unidades de ${produtoSelecionado.nome}`
      )

      resetForm()
    } catch (error) {
      console.error('Erro ao salvar movimentação:', error)
      toast.error('Erro ao salvar', 'Não foi possível salvar a movimentação!')
    } finally {
      setLoading(false)
    }
  }

  const excluirMovimentacao = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta movimentação?')) return

    if (!movimentacoes || !produtos) return

    setLoading(true)
    try {
      const movimentacao = movimentacoes.find(m => m.id === id)
      if (!movimentacao) return

      // Reverter o estoque
      const produto = produtos.find(p => p.id === movimentacao.produtoId)
      if (produto) {
        const estoqueRevertido = movimentacao.tipo === 'entrada' 
          ? produto.estoque - movimentacao.quantidade 
          : produto.estoque + movimentacao.quantidade
        
        if (estoqueRevertido >= 0) {
          await updateProduto(produto.id, { ...produto, estoque: estoqueRevertido })
        }
      }
      
      await deleteMovimentacao(id)
      toast.success('Movimentação excluída!', 'Estoque foi revertido automaticamente')
    } catch (error) {
      console.error('Erro ao excluir movimentação:', error)
      toast.error('Erro ao excluir', 'Não foi possível excluir a movimentação!')
    } finally {
      setLoading(false)
    }
  }

  // Filtrar movimentações
  const movimentacoesFiltradas = movimentacoes ? movimentacoes.filter(mov => {
    const matchBusca = mov.produto.toLowerCase().includes(busca.toLowerCase()) ||
                      mov.codigo.toLowerCase().includes(busca.toLowerCase()) ||
                      mov.observacao.toLowerCase().includes(busca.toLowerCase())
    
    const matchTipo = filtroTipo === '' || mov.tipo === filtroTipo
    const matchData = filtroData === '' || mov.data === filtroData
    const matchProduto = filtroProduto === '' || mov.codigo === filtroProduto
    
    return matchBusca && matchTipo && matchData && matchProduto
  }) : []

  // Obter datas únicas
  const datasUnicas = movimentacoes ? 
    [...new Set(movimentacoes.map(m => m.data))].sort().reverse() : []

  // Produtos ativos
  const produtosAtivos = produtos ? produtos.filter(p => p.ativo) : []

  // Loading geral
  const isLoadingData = loadingProdutos || loadingMovimentacoes

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <MobileHeader title="Movimentações de Estoque" currentPage="/movimentacoes" />

        <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          
          {/* Loading de carregamento inicial */}
          {isLoadingData && (
            <div className="bg-white rounded-lg shadow-lg p-8 sm:p-12 mb-6">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-500 border-t-transparent mb-4 sm:mb-6"></div>
                <p className="text-gray-600 font-medium text-base sm:text-lg">Carregando movimentações...</p>
                <p className="text-gray-500 text-sm mt-2">Sincronizando dados do Firebase</p>
              </div>
            </div>
          )}

          {/* Botão Nova Movimentação */}
          {!isLoadingData && (
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Controle de Movimentações</h1>
              <LoadingButton
                onClick={() => setShowForm(true)}
                variant="primary"
                size="md"
                className="w-full sm:w-auto"
                disabled={produtosAtivos.length === 0}
              >
                ➕ Nova Movimentação
              </LoadingButton>
            </div>
          )}

          {/* Aviso se não há produtos */}
          {!isLoadingData && produtosAtivos.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 sm:p-6 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="text-xl sm:text-2xl">⚠️</div>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Nenhum produto ativo encontrado
                  </h3>
                  <div className="mt-2 text-xs sm:text-sm text-yellow-700">
                    <p>Para registrar movimentações, você precisa ter produtos ativos cadastrados.</p>
                  </div>
                  <div className="mt-4">
                    <LoadingButton
                      onClick={() => router.push('/produtos')}
                      variant="warning"
                      size="sm"
                    >
                      📦 Ir para Produtos
                    </LoadingButton>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filtros */}
          {!isLoadingData && produtosAtivos.length > 0 && (
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg mb-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">🔍 Filtros</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Buscar</label>
                  <input
                    type="text"
                    placeholder="Produto, código ou observação..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm placeholder-gray-600 text-sm sm:text-base"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Tipo</label>
                  <select
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="w-full border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm sm:text-base"
                  >
                    <option value="">Todos os tipos</option>
                    <option value="entrada">📥 Entradas</option>
                    <option value="saida">📤 Saídas</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Data</label>
                  <select
                    value={filtroData}
                    onChange={(e) => setFiltroData(e.target.value)}
                    className="w-full border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm sm:text-base"
                  >
                    <option value="">Todas as datas</option>
                    {datasUnicas.map(data => (
                      <option key={data} value={data}>{data}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Produto</label>
                  <select
                    value={filtroProduto}
                    onChange={(e) => setFiltroProduto(e.target.value)}
                    className="w-full border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm sm:text-base"
                  >
                    <option value="">Todos os produtos</option>
                    {produtosAtivos.map(produto => (
                      <option key={produto.codigo} value={produto.codigo}>
                        {produto.nome} (#{produto.codigo})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-end">
                  <LoadingButton
                    onClick={() => {
                      setBusca('')
                      setFiltroTipo('')
                      setFiltroData('')
                      setFiltroProduto('')
                    }}
                    variant="secondary"
                    size="md"
                    className="w-full"
                  >
                    🧹 Limpar
                  </LoadingButton>
                </div>
              </div>
            </div>
          )}

          {/* Resumo dos Filtros */}
          {!isLoadingData && movimentacoes && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                <span className="text-blue-800 font-medium text-sm sm:text-base">
                  📊 {movimentacoesFiltradas.length} de {movimentacoes.length} movimentações
                </span>
                {(busca || filtroTipo || filtroData || filtroProduto) && (
                  <span className="text-blue-600 text-xs sm:text-sm">🔍 Filtros ativos</span>
                )}
              </div>
            </div>
          )}

          {/* 🆕 FORMULÁRIO ATUALIZADO COM BUSCA DE PRODUTOS */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-4 sm:p-6 border-b">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    ➕ Nova Movimentação
                  </h3>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
                  
                  {/* 🆕 BUSCA INTELIGENTE DE PRODUTOS */}
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Produto *
                    </label>
                    <ProdutoSelector
                      produtos={produtosAtivos}
                      onSelect={setProdutoSelecionado}
                      produtoSelecionado={produtoSelecionado}
                      disabled={loading}
                    />
                    {produtosAtivos.length === 0 && (
                      <p className="text-red-600 text-sm mt-2">
                        Nenhum produto ativo encontrado. Cadastre produtos primeiro.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Tipo de Movimentação *
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, tipo: 'entrada'})}
                        className={`p-3 rounded-lg border-2 font-medium transition-all duration-200 text-sm sm:text-base ${
                          formData.tipo === 'entrada'
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-green-300'
                        }`}
                        disabled={loading}
                      >
                        📥 Entrada
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({...formData, tipo: 'saida'})}
                        className={`p-3 rounded-lg border-2 font-medium transition-all duration-200 text-sm sm:text-base ${
                          formData.tipo === 'saida'
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-red-300'
                        }`}
                        disabled={loading}
                      >
                        📤 Saída
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Quantidade *
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.quantidade}
                      onChange={(e) => setFormData({...formData, quantidade: e.target.value})}
                      className="w-full border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm placeholder-gray-600 text-sm sm:text-base"
                      placeholder="0"
                      required
                      disabled={loading}
                    />
                    
                    {/* Alertas de estoque */}
                    {produtoSelecionado && formData.tipo === 'saida' && formData.quantidade && (
                      <div className="mt-2">
                        {parseInt(formData.quantidade) > produtoSelecionado.estoque ? (
                          <div className="text-red-600 text-sm bg-red-50 p-2 rounded border border-red-200">
                            ⚠️ Quantidade maior que estoque disponível ({produtoSelecionado.estoque} unidades)
                          </div>
                        ) : (
                          <div className="text-green-600 text-sm bg-green-50 p-2 rounded border border-green-200">
                            ✅ Estoque suficiente. Restará {produtoSelecionado.estoque - parseInt(formData.quantidade)} unidades
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Observação
                    </label>
                    <textarea
                      value={formData.observacao}
                      onChange={(e) => setFormData({...formData, observacao: e.target.value})}
                      className="w-full border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm placeholder-gray-600 text-sm sm:text-base"
                      placeholder="Observações sobre a movimentação..."
                      rows={3}
                      disabled={loading}
                    />
                  </div>

                  {/* Resumo da movimentação */}
                  {produtoSelecionado && formData.quantidade && (
                    <div className="bg-gradient-to-r from-green-100 via-blue-100 to-purple-100 p-4 sm:p-5 rounded-lg border-4 border-green-500 shadow-lg">
                      <h4 className="font-bold text-gray-900 mb-3 text-base sm:text-lg flex items-center">
                        💰 <span className="ml-2">Resumo da Movimentação:</span>
                      </h4>
                      {(() => {
                        const quantidade = parseInt(formData.quantidade)
                        const valorUnitario = formData.tipo === 'entrada' ? produtoSelecionado.valorCompra : produtoSelecionado.valorVenda
                        const valorTotal = valorUnitario * quantidade
                        
                        return (
                          <div className="space-y-2 text-sm sm:text-base">
                            <div className="flex justify-between items-center p-2 bg-white bg-opacity-70 rounded-lg">
                              <span className="text-gray-800 font-medium">Produto:</span>
                              <span className="font-bold text-gray-900">{produtoSelecionado.nome}</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-white bg-opacity-70 rounded-lg">
                              <span className="text-gray-800 font-medium">Tipo:</span>
                              <span className={`font-bold px-3 py-1 rounded-full text-sm ${
                                formData.tipo === 'entrada' 
                                  ? 'bg-green-200 text-green-800' 
                                  : 'bg-red-200 text-red-800'
                              }`}>
                                {formData.tipo === 'entrada' ? '📥 Entrada' : '�� Saída'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-white bg-opacity-70 rounded-lg">
                              <span className="text-gray-800 font-medium">Quantidade:</span>
                              <span className="font-bold text-gray-900">{quantidade} unidades</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-white bg-opacity-70 rounded-lg">
                              <span className="text-gray-800 font-medium">Valor unitário:</span>
                              <span className="font-bold text-gray-900">R$ {valorUnitario.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gradient-to-r from-blue-200 to-green-200 rounded-lg border-2 border-blue-400 shadow-md">
                              <span className="text-gray-900 font-bold text-base">Valor total:</span>
                              <span className="font-bold text-blue-800 text-lg">R$ {valorTotal.toFixed(2)}</span>
                            </div>
                            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-3 rounded-r-lg">
                              <p className="text-sm text-yellow-800 font-medium">
                                💡 <strong>Valor automático:</strong> {formData.tipo === 'entrada' ? 'Preço de compra' : 'Preço de venda'} do produto
                              </p>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
                    <LoadingButton
                      type="submit"
                      isLoading={loading}
                      loadingText="Salvando..."
                      variant="primary"
                      size="md"
                      className="flex-1"
                      disabled={!produtoSelecionado || !formData.quantidade}
                    >
                      💾 Registrar Movimentação
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
            </div>
          )}

          {/* Lista de Movimentações */}
          {!isLoadingData && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">📋 Histórico de Movimentações</h3>
              </div>

              {movimentacoesFiltradas.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="text-4xl sm:text-6xl mb-4">✏️</div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Nenhuma movimentação encontrada</h3>
                  <p className="text-gray-500 mb-4 text-sm sm:text-base">
                    {!movimentacoes || movimentacoes.length === 0 
                      ? 'Comece registrando sua primeira movimentação.'
                      : 'Tente ajustar os filtros para encontrar as movimentações desejadas.'
                    }
                  </p>
                  {produtosAtivos.length > 0 && (
                    <LoadingButton
                      onClick={() => setShowForm(true)}
                      variant="primary"
                      size="md"
                      className="w-full sm:w-auto"
                    >
                      ➕ Nova Movimentação
                    </LoadingButton>
                  )}
                </div>
              ) : (
                <>
                  {/* Versão Mobile - Cards */}
                  <div className="block sm:hidden">
                    <div className="divide-y divide-gray-200">
                      {movimentacoesFiltradas.map((mov) => (
                        <div key={mov.id} className="p-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  mov.tipo === 'entrada' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {mov.tipo === 'entrada' ? '📥 Entrada' : '📤 Saída'}
                                </span>
                                <span className="text-xs text-gray-500">{mov.data} às {mov.hora}</span>
                              </div>
                              
                              <h4 className="text-sm font-bold text-gray-900 truncate mb-1">{mov.produto}</h4>
                              
                              <div className="space-y-1 text-xs text-gray-600">
                                <p><span className="font-medium">Código:</span> #{mov.codigo}</p>
                                <p><span className="font-medium">Quantidade:</span> {mov.quantidade} unidades</p>
                                <p><span className="font-medium">Valor unitário:</span> R$ {mov.valorUnitario.toFixed(2)}</p>
                                <p><span className="font-medium">Valor total:</span> R$ {mov.valorTotal.toFixed(2)}</p>
                                {mov.observacao && (
                                  <p><span className="font-medium">Obs:</span> {mov.observacao}</p>
                                )}
                              </div>
                            </div>

                            {/* Ação Mobile */}
                            <div className="ml-4">
                              <LoadingButton
                                onClick={() => excluirMovimentacao(mov.id)}
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
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data/Hora
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Produto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tipo
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantidade
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Valores
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Observação
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {movimentacoesFiltradas.map((mov) => (
                          <tr key={mov.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div>{mov.data}</div>
                              <div className="text-gray-500">{mov.hora}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{mov.produto}</div>
                              <div className="text-sm text-gray-500">#{mov.codigo}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                mov.tipo === 'entrada' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {mov.tipo === 'entrada' ? '📥 Entrada' : '�� Saída'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {mov.quantidade} unidades
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div>Unit: R$ {mov.valorUnitario.toFixed(2)}</div>
                              <div className="font-medium">Total: R$ {mov.valorTotal.toFixed(2)}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                              {mov.observacao || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <LoadingButton
                                onClick={() => excluirMovimentacao(mov.id)}
                                isLoading={loading}
                                variant="danger"
                                size="sm"
                              >
                                🗑️
                              </LoadingButton>
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

          {/* Estatísticas das Movimentações */}
          {!isLoadingData && movimentacoes && movimentacoes.length > 0 && (
            <div className="mt-6 sm:mt-8 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4 sm:p-6 border border-blue-200">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">📊 Resumo das Movimentações</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-white rounded-lg shadow">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">
                    {movimentacoes.filter(m => m.tipo === 'entrada').length}
                  </div>
                  <div className="text-green-600 text-xs sm:text-sm font-medium">Entradas</div>
                </div>
                
                <div className="text-center p-3 bg-white rounded-lg shadow">
                  <div className="text-xl sm:text-2xl font-bold text-red-600">
                    {movimentacoes.filter(m => m.tipo === 'saida').length}
                  </div>
                  <div className="text-red-600 text-xs sm:text-sm font-medium">Saídas</div>
                </div>
                
                <div className="text-center p-3 bg-white rounded-lg shadow">
                  <div className="text-lg sm:text-xl font-bold text-blue-600">
                    R$ {movimentacoes.filter(m => m.tipo === 'entrada').reduce((total, m) => total + m.valorTotal, 0).toFixed(2)}
                  </div>
                  <div className="text-blue-600 text-xs sm:text-sm font-medium">Valor Entradas</div>
                </div>
                
                <div className="text-center p-3 bg-white rounded-lg shadow">
                  <div className="text-lg sm:text-xl font-bold text-purple-600">
                    R$ {movimentacoes.filter(m => m.tipo === 'saida').reduce((total, m) => total + m.valorTotal, 0).toFixed(2)}
                  </div>
                  <div className="text-purple-600 text-xs sm:text-sm font-medium">Valor Saídas</div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </ProtectedRoute>
  )
}