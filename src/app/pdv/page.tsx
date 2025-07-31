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

interface ItemVenda {
  produto: Produto
  quantidade: number
  valorUnitario: number
  valorTotal: number
}

interface Movimentacao {
  id: number
  produto: string
  codigo: string
  tipo: 'entrada' | 'saida'
  quantidade: number
  valorUnitario: number
  valorTotal: number
  data: string
  hora: string
  observacao: string
}

export default function PDV() {
  const router = useRouter()
  const toast = useToastContext()
  const { isLoading, withLoading } = useLoading()
  
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [itensVenda, setItensVenda] = useState<ItemVenda[]>([])
  const [showScanner, setShowScanner] = useState(false)
  const [codigoBarrasInput, setCodigoBarrasInput] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Carregar produtos
  const carregarProdutos = useCallback(async () => {
    await withLoading('carregando', async () => {
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const produtosSalvos = localStorage.getItem('stockpro_produtos')
      if (produtosSalvos) {
        try {
          const produtosCarregados = JSON.parse(produtosSalvos)
          // Migrar produtos antigos sem código de barras
          const produtosMigrados = produtosCarregados.map((produto: Produto) => ({
            ...produto,
            codigoBarras: produto.codigoBarras || ''
          }))
          setProdutos(produtosMigrados.filter((p: Produto) => p.ativo))
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

  // Auto-focus no input de código de barras
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  // Buscar produto por código de barras
  const buscarProdutoPorCodigoBarras = (codigoBarras: string) => {
    return produtos.find(p => 
      p.codigoBarras === codigoBarras || 
      p.codigo === codigoBarras
    )
  }

  // Adicionar produto à venda
  const adicionarProdutoVenda = async (produto: Produto, quantidade: number = 1) => {
    if (produto.estoque < quantidade) {
      toast.error('Estoque insuficiente', `Disponível: ${produto.estoque} unidades`)
      return
    }

    const itemExistente = itensVenda.find(item => item.produto.id === produto.id)
    
    if (itemExistente) {
      const novaQuantidade = itemExistente.quantidade + quantidade
      if (produto.estoque < novaQuantidade) {
        toast.error('Estoque insuficiente', `Disponível: ${produto.estoque} unidades`)
        return
      }
      
      setItensVenda(itensVenda.map(item => 
        item.produto.id === produto.id 
          ? {
              ...item,
              quantidade: novaQuantidade,
              valorTotal: item.valorUnitario * novaQuantidade
            }
          : item
      ))
    } else {
      const novoItem: ItemVenda = {
        produto,
        quantidade,
        valorUnitario: produto.valorVenda,
        valorTotal: produto.valorVenda * quantidade
      }
      setItensVenda([...itensVenda, novoItem])
    }

    toast.success('Produto adicionado!', `${produto.nome} - ${quantidade}x`)
  }

  // Processar código de barras
  const processarCodigoBarras = async (codigoBarras: string) => {
    if (!codigoBarras.trim()) return

    await withLoading('buscando-produto', async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const produto = buscarProdutoPorCodigoBarras(codigoBarras.trim())
      
      if (produto) {
        await adicionarProdutoVenda(produto)
        setCodigoBarrasInput('')
        // Refocar no input
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus()
          }
        }, 100)
      } else {
        toast.error('Produto não encontrado', 'Código de barras não cadastrado')
        setCodigoBarrasInput('')
      }
    })
  }

  // Handle do input de código de barras
  const handleCodigoBarrasSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    processarCodigoBarras(codigoBarrasInput)
  }

  // Remover item da venda
  const removerItemVenda = (produtoId: number) => {
    setItensVenda(itensVenda.filter(item => item.produto.id !== produtoId))
    toast.info('Item removido', 'Produto removido da venda')
  }

  // Alterar quantidade do item
  const alterarQuantidadeItem = (produtoId: number, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      removerItemVenda(produtoId)
      return
    }

    const item = itensVenda.find(item => item.produto.id === produtoId)
    if (!item) return

    if (item.produto.estoque < novaQuantidade) {
      toast.error('Estoque insuficiente', `Disponível: ${item.produto.estoque} unidades`)
      return
    }

    setItensVenda(itensVenda.map(item => 
      item.produto.id === produtoId 
        ? {
            ...item,
            quantidade: novaQuantidade,
            valorTotal: item.valorUnitario * novaQuantidade
          }
        : item
    ))
  }

  // Calcular total da venda
  const calcularTotalVenda = () => {
    return itensVenda.reduce((total, item) => total + item.valorTotal, 0)
  }

  // Finalizar venda
  const finalizarVenda = async () => {
    if (itensVenda.length === 0) {
      toast.warning('Venda vazia', 'Adicione produtos à venda!')
      return
    }

    await withLoading('finalizando-venda', async () => {
      await new Promise(resolve => setTimeout(resolve, 2000))

      try {
        // Carregar movimentações existentes
        const movimentacoesSalvas = localStorage.getItem('stockpro_movimentacoes')
        const movimentacoes = movimentacoesSalvas ? JSON.parse(movimentacoesSalvas) : []

        // Criar movimentações para cada item
        const novasMovimentacoes: Movimentacao[] = itensVenda.map(item => ({
          id: Date.now() + Math.random(),
          produto: item.produto.nome,
          codigo: item.produto.codigo,
          tipo: 'saida' as const,
          quantidade: item.quantidade,
          valorUnitario: item.valorUnitario,
          valorTotal: item.valorTotal,
          data: new Date().toLocaleDateString('pt-BR'),
          hora: new Date().toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          observacao: 'Venda PDV'
        }))

        // Salvar movimentações
        localStorage.setItem('stockpro_movimentacoes', JSON.stringify([...novasMovimentacoes, ...movimentacoes]))

        // Atualizar estoque dos produtos
        const produtosAtualizados = produtos.map(produto => {
          const itemVenda = itensVenda.find(item => item.produto.id === produto.id)
          if (itemVenda) {
            return {
              ...produto,
              estoque: produto.estoque - itemVenda.quantidade
            }
          }
          return produto
        })

        // Salvar produtos atualizados
        localStorage.setItem('stockpro_produtos', JSON.stringify(produtosAtualizados))
        setProdutos(produtosAtualizados)

        // Limpar venda
        setItensVenda([])

        const totalVenda = calcularTotalVenda()
        toast.success(
          'Venda finalizada!', 
          `Total: R$ ${totalVenda.toFixed(2)} - ${itensVenda.length} itens`
        )

        // Refocar no input
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus()
          }
        }, 100)

      } catch (error) {
        console.error('Erro ao finalizar venda:', error)
        toast.error('Erro na venda', 'Não foi possível finalizar a venda')
      }
    })
  }

  // Limpar venda
  const limparVenda = () => {
    if (itensVenda.length === 0) return
    
    if (confirm('Tem certeza que deseja limpar a venda?')) {
      setItensVenda([])
      toast.info('Venda limpa', 'Todos os itens foram removidos')
      
      // Refocar no input
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 100)
    }
  }

  // Iniciar scanner
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
      toast.error('Erro na câmera', 'Não foi possível acessar a câmera')
    }
  }

  // Parar scanner
  const pararScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
    }
    setShowScanner(false)
    
    // Refocar no input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 100)
  }

  // Simular leitura de código de barras
  const simularLeituraCodigoBarras = () => {
    const produtosComCodigoBarras = produtos.filter(p => p.codigoBarras)
    if (produtosComCodigoBarras.length === 0) {
      toast.warning('Nenhum produto', 'Cadastre produtos com código de barras primeiro')
      return
    }

    const produtoAleatorio = produtosComCodigoBarras[Math.floor(Math.random() * produtosComCodigoBarras.length)]
    processarCodigoBarras(produtoAleatorio.codigoBarras)
    pararScanner()
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <MobileHeader title="PDV - Ponto de Venda" currentPage="/pdv" />

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        
        {/* Loading de carregamento inicial */}
        {isLoading('carregando') && (
          <div className="bg-white rounded-lg shadow-lg p-8 sm:p-12 mb-6">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-green-500 border-t-transparent mb-4 sm:mb-6"></div>
              <p className="text-gray-600 font-medium text-base sm:text-lg">Carregando PDV...</p>
              <p className="text-gray-500 text-sm mt-2">Preparando sistema de vendas</p>
            </div>
          </div>
        )}

        {!isLoading('carregando') && (
          <>
            {/* Header do PDV */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg shadow-lg p-4 sm:p-6 mb-6 text-white">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">🛒 PDV - Ponto de Venda</h1>
                  <p className="text-green-100 mt-1 text-sm sm:text-base">
                    Escaneie códigos de barras para vendas rápidas
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                  <LoadingButton
                    onClick={() => router.push('/produtos')}
                    variant="secondary"
                    size="sm"
                    className="w-full sm:w-auto bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white"
                  >
                    📦 Produtos
                  </LoadingButton>
                  <LoadingButton
                    onClick={() => router.push('/movimentacoes')}
                    variant="secondary"
                    size="sm"
                    className="w-full sm:w-auto bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white"
                  >
                    📋 Movimentações
                  </LoadingButton>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Coluna 1: Scanner e Input */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Input de Código de Barras */}
                <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">📱 Scanner de Produtos</h3>
                  
                  <form onSubmit={handleCodigoBarrasSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2">
                        Código de Barras
                      </label>
                      <input
                        ref={inputRef}
                        type="text"
                        value={codigoBarrasInput}
                        onChange={(e) => setCodigoBarrasInput(e.target.value)}
                        className="w-full border-2 border-gray-400 rounded-lg px-4 py-3 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-lg"
                        placeholder="Escaneie ou digite o código"
                        disabled={isLoading('buscando-produto')}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <LoadingButton
                        type="submit"
                        isLoading={isLoading('buscando-produto')}
                        loadingText="Buscando..."
                        variant="primary"
                        size="md"
                        className="w-full"
                      >
                        🔍 Buscar
                      </LoadingButton>
                      <LoadingButton
                        type="button"
                        onClick={iniciarScanner}
                        variant="secondary"
                        size="md"
                        className="w-full"
                      >
                        📷 Câmera
                      </LoadingButton>
                    </div>
                  </form>

                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Dica:</strong> Use um leitor de código de barras conectado ao computador para maior velocidade!
                    </p>
                  </div>
                </div>

                {/* Estatísticas Rápidas */}
                <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Estatísticas</h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-blue-800 font-medium">Produtos Ativos</span>
                      <span className="text-blue-600 font-bold">{produtos.length}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-green-800 font-medium">Com Código de Barras</span>
                      <span className="text-green-600 font-bold">{produtos.filter(p => p.codigoBarras).length}</span>
                    </div>
                    
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-purple-800 font-medium">Itens na Venda</span>
                      <span className="text-purple-600 font-bold">{itensVenda.length}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coluna 2: Lista de Itens da Venda */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-800">🛒 Itens da Venda</h3>
                    <div className="flex space-x-2">
                      <LoadingButton
                        onClick={limparVenda}
                        variant="warning"
                        size="sm"
                        disabled={itensVenda.length === 0}
                      >
                        🧹 Limpar
                      </LoadingButton>
                      <LoadingButton
                        onClick={finalizarVenda}
                        isLoading={isLoading('finalizando-venda')}
                        loadingText="Finalizando..."
                        variant="success"
                        size="sm"
                        disabled={itensVenda.length === 0}
                      >
                        💰 Finalizar Venda
                      </LoadingButton>
                    </div>
                  </div>

                  {itensVenda.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🛒</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Venda vazia</h3>
                      <p className="text-gray-500 mb-4">
                        Escaneie códigos de barras para adicionar produtos
                      </p>
                      <div className="text-sm text-gray-400">
                        💡 Use o campo acima ou conecte um leitor de código de barras
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Lista de Itens - Mobile */}
                      <div className="block sm:hidden divide-y divide-gray-200">
                        {itensVenda.map((item) => (
                          <div key={item.produto.id} className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-sm font-bold text-gray-900 truncate">{item.produto.nome}</h4>
                                <div className="space-y-1 text-xs text-gray-600 mt-1">
                                  <p><span className="font-medium">Código:</span> #{item.produto.codigo}</p>
                                  <p><span className="font-medium">Preço unit.:</span> R$ {item.valorUnitario.toFixed(2)}</p>
                                  <p><span className="font-medium">Subtotal:</span> R$ {item.valorTotal.toFixed(2)}</p>
                                </div>
                                
                                {/* Controles de quantidade */}
                                <div className="flex items-center space-x-2 mt-3">
                                  <button
                                    onClick={() => alterarQuantidadeItem(item.produto.id, item.quantidade - 1)}
                                    className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center font-bold"
                                  >
                                    -
                                  </button>
                                  <span className="px-3 py-1 bg-gray-100 rounded-lg font-bold text-gray-800">
                                    {item.quantidade}
                                  </span>
                                  <button
                                    onClick={() => alterarQuantidadeItem(item.produto.id, item.quantidade + 1)}
                                    className="w-8 h-8 rounded-full bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center font-bold"
                                    disabled={item.quantidade >= item.produto.estoque}
                                  >
                                    +
                                  </button>
                                </div>
                              </div>

                              <button
                                onClick={() => removerItemVenda(item.produto.id)}
                                className="ml-4 w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Lista de Itens - Desktop */}
                      <div className="hidden sm:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Produto
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Preço Unit.
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Quantidade
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Subtotal
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ações
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {itensVenda.map((item) => (
                              <tr key={item.produto.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">{item.produto.nome}</div>
                                    <div className="text-sm text-gray-500">#{item.produto.codigo}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  R$ {item.valorUnitario.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => alterarQuantidadeItem(item.produto.id, item.quantidade - 1)}
                                      className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center font-bold"
                                    >
                                      -
                                    </button>
                                    <span className="px-3 py-1 bg-gray-100 rounded-lg font-bold text-gray-800 min-w-[3rem] text-center">
                                      {item.quantidade}
                                    </span>
                                    <button
                                      onClick={() => alterarQuantidadeItem(item.produto.id, item.quantidade + 1)}
                                      className="w-8 h-8 rounded-full bg-green-100 text-green-600 hover:bg-green-200 flex items-center justify-center font-bold"
                                      disabled={item.quantidade >= item.produto.estoque}
                                    >
                                      +
                                    </button>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    Estoque: {item.produto.estoque}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                  R$ {item.valorTotal.toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                  <button
                                    onClick={() => removerItemVenda(item.produto.id)}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    🗑️ Remover
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Total da Venda */}
                      <div className="bg-gray-50 px-4 sm:px-6 py-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <div className="text-lg font-bold text-gray-800">
                            Total da Venda:
                          </div>
                          <div className="text-2xl font-bold text-green-600">
                            R$ {calcularTotalVenda().toFixed(2)}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {itensVenda.length} {itensVenda.length === 1 ? 'item' : 'itens'} • {itensVenda.reduce((total, item) => total + item.quantidade, 0)} unidades
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Scanner de Código de Barras */}
        {showScanner && (
          <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-bold text-gray-900">📱 Scanner PDV</h3>
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
                  
                  {/* Overlay de mira */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="border-2 border-green-500 w-48 h-24 rounded-lg"></div>
                  </div>
                </div>
                
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    Aponte a câmera para o código de barras do produto
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

      </main>
    </div>
  )
}