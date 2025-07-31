'use client'
import { useState, useEffect, useCallback } from 'react'
import { useToastContext } from '@/components/ToastProvider'
import { useLoading } from '@/hooks/useLoading'
import LoadingButton from '@/components/LoadingButton'
import MobileHeader from '@/components/MobileHeader'
import { exportarRelatorioPDF, exportarRelatorioExcel } from '@/utils/exportUtils'

interface Produto {
  id: number
  codigo: string
  nome: string
  categoria: string
  estoqueMinimo: number
  valorCompra: number
  valorVenda: number
  estoque: number
  ativo: boolean
  dataCadastro: string
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

interface Estatisticas {
  totalVendas: number
  totalCompras: number
  lucroReal: number
  quantidadeVendida: number
  rankingProdutos: Array<{
    nome: string
    codigo: string
    quantidade: number
    valor: number
  }>
  vendasPorCategoria: { [key: string]: number }
  numeroVendas: number
  periodoTexto: string
}

export default function Relatorios() {
  const toast = useToastContext()
  const { isLoading, withLoading } = useLoading()
  
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])
  const [periodoInicio, setPeriodoInicio] = useState('')
  const [periodoFim, setPeriodoFim] = useState('')
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null)

  // Carregar dados
  const carregarDados = useCallback(async () => {
    await withLoading('carregando', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Carregar produtos
      const produtosSalvos = localStorage.getItem('stockpro_produtos')
      if (produtosSalvos) {
        try {
          setProdutos(JSON.parse(produtosSalvos))
        } catch (error) {
          console.error('Erro ao carregar produtos:', error)
          toast.error('Erro ao carregar', 'Não foi possível carregar os produtos')
        }
      }

      // Carregar movimentações
      const movimentacoesSalvas = localStorage.getItem('stockpro_movimentacoes')
      if (movimentacoesSalvas) {
        try {
          setMovimentacoes(JSON.parse(movimentacoesSalvas))
        } catch (error) {
          console.error('Erro ao carregar movimentações:', error)
          toast.error('Erro ao carregar', 'Não foi possível carregar as movimentações')
        }
      }
    })
  }, [withLoading, toast])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  // Definir período padrão (último mês)
  useEffect(() => {
    const hoje = new Date()
    const umMesAtras = new Date(hoje)
    umMesAtras.setMonth(hoje.getMonth() - 1)
    
    setPeriodoFim(hoje.toISOString().split('T')[0])
    setPeriodoInicio(umMesAtras.toISOString().split('T')[0])
  }, [])

  // Converter data brasileira para Date
  const converterDataBrasileira = (dataBr: string): Date => {
    const [dia, mes, ano] = dataBr.split('/')
    return new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
  }

  // Filtrar movimentações por período
  const filtrarMovimentacoesPorPeriodo = () => {
    if (!periodoInicio || !periodoFim) return movimentacoes

    const dataInicio = new Date(periodoInicio)
    const dataFim = new Date(periodoFim)
    dataFim.setHours(23, 59, 59, 999) // Incluir o dia inteiro

    return movimentacoes.filter(mov => {
      const dataMovimentacao = converterDataBrasileira(mov.data)
      return dataMovimentacao >= dataInicio && dataMovimentacao <= dataFim
    })
  }

  // Calcular estatísticas
  const calcularEstatisticas = async () => {
    await withLoading('calculando', async () => {
      await new Promise(resolve => setTimeout(resolve, 1500))

      const movimentacoesFiltradas = filtrarMovimentacoesPorPeriodo()
      
      // Separar vendas e compras
      const vendas = movimentacoesFiltradas.filter(m => m.tipo === 'saida')
      const compras = movimentacoesFiltradas.filter(m => m.tipo === 'entrada')

      // Calcular totais
      const totalVendas = vendas.reduce((total, venda) => total + venda.valorTotal, 0)
      const totalCompras = compras.reduce((total, compra) => total + compra.valorTotal, 0)
      
      // Calcular lucro real (considerando custo dos produtos vendidos)
      let lucroReal = 0
      vendas.forEach(venda => {
        const produto = produtos.find(p => p.codigo === venda.codigo)
        if (produto) {
          const custoVenda = produto.valorCompra * venda.quantidade
          const receitaVenda = venda.valorTotal
          lucroReal += (receitaVenda - custoVenda)
        }
      })

      // Quantidade total vendida
      const quantidadeVendida = vendas.reduce((total, venda) => total + venda.quantidade, 0)

      // Ranking de produtos mais vendidos
      const produtosVendidos: { [key: string]: { nome: string, codigo: string, quantidade: number, valor: number } } = {}
      
      vendas.forEach(venda => {
        if (produtosVendidos[venda.codigo]) {
          produtosVendidos[venda.codigo].quantidade += venda.quantidade
          produtosVendidos[venda.codigo].valor += venda.valorTotal
        } else {
          produtosVendidos[venda.codigo] = {
            nome: venda.produto,
            codigo: venda.codigo,
            quantidade: venda.quantidade,
            valor: venda.valorTotal
          }
        }
      })

      const rankingProdutos = Object.values(produtosVendidos)
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 5)

      // Vendas por categoria
      const vendasPorCategoria: { [key: string]: number } = {}
      vendas.forEach(venda => {
        const produto = produtos.find(p => p.codigo === venda.codigo)
        if (produto) {
          const categoria = produto.categoria
          vendasPorCategoria[categoria] = (vendasPorCategoria[categoria] || 0) + venda.valorTotal
        }
      })

      // Texto do período
      const dataInicioFormatada = new Date(periodoInicio).toLocaleDateString('pt-BR')
      const dataFimFormatada = new Date(periodoFim).toLocaleDateString('pt-BR')
      const periodoTexto = `${dataInicioFormatada} a ${dataFimFormatada}`

      const novasEstatisticas: Estatisticas = {
        totalVendas,
        totalCompras,
        lucroReal,
        quantidadeVendida,
        rankingProdutos,
        vendasPorCategoria,
        numeroVendas: vendas.length,
        periodoTexto
      }

      setEstatisticas(novasEstatisticas)
      toast.success('Relatório gerado!', 'Estatísticas calculadas com sucesso!')
    })
  }

  // Exportar PDF
  const handleExportarPDF = async () => {
    if (!estatisticas) {
      toast.warning('Gere o relatório primeiro', 'Calcule as estatísticas antes de exportar!')
      return
    }

    await withLoading('exportando-pdf', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      try {
        exportarRelatorioPDF(estatisticas)
        toast.success('PDF exportado!', 'Relatório salvo com sucesso!')
      } catch (error) {
        console.error('Erro ao exportar PDF:', error)
        toast.error('Erro na exportação', 'Não foi possível gerar o PDF')
      }
    })
  }

  // Exportar Excel
  const handleExportarExcel = async () => {
    if (!estatisticas) {
      toast.warning('Gere o relatório primeiro', 'Calcule as estatísticas antes de exportar!')
      return
    }

    await withLoading('exportando-excel', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      try {
        const movimentacoesFiltradas = filtrarMovimentacoesPorPeriodo()
        exportarRelatorioExcel(estatisticas, produtos, movimentacoesFiltradas)
        toast.success('Excel exportado!', 'Planilha salva com sucesso!')
      } catch (error) {
        console.error('Erro ao exportar Excel:', error)
        toast.error('Erro na exportação', 'Não foi possível gerar a planilha')
      }
    })
  }

  // Definir períodos rápidos
  const definirPeriodoRapido = (tipo: string) => {
    const hoje = new Date()
    let inicio: Date
    
    switch (tipo) {
      case 'hoje':
        inicio = new Date(hoje)
        break
      case 'semana':
        inicio = new Date(hoje)
        inicio.setDate(hoje.getDate() - 7)
        break
      case 'mes':
        inicio = new Date(hoje)
        inicio.setMonth(hoje.getMonth() - 1)
        break
      case 'trimestre':
        inicio = new Date(hoje)
        inicio.setMonth(hoje.getMonth() - 3)
        break
      case 'ano':
        inicio = new Date(hoje)
        inicio.setFullYear(hoje.getFullYear() - 1)
        break
      default:
        return
    }
    
    setPeriodoInicio(inicio.toISOString().split('T')[0])
    setPeriodoFim(hoje.toISOString().split('T')[0])
    
    toast.info('Período definido!', `Período de ${tipo} selecionado`)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <MobileHeader title="Relatórios e Análises" currentPage="/relatorios" />

      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        
        {/* Loading de carregamento inicial */}
        {isLoading('carregando') && (
          <div className="bg-white rounded-lg shadow-lg p-8 sm:p-12 mb-6">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-green-500 border-t-transparent mb-4 sm:mb-6"></div>
              <p className="text-gray-600 font-medium text-base sm:text-lg">Carregando dados...</p>
              <p className="text-gray-500 text-sm mt-2">Preparando relatórios</p>
            </div>
          </div>
        )}

        {!isLoading('carregando') && (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg shadow-lg p-4 sm:p-6 mb-6 text-white">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">📊 Relatórios e Análises</h1>
                  <p className="text-green-100 mt-1 text-sm sm:text-base">
                    Analise vendas, lucros e performance do seu estoque
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                  <LoadingButton
                    onClick={handleExportarPDF}
                    isLoading={isLoading('exportando-pdf')}
                    loadingText="Exportando..."
                    variant="secondary"
                    size="sm"
                    className="w-full sm:w-auto bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white"
                    disabled={!estatisticas}
                  >
                    📄 Exportar PDF
                  </LoadingButton>
                  <LoadingButton
                    onClick={handleExportarExcel}
                    isLoading={isLoading('exportando-excel')}
                    loadingText="Exportando..."
                    variant="secondary"
                    size="sm"
                    className="w-full sm:w-auto bg-white bg-opacity-20 hover:bg-opacity-30 text-white border-white"
                    disabled={!estatisticas}
                  >
                    📊 Exportar Excel
                  </LoadingButton>
                </div>
              </div>
            </div>

            {/* Configuração do Período */}
            <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">📅 Período de Análise</h3>
              
              {/* Períodos Rápidos */}
              <div className="mb-4">
                <label className="block text-sm font-bold text-gray-800 mb-2">Períodos Rápidos:</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-3">
                  <LoadingButton
                    onClick={() => definirPeriodoRapido('hoje')}
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs sm:text-sm"
                  >
                    📅 Hoje
                  </LoadingButton>
                  <LoadingButton
                    onClick={() => definirPeriodoRapido('semana')}
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs sm:text-sm"
                  >
                    📅 7 dias
                  </LoadingButton>
                  <LoadingButton
                    onClick={() => definirPeriodoRapido('mes')}
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs sm:text-sm"
                  >
                    📅 30 dias
                  </LoadingButton>
                  <LoadingButton
                    onClick={() => definirPeriodoRapido('trimestre')}
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs sm:text-sm"
                  >
                    📅 3 meses
                  </LoadingButton>
                  <LoadingButton
                    onClick={() => definirPeriodoRapido('ano')}
                    variant="secondary"
                    size="sm"
                    className="w-full text-xs sm:text-sm"
                  >
                    📅 1 ano
                  </LoadingButton>
                </div>
              </div>

              {/* Período Personalizado */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Data Início:</label>
                  <input
                    type="date"
                    value={periodoInicio}
                    onChange={(e) => setPeriodoInicio(e.target.value)}
                    className="w-full border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm sm:text-base"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Data Fim:</label>
                  <input
                    type="date"
                    value={periodoFim}
                    onChange={(e) => setPeriodoFim(e.target.value)}
                    className="w-full border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm sm:text-base"
                  />
                </div>
                
                <div>
                  <LoadingButton
                    onClick={calcularEstatisticas}
                    isLoading={isLoading('calculando')}
                    loadingText="Calculando..."
                    variant="primary"
                    size="md"
                    className="w-full"
                    disabled={!periodoInicio || !periodoFim}
                  >
                    📊 Gerar Relatório
                  </LoadingButton>
                </div>
              </div>

              {/* Informações do período */}
              {periodoInicio && periodoFim && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    📅 <strong>Período selecionado:</strong> {new Date(periodoInicio).toLocaleDateString('pt-BR')} a {new Date(periodoFim).toLocaleDateString('pt-BR')}
                  </p>
                  <p className="text-blue-600 text-xs mt-1">
                    {filtrarMovimentacoesPorPeriodo().length} movimentações encontradas no período
                  </p>
                </div>
              )}
            </div>

            {/* Loading de cálculo */}
            {isLoading('calculando') && (
              <div className="bg-white rounded-lg shadow-lg p-8 sm:p-12 mb-6">
                <div className="flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-green-500 border-t-transparent mb-4 sm:mb-6"></div>
                  <p className="text-gray-600 font-medium text-base sm:text-lg">Calculando estatísticas...</p>
                  <p className="text-gray-500 text-sm mt-2">Analisando vendas e lucros</p>
                </div>
              </div>
            )}

            {/* Resultados */}
            {estatisticas && !isLoading('calculando') && (
              <>
                {/* Cards de Resumo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  
                  {/* Total de Vendas */}
                  <div className="bg-gradient-to-r from-green-400 to-green-600 p-4 sm:p-6 rounded-lg shadow-lg text-white transform hover:scale-105 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-green-100 text-xs sm:text-sm">Total de Vendas</p>
                        <p className="text-lg sm:text-xl font-bold">R\$ {estatisticas.totalVendas.toFixed(2)}</p>
                        <p className="text-green-100 text-xs">{estatisticas.numeroVendas} vendas</p>
                      </div>
                      <div className="text-2xl sm:text-3xl ml-2">💰</div>
                    </div>
                  </div>

                  {/* Lucro Real */}
                  <div className="bg-gradient-to-r from-blue-400 to-blue-600 p-4 sm:p-6 rounded-lg shadow-lg text-white transform hover:scale-105 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-blue-100 text-xs sm:text-sm">Lucro Líquido</p>
                        <p className="text-lg sm:text-xl font-bold">R\$ {estatisticas.lucroReal.toFixed(2)}</p>
                        <p className="text-blue-100 text-xs">
                          {estatisticas.totalVendas > 0 ? ((estatisticas.lucroReal / estatisticas.totalVendas) * 100).toFixed(1) : '0'}% margem
                        </p>
                      </div>
                      <div className="text-2xl sm:text-3xl ml-2">📈</div>
                    </div>
                  </div>

                  {/* Quantidade Vendida */}
                  <div className="bg-gradient-to-r from-purple-400 to-purple-600 p-4 sm:p-6 rounded-lg shadow-lg text-white transform hover:scale-105 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-purple-100 text-xs sm:text-sm">Itens Vendidos</p>
                        <p className="text-lg sm:text-xl font-bold">{estatisticas.quantidadeVendida}</p>
                        <p className="text-purple-100 text-xs">unidades</p>
                      </div>
                      <div className="text-2xl sm:text-3xl ml-2">📦</div>
                    </div>
                  </div>

                  {/* Ticket Médio */}
                  <div className="bg-gradient-to-r from-orange-400 to-orange-600 p-4 sm:p-6 rounded-lg shadow-lg text-white transform hover:scale-105 transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-orange-100 text-xs sm:text-sm">Ticket Médio</p>
                        <p className="text-lg sm:text-xl font-bold">
                          R\$ {estatisticas.numeroVendas > 0 ? (estatisticas.totalVendas / estatisticas.numeroVendas).toFixed(2) : '0.00'}
                        </p>
                        <p className="text-orange-100 text-xs">por venda</p>
                      </div>
                      <div className="text-2xl sm:text-3xl ml-2">🎯</div>
                    </div>
                  </div>
                </div>

                {/* Top 5 Produtos */}
                {estatisticas.rankingProdutos.length > 0 && (
                  <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">🏆 Top 5 Produtos Mais Vendidos</h3>
                    
                    <div className="space-y-3">
                      {estatisticas.rankingProdutos.map((produto, index) => (
                        <div key={produto.codigo} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3 sm:space-x-4">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-white text-sm sm:text-base ${
                              index === 0 ? 'bg-yellow-500' : 
                              index === 1 ? 'bg-gray-400' : 
                              index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                            }`}>
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm sm:text-base">{produto.nome}</h4>
                              <p className="text-gray-500 text-xs sm:text-sm">#{produto.codigo}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900 text-sm sm:text-base">{produto.quantidade} unidades</p>
                            <p className="text-green-600 font-medium text-xs sm:text-sm">R\$ {produto.valor.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Vendas por Categoria */}
                {Object.keys(estatisticas.vendasPorCategoria).length > 0 && (
                  <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">📋 Vendas por Categoria</h3>
                    
                    <div className="space-y-3">
                      {Object.entries(estatisticas.vendasPorCategoria)
                        .sort(([,a], [,b]) => b - a)
                        .map(([categoria, valor]) => {
                          const percentual = (valor / estatisticas.totalVendas) * 100
                          return (
                            <div key={categoria} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-medium text-gray-900 text-sm sm:text-base">{categoria}</span>
                                <div className="text-right">
                                  <span className="font-bold text-gray-900 text-sm sm:text-base">R\$ {valor.toFixed(2)}</span>
                                  <span className="text-gray-500 text-xs sm:text-sm ml-2">({percentual.toFixed(1)}%)</span>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${percentual}%` }}
                                ></div>
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}

                {/* Resumo do Período */}
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 sm:p-6 border border-gray-200">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">📊 Resumo do Período</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-white rounded-lg shadow">
                      <div className="text-xl sm:text-2xl font-bold text-green-600">R\$ {estatisticas.totalVendas.toFixed(2)}</div>
                      <div className="text-green-600 text-xs sm:text-sm font-medium">Faturamento Total</div>
                    </div>
                    
                    <div className="text-center p-3 bg-white rounded-lg shadow">
                      <div className="text-xl sm:text-2xl font-bold text-blue-600">R\$ {estatisticas.lucroReal.toFixed(2)}</div>
                      <div className="text-blue-600 text-xs sm:text-sm font-medium">Lucro Líquido</div>
                    </div>
                    
                    <div className="text-center p-3 bg-white rounded-lg shadow">
                      <div className="text-xl sm:text-2xl font-bold text-purple-600">{estatisticas.numeroVendas}</div>
                      <div className="text-purple-600 text-xs sm:text-sm font-medium">Número de Vendas</div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                    <p className="text-blue-800 text-sm font-medium">
                      📅 Período analisado: {estatisticas.periodoTexto}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Estado vazio */}
            {!estatisticas && !isLoading('calculando') && (
              <div className="bg-white rounded-lg shadow-lg p-8 sm:p-12 text-center">
                <div className="text-4xl sm:text-6xl mb-4">📊</div>
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Nenhum relatório gerado</h3>
                <p className="text-gray-500 mb-4 text-sm sm:text-base">
                  Selecione um período e clique em &quot;Gerar Relatório&quot; para ver as análises.
                </p>
                <div className="text-sm text-gray-400">
                  💡 Configure as datas acima e analise suas vendas e lucros
                </div>
              </div>
            )}
          </>
        )}

      </main>
    </div>
  )
}