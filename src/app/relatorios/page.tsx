'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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

export default function Relatorios() {
  const router = useRouter()
  const toast = useToastContext()
  const { isLoading, withLoading } = useLoading()
  
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])
  const [periodoSelecionado, setPeriodoSelecionado] = useState('30') // últimos 30 dias
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [filtroAplicado, setFiltroAplicado] = useState(false)

  // Carregar dados
  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    await withLoading('carregando', async () => {
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simular carregamento
      
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
  }

  // Função para aplicar filtro personalizado
  const aplicarFiltroPersonalizado = async () => {
    await withLoading('aplicando-filtro', async () => {
      await new Promise(resolve => setTimeout(resolve, 800)) // Simular processamento
      
      if (!dataInicio || !dataFim) {
        toast.warning('Datas obrigatórias', 'Selecione as datas de início e fim!')
        return
      }

      const inicio = new Date(dataInicio)
      const fim = new Date(dataFim)

      if (inicio > fim) {
        toast.error('Período inválido', 'Data de início deve ser anterior à data de fim!')
        return
      }

      if (inicio > new Date()) {
        toast.warning('Data futura', 'Data de início não pode ser no futuro!')
        return
      }

      const diffTime = Math.abs(fim.getTime() - inicio.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays > 365) {
        toast.warning('Período muito longo', 'Período máximo de 1 ano para melhor performance!')
        return
      }

      setFiltroAplicado(true)
      toast.success('Filtro aplicado!', `Analisando período de ${diffDays + 1} dias`)
    })
  }

  // Função para limpar filtro personalizado
  const limparFiltroPersonalizado = async () => {
    await withLoading('limpando-filtro', async () => {
      await new Promise(resolve => setTimeout(resolve, 400)) // Simular processamento
      
      setDataInicio('')
      setDataFim('')
      setFiltroAplicado(false)
      setPeriodoSelecionado('30')
      toast.info('Filtros limpos', 'Voltando para os últimos 30 dias')
    })
  }

  // Função para atualizar período
  const atualizarPeriodo = async (novoPeriodo: string) => {
    await withLoading('atualizando-periodo', async () => {
      await new Promise(resolve => setTimeout(resolve, 600)) // Simular processamento
      
      setPeriodoSelecionado(novoPeriodo)
      if (novoPeriodo !== 'personalizado') {
        setFiltroAplicado(false)
        setDataInicio('')
        setDataFim('')
      }
      
      toast.success('Período atualizado!', `Analisando ${novoPeriodo === 'personalizado' ? 'período personalizado' : `últimos ${novoPeriodo} dias`}`)
    })
  }

  // Calcular estatísticas
  const calcularEstatisticas = () => {
    const agora = new Date()
    let dataInicial: Date
    let dataFinal: Date = agora

    // Determinar período baseado na seleção
    if (periodoSelecionado === 'personalizado' && dataInicio && dataFim && filtroAplicado) {
      // CORREÇÃO: Criar datas corretamente sem problemas de timezone
      const [anoInicio, mesInicio, diaInicio] = dataInicio.split('-').map(Number)
      const [anoFim, mesFim, diaFim] = dataFim.split('-').map(Number)
      
      dataInicial = new Date(anoInicio, mesInicio - 1, diaInicio, 0, 0, 0, 0)
      dataFinal = new Date(anoFim, mesFim - 1, diaFim, 23, 59, 59, 999)
    } else {
      const diasAtras = new Date()
      diasAtras.setDate(agora.getDate() - parseInt(periodoSelecionado))
      dataInicial = diasAtras
    }

    // Filtrar movimentações do período
    const movimentacoesPeriodo = movimentacoes.filter(mov => {
      const [dia, mes, ano] = mov.data.split('/')
      const dataMovimentacao = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
      return dataMovimentacao >= dataInicial && dataMovimentacao <= dataFinal
    })

    // Vendas do período
    const vendas = movimentacoesPeriodo.filter(mov => mov.tipo === 'saida')
    const totalVendas = vendas.reduce((total, mov) => total + mov.valorTotal, 0)
    const quantidadeVendida = vendas.reduce((total, mov) => total + mov.quantidade, 0)

    // Compras do período (para referência)
    const compras = movimentacoesPeriodo.filter(mov => mov.tipo === 'entrada')
    const totalCompras = compras.reduce((total, mov) => total + mov.valorTotal, 0)

    // CÁLCULO CORRETO DO LUCRO REAL
    const lucroReal = vendas.reduce((totalLucro, venda) => {
      // Encontrar o produto para pegar o valor de compra
      const produto = produtos.find(p => p.codigo === venda.codigo)
      if (produto) {
        // Lucro = (Valor Venda - Valor Compra) × Quantidade
        const lucroVenda = (venda.valorUnitario - produto.valorCompra) * venda.quantidade
        return totalLucro + lucroVenda
      }
      return totalLucro
    }, 0)

    // Produtos mais vendidos
    const produtosVendidos: { [key: string]: { nome: string, quantidade: number, valor: number } } = {}
    
    vendas.forEach(venda => {
      if (produtosVendidos[venda.codigo]) {
        produtosVendidos[venda.codigo].quantidade += venda.quantidade
        produtosVendidos[venda.codigo].valor += venda.valorTotal
      } else {
        produtosVendidos[venda.codigo] = {
          nome: venda.produto,
          quantidade: venda.quantidade,
          valor: venda.valorTotal
        }
      }
    })

    const rankingProdutos = Object.entries(produtosVendidos)
      .map(([codigo, dados]) => ({ codigo, ...dados }))
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5)

    // Vendas por categoria
    const vendasPorCategoria: { [key: string]: number } = {}
    
    vendas.forEach(venda => {
      const produto = produtos.find(p => p.codigo === venda.codigo)
      if (produto) {
        vendasPorCategoria[produto.categoria] = (vendasPorCategoria[produto.categoria] || 0) + venda.valorTotal
      }
    })

    // CORREÇÃO: Formatar o texto do período corretamente
    let periodoTexto: string
    if (periodoSelecionado === 'personalizado' && filtroAplicado) {
      // Usar as datas originais do input, não as datas calculadas
      const dataInicioFormatada = new Date(dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')
      const dataFimFormatada = new Date(dataFim + 'T00:00:00').toLocaleDateString('pt-BR')
      periodoTexto = `${dataInicioFormatada} até ${dataFimFormatada}`
    } else {
      periodoTexto = `Últimos ${periodoSelecionado} dias`
    }

    return {
      totalVendas,
      totalCompras,
      lucroReal,
      quantidadeVendida,
      rankingProdutos,
      vendasPorCategoria,
      numeroVendas: vendas.length,
      periodoTexto
    }
  }

  const estatisticas = calcularEstatisticas()

  // Gerar dados para gráfico de vendas por dia (últimos 7 dias)
  const gerarDadosVendasDiarias = () => {
    const dados = []
    const hoje = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const data = new Date()
      data.setDate(hoje.getDate() - i)
      const dataStr = data.toLocaleDateString('pt-BR')
      
      const vendasDia = movimentacoes
        .filter(mov => mov.tipo === 'saida' && mov.data === dataStr)
        .reduce((total, mov) => total + mov.valorTotal, 0)
      
      dados.push({
        dia: data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit' }),
        vendas: vendasDia
      })
    }
    
    return dados
  }

  const dadosVendasDiarias = gerarDadosVendasDiarias()
  const maxVenda = Math.max(...dadosVendasDiarias.map(d => d.vendas), 1)

  // Função para exportar relatório REAL
  const exportarRelatorio = async (formato: 'pdf' | 'excel') => {
    await withLoading(`exportando-${formato}`, async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1500)) // Simular processamento
        
        if (formato === 'pdf') {
          exportarRelatorioPDF(estatisticas, produtos, movimentacoes)
          toast.success(
            'PDF exportado!', 
            'Relatório em PDF foi baixado com sucesso!'
          )
        } else {
          exportarRelatorioExcel(estatisticas, produtos, movimentacoes)
          toast.success(
            'Excel exportado!', 
            'Relatório em Excel foi baixado com sucesso!'
          )
        }
      } catch (error) {
        console.error('Erro ao exportar:', error)
        toast.error(
          'Erro na exportação', 
          `Não foi possível gerar o relatório em ${formato.toUpperCase()}`
        )
      }
    })
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
              <p className="text-gray-600 font-medium text-base sm:text-lg">Carregando relatórios...</p>
              <p className="text-gray-500 text-sm mt-2">Analisando dados de produtos e movimentações</p>
            </div>
          </div>
        )}

        {/* Filtro de Período com Calendário */}
        {!isLoading('carregando') && (
          <div className="mb-6 bg-white p-4 sm:p-6 rounded-lg shadow-lg border">
            <div className="space-y-4">
              <div className="flex flex-col space-y-4">
                <label className="text-base sm:text-lg font-bold text-gray-800">📅 Período de Análise:</label>
                <select
                  value={periodoSelecionado}
                  onChange={(e) => atualizarPeriodo(e.target.value)}
                  disabled={isLoading('atualizando-periodo')}
                  className="w-full border-2 border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-bold bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm disabled:opacity-60"
                >
                  <option value="7">Últimos 7 dias</option>
                  <option value="30">Últimos 30 dias</option>
                  <option value="90">Últimos 90 dias</option>
                  <option value="365">Último ano</option>
                  <option value="personalizado">📅 Personalizado</option>
                </select>
                
                {/* Loading indicator para período */}
                {isLoading('atualizando-periodo') && (
                  <div className="flex items-center space-x-2 text-purple-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                    <span className="text-sm font-medium">Atualizando...</span>
                  </div>
                )}
                
                {/* Campos de data personalizados */}
                {periodoSelecionado === 'personalizado' && (
                  <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-lg border-2 border-purple-400 shadow-md space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-purple-900 mb-2">📅 Data Início:</label>
                        <input
                          type="date"
                          value={dataInicio}
                          onChange={(e) => setDataInicio(e.target.value)}
                          max={new Date().toISOString().split('T')[0]}
                          disabled={isLoading('aplicando-filtro') || isLoading('limpando-filtro')}
                          className="w-full border-2 border-purple-600 rounded-md px-3 py-2 text-sm sm:text-base font-bold bg-white text-gray-900 focus:ring-2 focus:ring-purple-300 focus:border-purple-700 shadow-sm disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-purple-900 mb-2">📅 Data Fim:</label>
                        <input
                          type="date"
                          value={dataFim}
                          onChange={(e) => setDataFim(e.target.value)}
                          min={dataInicio}
                          max={new Date().toISOString().split('T')[0]}
                          disabled={isLoading('aplicando-filtro') || isLoading('limpando-filtro')}
                          className="w-full border-2 border-purple-600 rounded-md px-3 py-2 text-sm sm:text-base font-bold bg-white text-gray-900 focus:ring-2 focus:ring-purple-300 focus:border-purple-700 shadow-sm disabled:opacity-60"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                      <LoadingButton
                        onClick={aplicarFiltroPersonalizado}
                        isLoading={isLoading('aplicando-filtro')}
                        loadingText="Aplicando..."
                        disabled={!dataInicio || !dataFim}
                        variant="primary"
                        size="md"
                        className="flex-1"
                      >
                        🔍 Aplicar Filtro
                      </LoadingButton>
                      {filtroAplicado && (
                        <LoadingButton
                          onClick={limparFiltroPersonalizado}
                          isLoading={isLoading('limpando-filtro')}
                          loadingText="Limpando..."
                          variant="secondary"
                          size="md"
                          className="flex-1"
                        >
                          🧹 Limpar Filtro
                        </LoadingButton>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                <div className="text-sm sm:text-base text-gray-800 bg-gray-200 px-3 sm:px-4 py-2 rounded-lg font-medium border">
                  📊 {movimentacoes.length} movimentações
                  {periodoSelecionado === 'personalizado' && filtroAplicado && (
                    <div className="text-xs sm:text-sm text-purple-600 mt-1">
                      📅 {estatisticas.periodoTexto}
                    </div>
                  )}
                </div>
                
                {/* Botões de exportação FUNCIONAIS */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                  <LoadingButton
                    onClick={() => exportarRelatorio('pdf')}
                    isLoading={isLoading('exportando-pdf')}
                    loadingText="Gerando PDF..."
                    variant="danger"
                    size="md"
                    className="flex-1 sm:flex-none"
                  >
                    📄 Exportar PDF
                  </LoadingButton>
                  <LoadingButton
                    onClick={() => exportarRelatorio('excel')}
                    isLoading={isLoading('exportando-excel')}
                    loadingText="Gerando Excel..."
                    variant="success"
                    size="md"
                    className="flex-1 sm:flex-none"
                  >
                    📊 Exportar Excel
                  </LoadingButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cards de Resumo */}
        {!isLoading('carregando') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
            
            {/* Total de Vendas */}
            <div className="bg-gradient-to-r from-green-400 to-green-600 p-4 sm:p-6 rounded-lg shadow-lg text-white transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-green-100 text-xs sm:text-sm">Total de Vendas</p>
                  <p className="text-lg sm:text-2xl font-bold">R\$ {estatisticas.totalVendas.toFixed(2)}</p>
                  <p className="text-green-100 text-xs">{estatisticas.numeroVendas} transações</p>
                </div>
                <div className="text-2xl sm:text-3xl ml-2">💰</div>
              </div>
            </div>

            {/* Total de Compras */}
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 p-4 sm:p-6 rounded-lg shadow-lg text-white transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-blue-100 text-xs sm:text-sm">Total de Compras</p>
                  <p className="text-lg sm:text-2xl font-bold">R\$ {estatisticas.totalCompras.toFixed(2)}</p>
                  <p className="text-blue-100 text-xs">Investimento</p>
                </div>
                <div className="text-2xl sm:text-3xl ml-2">🛒</div>
              </div>
            </div>

            {/* Valor do Estoque */}
            <div className="bg-gradient-to-r from-indigo-400 to-indigo-600 p-4 sm:p-6 rounded-lg shadow-lg text-white transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-indigo-100 text-xs sm:text-sm">Valor do Estoque</p>
                  <p className="text-lg sm:text-2xl font-bold">R\$ {(() => {
                    const valorEstoque = produtos.filter(p => p.ativo).reduce((total, produto) => {
                      return total + (produto.estoque * produto.valorCompra)
                    }, 0)
                    return valorEstoque.toFixed(2)
                  })()}</p>
                  <p className="text-indigo-100 text-xs">Investimento atual</p>
                </div>
                <div className="text-2xl sm:text-3xl ml-2">🏦</div>
              </div>
            </div>

            {/* Lucro Real */}
            {estatisticas.totalVendas > 0 ? (
              <div className={`bg-gradient-to-r ${estatisticas.lucroReal >= 0 ? 'from-purple-400 to-purple-600' : 'from-red-400 to-red-600'} p-4 sm:p-6 rounded-lg shadow-lg text-white transform hover:scale-105 transition-all duration-200`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-purple-100 text-xs sm:text-sm">Lucro Líquido</p>
                    <p className="text-lg sm:text-2xl font-bold">R\$ {estatisticas.lucroReal.toFixed(2)}</p>
                    <p className="text-purple-100 text-xs">
                      {estatisticas.totalVendas > 0 ? ((estatisticas.lucroReal / estatisticas.totalVendas) * 100).toFixed(1) : '0.0'}% margem
                    </p>
                  </div>
                  <div className="text-2xl sm:text-3xl ml-2">{estatisticas.lucroReal >= 0 ? '📈' : '📉'}</div>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-r from-gray-400 to-gray-600 p-4 sm:p-6 rounded-lg shadow-lg text-white">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-gray-100 text-xs sm:text-sm">Lucro Líquido</p>
                    <p className="text-lg sm:text-xl font-bold">Aguardando vendas</p>
                    <p className="text-gray-100 text-xs">Faça vendas para ver o lucro</p>
                  </div>
                  <div className="text-2xl sm:text-3xl ml-2">⏳</div>
                </div>
              </div>
            )}

            {/* Produtos Vendidos */}
            <div className="bg-gradient-to-r from-orange-400 to-orange-600 p-4 sm:p-6 rounded-lg shadow-lg text-white transform hover:scale-105 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-orange-100 text-xs sm:text-sm">Itens Vendidos</p>
                  <p className="text-lg sm:text-2xl font-bold">{estatisticas.quantidadeVendida}</p>
                  <p className="text-orange-100 text-xs">Unidades</p>
                </div>
                <div className="text-2xl sm:text-3xl ml-2">📦</div>
              </div>
            </div>
          </div>
        )}

        {/* Gráfico de Vendas por Dia */}
        {!isLoading('carregando') && (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">📊 Vendas dos Últimos 7 Dias</h3>
            <div className="h-48 sm:h-64 flex items-end space-x-1 sm:space-x-2">
              {dadosVendasDiarias.map((dado, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="bg-gradient-to-t from-purple-500 to-purple-300 w-full rounded-t hover:from-purple-600 hover:to-purple-400 transition-all duration-200 cursor-pointer"
                    style={{ 
                      height: `${Math.max((dado.vendas / maxVenda) * 160, 4)}px`,
                      minHeight: '4px'
                    }}
                    title={`${dado.dia}: R\$ ${dado.vendas.toFixed(2)}`}
                  ></div>
                  <div className="text-xs text-gray-600 mt-2 text-center">
                    <div className="text-xs sm:text-sm">{dado.dia}</div>
                    <div className="font-bold text-purple-600 text-xs">R\$ {dado.vendas.toFixed(0)}</div>
                  </div>
                </div>
              ))}
            </div>
            {maxVenda === 0 && (
              <div className="text-center text-gray-500 py-8">
                📈 Nenhuma venda registrada nos últimos 7 dias
              </div>
            )}
          </div>
        )}

        {!isLoading('carregando') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            
            {/* Produtos Mais Vendidos */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">🏆 Top 5 Produtos Mais Vendidos</h3>
              {estatisticas.rankingProdutos.length === 0 ? (
                <div className="text-center text-gray-500 py-6 sm:py-8">
                  📦 Nenhuma venda registrada no período
                </div>
              ) : (
                <div className="space-y-3">
                  {estatisticas.rankingProdutos.map((produto, index) => (
                    <div key={produto.codigo} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
                      <div className="flex items-center space-x-3">
                        <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm ${
                          index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{produto.nome}</p>
                          <p className="text-xs sm:text-sm text-gray-500">#{produto.codigo}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900 text-sm sm:text-base">{produto.quantidade} un.</p>
                        <p className="text-xs sm:text-sm text-green-600">R\$ {produto.valor.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Vendas por Categoria */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">📋 Vendas por Categoria</h3>
              {Object.keys(estatisticas.vendasPorCategoria).length === 0 ? (
                <div className="text-center text-gray-500 py-6 sm:py-8">
                  📊 Nenhuma venda por categoria registrada
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(estatisticas.vendasPorCategoria)
                    .sort(([,a], [,b]) => b - a)
                    .map(([categoria, valor]) => {
                      const maxValor = Math.max(...Object.values(estatisticas.vendasPorCategoria))
                      const largura = (valor / maxValor) * 100
                      
                      return (
                        <div key={categoria} className="space-y-1">
                          <div className="flex justify-between text-xs sm:text-sm">
                            <span className="font-medium text-gray-700 truncate">{categoria}</span>
                            <span className="text-gray-900 font-bold ml-2">R\$ {valor.toFixed(2)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 hover:from-blue-600 hover:to-purple-600"
                              style={{ width: `${largura}%` }}
                            ></div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Informações Adicionais */}
        {!isLoading('carregando') && (
          <div className="mt-6 sm:mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="text-xl sm:text-2xl">💡</div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Dicas para Análise
                </h3>
                <div className="mt-2 text-xs sm:text-sm text-blue-700 space-y-1">
                  <p>• Use diferentes períodos para comparar performance</p>
                  <p>• Monitore produtos com baixa rotatividade</p>
                  <p>• Analise a margem de lucro por categoria</p>
                  <p>• Identifique padrões de venda sazonal</p>
                  <p>• Exporte relatórios para análises mais detalhadas</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}