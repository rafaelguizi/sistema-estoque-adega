'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToastContext } from '@/components/ToastProvider'
import { useLoading } from '@/hooks/useLoading'
import LoadingButton from '@/components/LoadingButton'
import MobileHeader from '@/components/MobileHeader'

interface Produto {
  id: number
  codigo: string
  nome: string
  categoria: string
  codigoBarras: string
  estoqueMinimo: number
  valorCompra: number
  valorVenda: number
  estoque: number
  ativo: boolean
  dataCadastro: string
}

export default function Produtos() {
  const router = useRouter()
  const toast = useToastContext()
  const { isLoading, withLoading } = useLoading()
  
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showNovaCategoria, setShowNovaCategoria] = useState(false)
  const [novaCategoria, setNovaCategoria] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    codigoBarras: '',
    estoqueMinimo: '',
    valorCompra: '',
    valorVenda: '',
    estoque: ''
  })

  // Estados de filtro
  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [buscaCategoria, setBuscaCategoria] = useState('')

  // Categorias pré-definidas
  const categoriasPadrao = [
    'Eletrônicos',
    'Roupas e Acessórios',
    'Casa e Jardim',
    'Esportes e Lazer',
    'Livros e Papelaria',
    'Beleza e Cuidados',
    'Alimentação',
    'Bebidas',
    'Ferramentas',
    'Automóveis',
    'Brinquedos',
    'Informática'
  ]

  // Carregar produtos
  const carregarProdutos = useCallback(async () => {
    await withLoading('carregando', async () => {
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const produtosSalvos = localStorage.getItem('stockpro_produtos')
      if (produtosSalvos) {
        try {
          const produtosCarregados = JSON.parse(produtosSalvos)
          // Migrar produtos antigos sem código de barras
          const produtosMigrados = produtosCarregados.map((produto: Produto) => ({
            ...produto,
            codigoBarras: produto.codigoBarras || ''
          }))
          setProdutos(produtosMigrados)
        } catch (error) {
          console.error('Erro ao carregar produtos:', error)
          toast.error('Erro ao carregar', 'Não foi possível carregar os produtos')
        }
      }
    })
  }, [withLoading, toast])

  useEffect(() => {
    carregarProdutos()
  }, [carregarProdutos])

  const salvarProdutos = (novosProdutos: Produto[]) => {
    localStorage.setItem('stockpro_produtos', JSON.stringify(novosProdutos))
    setProdutos(novosProdutos)
  }

  // Gerar próximo código automaticamente
  const gerarProximoCodigo = () => {
    const produtosAtivos = produtos.filter(p => p.ativo)
    const proximoNumero = produtosAtivos.length + 1
    return proximoNumero.toString().padStart(3, '0') // 001, 002, 003...
  }

  // Obter todas as categorias (padrão + personalizadas)
  const obterTodasCategorias = () => {
    const categoriasPersonalizadas = [...new Set(produtos.map(p => p.categoria))].filter(Boolean)
    const todasCategorias = [...new Set([...categoriasPadrao, ...categoriasPersonalizadas])]
    
    // Filtrar categorias baseado na busca
    if (buscaCategoria) {
      return todasCategorias.filter(cat => 
        cat.toLowerCase().includes(buscaCategoria.toLowerCase())
      )
    }
    
    return todasCategorias.sort()
  }

  // Iniciar scanner de código de barras
  const iniciarScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment' // Câmera traseira
        } 
      })
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setShowScanner(true)
        toast.info('Scanner ativo', 'Aponte a câmera para o código de barras')
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error)
      toast.error('Erro na câmera', 'Não foi possível acessar a câmera. Verifique as permissões.')
    }
  }

  // Parar scanner
  const pararScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
    }
    setShowScanner(false)
  }

  // Simular leitura de código de barras (para demonstração)
  const simularLeituraCodigoBarras = () => {
    const codigoSimulado = Math.random().toString().substr(2, 13) // 13 dígitos
    setFormData({...formData, codigoBarras: codigoSimulado})
    pararScanner()
    toast.success('Código escaneado!', `Código: ${codigoSimulado}`)
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      categoria: '',
      codigoBarras: '',
      estoqueMinimo: '',
      valorCompra: '',
      valorVenda: '',
      estoque: ''
    })
    setEditingId(null)
    setShowForm(false)
    setShowNovaCategoria(false)
    setNovaCategoria('')
    setBuscaCategoria('')
    pararScanner()
  }

  const adicionarNovaCategoria = async () => {
    if (!novaCategoria.trim()) {
      toast.warning('Categoria vazia', 'Digite o nome da categoria!')
      return
    }

    const categoriaExiste = obterTodasCategorias().some(cat => 
      cat.toLowerCase() === novaCategoria.toLowerCase()
    )

    if (categoriaExiste) {
      toast.warning('Categoria já existe', 'Esta categoria já está disponível!')
      return
    }

    await withLoading('adicionando-categoria', async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setFormData({...formData, categoria: novaCategoria})
      setShowNovaCategoria(false)
      setNovaCategoria('')
      setBuscaCategoria('')
      toast.success('Categoria adicionada!', 'Nova categoria criada com sucesso!')
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    await withLoading('salvando', async () => {
      await new Promise(resolve => setTimeout(resolve, 1200))

      // Validações
      if (!formData.nome || !formData.categoria) {
        toast.error('Campos obrigatórios', 'Preencha nome e categoria!')
        return
      }

      const estoqueMinimo = parseInt(formData.estoqueMinimo) || 0
      const valorCompra = parseFloat(formData.valorCompra) || 0
      const valorVenda = parseFloat(formData.valorVenda) || 0
      const estoque = parseInt(formData.estoque) || 0

      if (valorCompra < 0 || valorVenda < 0 || estoqueMinimo < 0 || estoque < 0) {
        toast.warning('Valores inválidos', 'Valores não podem ser negativos!')
        return
      }

      if (valorVenda < valorCompra) {
        toast.warning('Preço de venda baixo', 'Valor de venda deve ser maior que o de compra!')
        return
      }

      // Verificar código de barras duplicado
      if (formData.codigoBarras) {
        const codigoBarrasExiste = produtos.some(p => 
          p.codigoBarras === formData.codigoBarras && p.id !== editingId
        )

        if (codigoBarrasExiste) {
          toast.error('Código de barras já existe', 'Este código de barras já está sendo usado!')
          return
        }
      }

      const novoProduto: Produto = {
        id: editingId || Date.now(),
        codigo: editingId ? 
          produtos.find(p => p.id === editingId)?.codigo || gerarProximoCodigo() :
          gerarProximoCodigo(),
        nome: formData.nome,
        categoria: formData.categoria,
        codigoBarras: formData.codigoBarras,
        estoqueMinimo,
        valorCompra,
        valorVenda,
        estoque,
        ativo: true,
        dataCadastro: editingId ? 
          produtos.find(p => p.id === editingId)?.dataCadastro || new Date().toLocaleDateString('pt-BR') :
          new Date().toLocaleDateString('pt-BR')
      }

      if (editingId) {
        const produtosAtualizados = produtos.map(p => 
          p.id === editingId ? novoProduto : p
        )
        salvarProdutos(produtosAtualizados)
        toast.success('Produto atualizado!', 'Dados atualizados com sucesso!')
      } else {
        salvarProdutos([...produtos, novoProduto])
        toast.success('Produto cadastrado!', `Código ${novoProduto.codigo} criado!`)
      }

      resetForm()
    })
  }

  const handleEdit = async (produto: Produto) => {
    await withLoading('carregando-produto', async () => {
      await new Promise(resolve => setTimeout(resolve, 400))
      
      setFormData({
        nome: produto.nome,
        categoria: produto.categoria,
        codigoBarras: produto.codigoBarras || '',
        estoqueMinimo: produto.estoqueMinimo.toString(),
        valorCompra: produto.valorCompra.toString(),
        valorVenda: produto.valorVenda.toString(),
        estoque: produto.estoque.toString()
      })
      setEditingId(produto.id)
      setShowForm(true)
    })
  }

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      await withLoading('excluindo', async () => {
        await new Promise(resolve => setTimeout(resolve, 600))
        
        const novosProdutos = produtos.filter(p => p.id !== id)
        salvarProdutos(novosProdutos)
        toast.success('Produto excluído!', 'Produto removido com sucesso!')
      })
    }
  }

  const toggleStatus = async (id: number) => {
    await withLoading('alterando-status', async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const produtosAtualizados = produtos.map(p => 
        p.id === id ? { ...p, ativo: !p.ativo } : p
      )
      salvarProdutos(produtosAtualizados)
      
      const produto = produtos.find(p => p.id === id)
      const novoStatus = !produto?.ativo
      toast.success(
        `Produto ${novoStatus ? 'ativado' : 'desativado'}!`,
        `Status alterado com sucesso!`
      )
    })
  }

  // Filtrar produtos
  const produtosFiltrados = produtos.filter(produto => {
    const matchBusca = produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
                      produto.codigo.toLowerCase().includes(busca.toLowerCase()) ||
                      produto.categoria.toLowerCase().includes(busca.toLowerCase()) ||
                      produto.codigoBarras.toLowerCase().includes(busca.toLowerCase())
    
    const matchCategoria = filtroCategoria === '' || produto.categoria === filtroCategoria
    const matchStatus = filtroStatus === '' || 
                       (filtroStatus === 'ativo' && produto.ativo) ||
                       (filtroStatus === 'inativo' && !produto.ativo)
    
    return matchBusca && matchCategoria && matchStatus
  })

  // Obter categorias únicas para filtro
  const categoriasParaFiltro = [...new Set(produtos.map(p => p.categoria))].filter(Boolean)

  return (
    <div className="min-h-screen bg-gray-100">
      <MobileHeader title="Gestão de Produtos" currentPage="/produtos" />

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        
        {/* Loading de carregamento inicial */}
        {isLoading('carregando') && (
          <div className="bg-white rounded-lg shadow-lg p-8 sm:p-12 mb-6">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-purple-500 border-t-transparent mb-4 sm:mb-6"></div>
              <p className="text-gray-600 font-medium text-base sm:text-lg">Carregando produtos...</p>
              <p className="text-gray-500 text-sm mt-2">Buscando dados do estoque</p>
            </div>
          </div>
        )}

        {/* Botões de ação */}
        {!isLoading('carregando') && (
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Controle de Produtos</h1>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
              <LoadingButton
                onClick={() => router.push('/pdv')}
                variant="success"
                size="md"
                className="w-full sm:w-auto"
              >
                🛒 PDV (Vendas)
              </LoadingButton>
              <LoadingButton
                onClick={() => setShowForm(true)}
                variant="primary"
                size="md"
                className="w-full sm:w-auto"
              >
                ➕ Novo Produto
              </LoadingButton>
            </div>
          </div>
        )}

        {/* Filtros */}
        {!isLoading('carregando') && (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg mb-6">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">🔍 Filtros</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Buscar</label>
                <input
                  type="text"
                  placeholder="Nome, código ou código de barras..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm placeholder-gray-600 text-sm sm:text-base"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Categoria</label>
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  className="w-full border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm text-sm sm:text-base"
                >
                  <option value="">Todas as categorias</option>
                  {categoriasParaFiltro.map(categoria => (
                    <option key={categoria} value={categoria}>{categoria}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">Status</label>
                <select
                  value={filtroStatus}
                  onChange={(e) => setFiltroStatus(e.target.value)}
                  className="w-full border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm text-sm sm:text-base"
                >
                  <option value="">Todos os status</option>
                  <option value="ativo">✅ Ativos</option>
                  <option value="inativo">❌ Inativos</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <LoadingButton
                  onClick={() => {
                    setBusca('')
                    setFiltroCategoria('')
                    setFiltroStatus('')
                  }}
                  variant="secondary"
                  size="md"
                  className="w-full"
                >
                  🧹 Limpar Filtros
                </LoadingButton>
              </div>
            </div>
          </div>
        )}

        {/* Resumo dos Filtros */}
        {!isLoading('carregando') && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
              <span className="text-blue-800 font-medium text-sm sm:text-base">
                �� {produtosFiltrados.length} de {produtos.length} produtos
              </span>
              <div className="flex items-center space-x-4">
                <span className="text-blue-600 text-xs sm:text-sm">
                  📱 {produtos.filter(p => p.codigoBarras).length} com código de barras
                </span>
                {(busca || filtroCategoria || filtroStatus) && (
                  <span className="text-blue-600 text-xs sm:text-sm">🔍 Filtros ativos</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Formulário de Novo/Editar Produto */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-4 sm:p-6 border-b">
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  {editingId ? '✏️ Editar Produto' : '➕ Novo Produto'}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={isLoading('salvando')}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
                
                {/* Mostrar código apenas na edição */}
                {editingId && (
                  <div className="bg-gray-50 p-3 rounded-lg border">
                    <label className="block text-sm font-bold text-gray-800 mb-1">Código do Produto</label>
                    <p className="text-lg font-bold text-purple-600">#{produtos.find(p => p.id === editingId)?.codigo}</p>
                  </div>
                )}

                {/* Código automático para novos produtos */}
                {!editingId && (
                  <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <label className="block text-sm font-bold text-green-800 mb-1">Código Automático</label>
                    <p className="text-lg font-bold text-green-600">#{gerarProximoCodigo()}</p>
                    <p className="text-xs text-green-600">Código gerado automaticamente</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    className="w-full border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm placeholder-gray-600 text-sm sm:text-base"
                    placeholder="Digite o nome do produto"
                    required
                    disabled={isLoading('salvando')}
                  />
                </div>

                {/* Código de Barras */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Código de Barras
                  </label>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={formData.codigoBarras}
                      onChange={(e) => setFormData({...formData, codigoBarras: e.target.value})}
                      className="w-full border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm placeholder-gray-600 text-sm sm:text-base"
                      placeholder="Digite ou escaneie o código de barras"
                      disabled={isLoading('salvando')}
                    />
                    <div className="flex space-x-2">
                      <LoadingButton
                        type="button"
                        onClick={iniciarScanner}
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        disabled={isLoading('salvando')}
                      >
                        📱 Escanear
                      </LoadingButton>
                      <LoadingButton
                        type="button"
                        onClick={simularLeituraCodigoBarras}
                        variant="warning"
                        size="sm"
                        className="flex-1"
                        disabled={isLoading('salvando')}
                      >
                        🎲 Simular
                      </LoadingButton>
                    </div>
                    <p className="text-xs text-gray-500">
                      💡 O código de barras permite vendas rápidas no PDV
                    </p>
                  </div>
                </div>

                {/* Categoria com busca e opção de adicionar */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Categoria *
                  </label>
                  
                  {/* Campo de busca de categoria */}
                  <input
                    type="text"
                    placeholder="Buscar categoria..."
                    value={buscaCategoria}
                    onChange={(e) => setBuscaCategoria(e.target.value)}
                    className="w-full border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm placeholder-gray-500 text-sm sm:text-base mb-2"
                    disabled={isLoading('salvando')}
                  />

                  {/* Lista de categorias */}
                  <div className="border-2 border-gray-400 rounded-lg max-h-40 overflow-y-auto bg-white">
                    {obterTodasCategorias().map(categoria => (
                      <button
                        key={categoria}
                        type="button"
                        onClick={() => {
                          setFormData({...formData, categoria})
                          setBuscaCategoria('')
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors text-sm sm:text-base ${
                          formData.categoria === categoria ? 'bg-purple-100 text-purple-800 font-bold' : 'text-gray-700'
                        }`}
                        disabled={isLoading('salvando')}
                      >
                        {categoria}
                      </button>
                    ))}
                    
                    {/* Opção para adicionar nova categoria */}
                    {!showNovaCategoria && (
                      <button
                        type="button"
                        onClick={() => setShowNovaCategoria(true)}
                        className="w-full text-left px-3 py-2 text-green-600 hover:bg-green-50 transition-colors font-medium text-sm sm:text-base border-t"
                        disabled={isLoading('salvando')}
                      >
                        ➕ Adicionar nova categoria
                      </button>
                    )}
                  </div>

                  {/* Campo para nova categoria */}
                  {showNovaCategoria && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <label className="block text-sm font-bold text-green-800 mb-2">Nova Categoria:</label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          value={novaCategoria}
                          onChange={(e) => setNovaCategoria(e.target.value)}
                          className="flex-1 border-2 border-green-400 rounded-lg px-3 py-2 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm"
                          placeholder="Nome da categoria"
                          disabled={isLoading('adicionando-categoria') || isLoading('salvando')}
                        />
                        <LoadingButton
                          type="button"
                          onClick={adicionarNovaCategoria}
                          isLoading={isLoading('adicionando-categoria')}
                          variant="success"
                          size="sm"
                          disabled={isLoading('salvando')}
                        >
                          ✅
                        </LoadingButton>
                        <button
                          type="button"
                          onClick={() => {
                            setShowNovaCategoria(false)
                            setNovaCategoria('')
                          }}
                          className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                          disabled={isLoading('adicionando-categoria') || isLoading('salvando')}
                        >
                          ❌
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Categoria selecionada */}
                  {formData.categoria && (
                    <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                      <span className="text-sm text-purple-800">Categoria selecionada: </span>
                      <span className="font-bold text-purple-900">{formData.categoria}</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Valor de Compra
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valorCompra}
                      onChange={(e) => setFormData({...formData, valorCompra: e.target.value})}
                      className="w-full border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm placeholder-gray-600 text-sm sm:text-base"
                      placeholder="0.00"
                      disabled={isLoading('salvando')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Valor de Venda
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.valorVenda}
                      onChange={(e) => setFormData({...formData, valorVenda: e.target.value})}
                      className="w-full border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm placeholder-gray-600 text-sm sm:text-base"
                      placeholder="0.00"
                      disabled={isLoading('salvando')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Estoque Atual
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.estoque}
                      onChange={(e) => setFormData({...formData, estoque: e.target.value})}
                      className="w-full border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm placeholder-gray-600 text-sm sm:text-base"
                      placeholder="0"
                      disabled={isLoading('salvando')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">
                      Estoque Mínimo
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.estoqueMinimo}
                      onChange={(e) => setFormData({...formData, estoqueMinimo: e.target.value})}
                      className="w-full border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm placeholder-gray-600 text-sm sm:text-base"
                      placeholder="0"
                      disabled={isLoading('salvando')}
                    />
                  </div>
                </div>

                {/* Cálculo de margem */}
                {formData.valorCompra && formData.valorVenda && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-3 sm:p-4 rounded-lg border-2 border-green-200">
                    <h4 className="font-bold text-gray-800 mb-2 text-sm sm:text-base">💰 Análise de Margem:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                      <div>
                        <span className="text-gray-600">Margem de lucro:</span>
                        <span className="font-bold text-green-600 ml-1">
                          R\$ {(parseFloat(formData.valorVenda) - parseFloat(formData.valorCompra)).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Percentual:</span>
                        <span className="font-bold text-blue-600 ml-1">
                          {(((parseFloat(formData.valorVenda) - parseFloat(formData.valorCompra)) / parseFloat(formData.valorCompra)) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
                  <LoadingButton
                    type="submit"
                    isLoading={isLoading('salvando')}
                    loadingText="Salvando..."
                    variant="primary"
                    size="md"
                    className="flex-1"
                  >
                    {editingId ? '💾 Atualizar' : '➕ Cadastrar'}
                  </LoadingButton>
                  <LoadingButton
                    type="button"
                    onClick={resetForm}
                    variant="secondary"
                    size="md"
                    className="flex-1"
                    disabled={isLoading('salvando')}
                  >
                    ❌ Cancelar
                  </LoadingButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Scanner de Código de Barras */}
        {showScanner && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-bold text-gray-900">📱 Scanner de Código de Barras</h3>
                <button
                  onClick={pararScanner}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-4">
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-64 bg-black rounded-lg"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  
                  {/* Overlay de mira */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-red-500 w-48 h-24 rounded-lg"></div>
                  </div>
                </div>
                
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Aponte a câmera para o código de barras
                  </p>
                  <LoadingButton
                    onClick={simularLeituraCodigoBarras}
                    variant="primary"
                    size="md"
                    className="w-full"
                  >
                    🎲 Simular Leitura (Teste)
                  </LoadingButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Produtos */}
        {!isLoading('carregando') && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">📋 Lista de Produtos</h3>
            </div>

            {produtosFiltrados.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="text-4xl sm:text-6xl mb-4">📦</div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
                <p className="text-gray-500 mb-4 text-sm sm:text-base">
                  {produtos.length === 0 
                    ? 'Comece cadastrando seu primeiro produto.'
                    : 'Tente ajustar os filtros para encontrar os produtos desejados.'
                  }
                </p>
                <LoadingButton
                  onClick={() => setShowForm(true)}
                  variant="primary"
                  size="md"
                  className="w-full sm:w-auto"
                >
                  ➕ Novo Produto
                </LoadingButton>
              </div>
            ) : (
              <>
                {/* Versão Mobile - Cards */}
                <div className="block sm:hidden">
                  <div className="divide-y divide-gray-200">
                    {produtosFiltrados.map((produto) => (
                      <div key={produto.id} className="p-4 hover:bg-gray-50">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="text-sm font-bold text-gray-900 truncate">{produto.nome}</h4>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                produto.ativo 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {produto.ativo ? '✅ Ativo' : '❌ Inativo'}
                              </span>
                            </div>
                            
                            <div className="space-y-1 text-xs text-gray-600">
                              <p><span className="font-medium">Código:</span> #{produto.codigo}</p>
                              {produto.codigoBarras && (
                                <p><span className="font-medium">Código de Barras:</span> {produto.codigoBarras}</p>
                              )}
                              <p><span className="font-medium">Categoria:</span> {produto.categoria}</p>
                              <p><span className="font-medium">Estoque:</span> {produto.estoque} unidades</p>
                              <p><span className="font-medium">Compra:</span> R\$ {produto.valorCompra.toFixed(2)}</p>
                              <p><span className="font-medium">Venda:</span> R\$ {produto.valorVenda.toFixed(2)}</p>
                            </div>

                            {/* Status do estoque */}
                            <div className="mt-2 flex items-center space-x-2">
                              {produto.estoque === 0 ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  🚫 Sem estoque
                                </span>
                              ) : produto.estoque <= produto.estoqueMinimo ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  ⚠️ Estoque baixo
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  ✅ Estoque normal
                                </span>
                              )}
                              
                              {produto.codigoBarras && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  �� Com código de barras
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Ações Mobile */}
                          <div className="flex flex-col space-y-2 ml-4">
                            <LoadingButton
                              onClick={() => handleEdit(produto)}
                              isLoading={isLoading('carregando-produto')}
                              variant="primary"
                              size="sm"
                              className="text-xs px-2 py-1"
                            >
                              ✏️
                            </LoadingButton>
                            <LoadingButton
                              onClick={() => toggleStatus(produto.id)}
                              isLoading={isLoading('alterando-status')}
                              variant={produto.ativo ? "warning" : "success"}
                              size="sm"
                              className="text-xs px-2 py-1"
                            >
                              {produto.ativo ? '⏸️' : '▶️'}
                            </LoadingButton>
                            <LoadingButton
                              onClick={() => handleDelete(produto.id)}
                              isLoading={isLoading('excluindo')}
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
                          Produto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoria
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Código de Barras
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estoque
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Valores
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {produtosFiltrados.map((produto) => (
                        <tr key={produto.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{produto.nome}</div>
                              <div className="text-sm text-gray-500">#{produto.codigo}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {produto.categoria}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {produto.codigoBarras ? (
                              <div>
                                <div className="font-mono text-xs">{produto.codigoBarras}</div>
                                <div className="text-xs text-blue-600">📱 Escaneável</div>
                              </div>
                            ) : (
                              <span className="text-gray-400">Não cadastrado</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              <div className="font-medium">{produto.estoque} unidades</div>
                              <div className="text-gray-500">Mín: {produto.estoqueMinimo}</div>
                            </div>
                            <div className="mt-1">
                              {produto.estoque === 0 ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  🚫 Sem estoque
                                </span>
                              ) : produto.estoque <= produto.estoqueMinimo ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  ⚠️ Estoque baixo
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  ✅ Normal
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>Compra: R\$ {produto.valorCompra.toFixed(2)}</div>
                            <div>Venda: R\$ {produto.valorVenda.toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              produto.ativo 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {produto.ativo ? '✅ Ativo' : '❌ Inativo'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <LoadingButton
                                onClick={() => handleEdit(produto)}
                                isLoading={isLoading('carregando-produto')}
                                variant="primary"
                                size="sm"
                              >
                                ✏️
                              </LoadingButton>
                              <LoadingButton
                                onClick={() => toggleStatus(produto.id)}
                                isLoading={isLoading('alterando-status')}
                                variant={produto.ativo ? "warning" : "success"}
                                size="sm"
                              >
                                {produto.ativo ? '⏸️' : '▶️'}
                              </LoadingButton>
                              <LoadingButton
                                onClick={() => handleDelete(produto.id)}
                                isLoading={isLoading('excluindo')}
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

        {/* Estatísticas dos Produtos */}
        {!isLoading('carregando') && produtos.length > 0 && (
          <div className="mt-6 sm:mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 sm:p-6 border border-purple-200">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">📊 Resumo dos Produtos</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div className="text-center p-3 bg-white rounded-lg shadow">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">{produtos.filter(p => p.ativo).length}</div>
                <div className="text-blue-600 text-xs sm:text-sm font-medium">Produtos Ativos</div>
              </div>
              
              <div className="text-center p-3 bg-white rounded-lg shadow">
                <div className="text-xl sm:text-2xl font-bold text-green-600">{produtos.filter(p => p.codigoBarras).length}</div>
                <div className="text-green-600 text-xs sm:text-sm font-medium">Com Código de Barras</div>
              </div>
              
              <div className="text-center p-3 bg-white rounded-lg shadow">
                <div className="text-xl sm:text-2xl font-bold text-red-600">{produtos.filter(p => p.estoque === 0).length}</div>
                <div className="text-red-600 text-xs sm:text-sm font-medium">Sem Estoque</div>
              </div>
              
              <div className="text-center p-3 bg-white rounded-lg shadow">
                <div className="text-xl sm:text-2xl font-bold text-yellow-600">{produtos.filter(p => p.estoque <= p.estoqueMinimo && p.estoque > 0).length}</div>
                <div className="text-yellow-600 text-xs sm:text-sm font-medium">Estoque Baixo</div>
              </div>
              
              <div className="text-center p-3 bg-white rounded-lg shadow">
                <div className="text-lg sm:text-xl font-bold text-purple-600">
                  R\$ {produtos.filter(p => p.ativo).reduce((total, p) => total + (p.estoque * p.valorCompra), 0).toFixed(2)}
                </div>
                <div className="text-purple-600 text-xs sm:text-sm font-medium">Valor Estoque</div>
              </div>
            </div>
          </div>
        )}

        {/* Informações sobre Código de Barras */}
        <div className="mt-6 sm:mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="text-xl sm:text-2xl">��</div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Sistema de Código de Barras
              </h3>
              <div className="mt-2 text-xs sm:text-sm text-blue-700 space-y-1">
                <p>• <strong>Cadastre códigos de barras</strong> nos produtos para vendas mais rápidas</p>
                <p>• <strong>Use a câmera</strong> do celular/computador para escanear códigos</p>
                <p>• <strong>Compatível com leitores físicos</strong> quando conectados ao computador</p>
                <p>• <strong>PDV otimizado</strong> para vendas com código de barras</p>
                <p>• <strong>Busca inteligente</strong> por código de barras nos filtros</p>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}