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

export default function Relatorios() {
  const router = useRouter()
  const { user } = useAuth()
  const toast = useToastContext()
  
  // Hooks do Firestore
  const { 
    data: produtos, 
    loading: loadingProdutos
  } = useFirestore<Produto>('produtos')

  const { 
    data: movimentacoes, 
    loading: loadingMovimentacoes
  } = useFirestore<Movimentacao>('movimentacoes')
  
  const [periodoSelecionado, setPeriodoSelecionado] = useState('30') // últimos 30 dias
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [filtroAplicado, setFiltroAplicado] = useState(false)
  const [loading, setLoading] = useState(false)

  // Loading geral
  const isLoadingData = loadingProdutos || loadingMovimentacoes

  // Função para aplicar filtro personalizado
  const aplicarFiltroPersonalizado = async () => {
    if (!dataInicio || !dataFim) {
      toast.warning('Datas obrigatórias', 'Selecione as datas de início e fim!')
      return
    }

    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      
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
    } finally {
      setLoading(false)
    }
  }

  // Função para limpar filtro personalizado
  const limparFiltroPersonalizado = async () => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 400))
      
      setDataInicio('')
      setDataFim('')
      setFiltroAplicado(false)
      setPeriodoSelecionado('30')
      toast.info('Filtros limpos', 'Voltando para os últimos 30 dias')
    } finally {
      setLoading(false)
    }
  }

  // Função para atualizar período
  const atualizarPeriodo = async (novoPeriodo: string) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 600))
      
      setPeriodoSelecionado(novoPeriodo)
      if (novoPeriodo !== 'personalizado') {
        setFiltroAplicado(false)
        setDataInicio('')
        setDataFim('')
      }
      
      toast.success('Período atualizado!', `Analisando ${novoPeriodo === 'personalizado' ? 'período personalizado' : `últimos ${novoPeriodo} dias`}`)
    } finally {
      setLoading(false)
    }
  }

  // Calcular estatísticas
  const calcularEstatisticas = () => {
    if (!movimentacoes || !produtos) {
      return {
        totalVendas: 0,
        totalCompras: 0,
        lucroReal: 0,
        quantidadeVendida: 0,
        rankingProdutos: [],
        vendasPorCategoria: {},
        numeroVendas: 0,
        periodoTexto: 'Carregando...'
      }
    }

    const agora = new Date()
    let dataInicial: Date
    let dataFinal: Date = agora

    // Determinar período baseado na seleção
    if (periodoSelecionado === 'personalizado' && dataInicio && dataFim && filtroAplicado) {
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

    // Compras do período
    const compras = movimentacoesPeriodo.filter(mov => mov.tipo === 'entrada')
    const totalCompras = compras.reduce((total, mov) => total + mov.valorTotal, 0)

    // Cálculo do lucro real
    const lucroReal = vendas.reduce((totalLucro, venda) => {
      const produto = produtos.find(p => p.codigo === venda.codigo)
      if (produto) {
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

    // Formatar o texto do período
    let periodoTexto: string
    if (periodoSelecionado === 'personalizado' && filtroAplicado) {
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
    if (!movimentacoes) return []

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

  // Função para exportar relatório - VERSÃO CORRIGIDA
  const exportarRelatorio = async (formato: 'pdf' | 'excel') => {
    if (!produtos || !movimentacoes) {
      toast.error('Dados não carregados', 'Aguarde o carregamento dos dados!')
      return
    }

    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Preparar dados do relatório
      const dadosRelatorio = {
        titulo: 'Relatório de Vendas - StockPro',
        periodo: estatisticas.periodoTexto,
        dataGeracao: new Date().toLocaleDateString('pt-BR'),
        resumo: {
          totalVendas: estatisticas.totalVendas,
          totalCompras: estatisticas.totalCompras,
          lucroReal: estatisticas.lucroReal,
          quantidadeVendida: estatisticas.quantidadeVendida,
          numeroVendas: estatisticas.numeroVendas,
          margemLucro: estatisticas.totalVendas > 0 ? ((estatisticas.lucroReal / estatisticas.totalVendas) * 100).toFixed(2) : '0.00'
        },
        estatisticas: {
          produtosCadastrados: produtos.length,
          produtosAtivos: produtos.filter(p => p.ativo).length,
          totalMovimentacoes: movimentacoes.length,
          valorEstoque: produtos.filter(p => p.ativo).reduce((total, produto) => {
            return total + (produto.estoque * produto.valorCompra)
          }, 0)
        },
        topProdutos: estatisticas.rankingProdutos,
        vendasPorCategoria: estatisticas.vendasPorCategoria
      }

      if (formato === 'pdf') {
        // Gerar HTML para PDF
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Relatório StockPro</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
              .header { text-align: center; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; margin-bottom: 30px; }
              .title { color: #4F46E5; font-size: 28px; font-weight: bold; margin: 0; }
              .subtitle { color: #6B7280; font-size: 16px; margin: 5px 0; }
              .section { margin: 25px 0; }
              .section-title { color: #374151; font-size: 18px; font-weight: bold; border-bottom: 1px solid #E5E7EB; padding-bottom: 5px; margin-bottom: 15px; }
              .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
              .card { background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 15px; }
              .card-title { font-size: 12px; color: #6B7280; text-transform: uppercase; margin: 0; }
              .card-value { font-size: 24px; font-weight: bold; color: #111827; margin: 5px 0; }
              .card-subtitle { font-size: 12px; color: #9CA3AF; margin: 0; }
              .table { width: 100%; border-collapse: collapse; margin: 15px 0; }
              .table th, .table td { border: 1px solid #E5E7EB; padding: 8px; text-align: left; }
              .table th { background: #F3F4F6; font-weight: bold; }
              .table tr:nth-child(even) { background: #F9FAFB; }
              .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #E5E7EB; color: #6B7280; font-size: 12px; }
              .positive { color: #059669; }
              .negative { color: #DC2626; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="title">📦 StockPro - Relatório de Vendas</h1>
              <p class="subtitle">Período: ${dadosRelatorio.periodo}</p>
              <p class="subtitle">Gerado em: ${dadosRelatorio.dataGeracao}</p>
            </div>

            <div class="section">
              <h2 class="section-title">💰 Resumo Financeiro</h2>
              <div class="grid">
                <div class="card">
                  <p class="card-title">Total de Vendas</p>
                  <p class="card-value positive">R\$ ${dadosRelatorio.resumo.totalVendas.toFixed(2)}</p>
                  <p class="card-subtitle">${dadosRelatorio.resumo.numeroVendas} transações</p>
                </div>
                <div class="card">
                  <p class="card-title">Total de Compras</p>
                  <p class="card-value">R\$ ${dadosRelatorio.resumo.totalCompras.toFixed(2)}</p>
                  <p class="card-subtitle">Investimento</p>
                </div>
                <div class="card">
                  <p class="card-title">Lucro Líquido</p>
                  <p class="card-value ${dadosRelatorio.resumo.lucroReal >= 0 ? 'positive' : 'negative'}">R\$ ${dadosRelatorio.resumo.lucroReal.toFixed(2)}</p>
                  <p class="card-subtitle">${dadosRelatorio.resumo.margemLucro}% margem</p>
                </div>
                <div class="card">
                  <p class="card-title">Valor do Estoque</p>
                  <p class="card-value">R\$ ${dadosRelatorio.estatisticas.valorEstoque.toFixed(2)}</p>
                  <p class="card-subtitle">Investimento atual</p>
                </div>
              </div>
            </div>

            <div class="section">
              <h2 class="section-title">📊 Estatísticas Gerais</h2>
              <div class="grid">
                <div class="card">
                  <p class="card-title">Produtos Cadastrados</p>
                  <p class="card-value">${dadosRelatorio.estatisticas.produtosCadastrados}</p>
                  <p class="card-subtitle">${dadosRelatorio.estatisticas.produtosAtivos} ativos</p>
                </div>
                <div class="card">
                  <p class="card-title">Itens Vendidos</p>
                  <p class="card-value">${dadosRelatorio.resumo.quantidadeVendida}</p>
                  <p class="card-subtitle">Unidades</p>
                </div>
                <div class="card">
                  <p class="card-title">Movimentações</p>
                  <p class="card-value">${dadosRelatorio.estatisticas.totalMovimentacoes}</p>
                  <p class="card-subtitle">Total registrado</p>
                </div>
              </div>
            </div>

            ${dadosRelatorio.topProdutos.length > 0 ? `
            <div class="section">
              <h2 class="section-title">🏆 Top 5 Produtos Mais Vendidos</h2>
              <table class="table">
                <thead>
                  <tr>
                    <th>Posição</th>
                    <th>Produto</th>
                    <th>Código</th>
                    <th>Quantidade</th>
                    <th>Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${dadosRelatorio.topProdutos.map((produto: any, index: number) => `
                    <tr>
                      <td>${index + 1}º</td>
                      <td>${produto.nome}</td>
                      <td>#${produto.codigo}</td>
                      <td>${produto.quantidade} un.</td>
                      <td>R\$ ${produto.valor.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ` : ''}

            ${Object.keys(dadosRelatorio.vendasPorCategoria).length > 0 ? `
            <div class="section">
              <h2 class="section-title">📋 Vendas por Categoria</h2>
              <table class="table">
                <thead>
                  <tr>
                    <th>Categoria</th>
                    <th>Valor Total</th>
                    <th>Participação</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(dadosRelatorio.vendasPorCategoria)
                    .sort(([,a], [,b]) => (b as number) - (a as number))
                    .map(([categoria, valor]) => {
                      const participacao = ((valor as number) / dadosRelatorio.resumo.totalVendas * 100).toFixed(1)
                      return `
                        <tr>
                          <td>${categoria}</td>
                          <td>R\$ ${(valor as number).toFixed(2)}</td>
                          <td>${participacao}%</td>
                        </tr>
                      `
                    }).join('')}
                </tbody>
              </table>
            </div>
            ` : ''}

            <div class="footer">
              <p>Relatório gerado automaticamente pelo sistema StockPro</p>
              <p>© ${new Date().getFullYear()} - Todos os direitos reservados</p>
            </div>
          </body>
          </html>
        `

        // Download HTML (que pode ser impresso como PDF)
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `relatorio-stockpro-${new Date().toISOString().split('T')[0]}.html`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        toast.success(
          'PDF exportado!', 
          'Arquivo HTML baixado - abra no navegador e imprima como PDF'
        )
      } else {
        // Gerar CSV para Excel
        let csvContent = '\uFEFF' // BOM para UTF-8
        
        csvContent += `StockPro - Relatório de Vendas\n`
        csvContent += `Data de Geração,${dadosRelatorio.dataGeracao}\n`
        csvContent += `Período,${dadosRelatorio.periodo}\n\n`
        
        csvContent += `RESUMO FINANCEIRO\n`
        csvContent += `Métrica,Valor\n`
        csvContent += `Total de Vendas,R\$ ${dadosRelatorio.resumo.totalVendas.toFixed(2)}\n`
        csvContent += `Total de Compras,R\$ ${dadosRelatorio.resumo.totalCompras.toFixed(2)}\n`
        csvContent += `Lucro Líquido,R\$ ${dadosRelatorio.resumo.lucroReal.toFixed(2)}\n`
        csvContent += `Margem de Lucro,${dadosRelatorio.resumo.margemLucro}%\n`
        csvContent += `Quantidade Vendida,${dadosRelatorio.resumo.quantidadeVendida} unidades\n`
        csvContent += `Número de Vendas,${dadosRelatorio.resumo.numeroVendas} transações\n`
        csvContent += `Valor do Estoque,R\$ ${dadosRelatorio.estatisticas.valorEstoque.toFixed(2)}\n\n`
        
        csvContent += `ESTATÍSTICAS GERAIS\n`
        csvContent += `Métrica,Valor\n`
        csvContent += `Produtos Cadastrados,${dadosRelatorio.estatisticas.produtosCadastrados}\n`
        csvContent += `Produtos Ativos,${dadosRelatorio.estatisticas.produtosAtivos}\n`
        csvContent += `Total de Movimentações,${dadosRelatorio.estatisticas.totalMovimentacoes}\n\n`
        
        if (dadosRelatorio.topProdutos.length > 0) {
          csvContent += `TOP 5 PRODUTOS MAIS VENDIDOS\n`
          csvContent += `Posição,Produto,Código,Quantidade,Valor Total\n`
          dadosRelatorio.topProdutos.forEach((produto: any, index: number) => {
            csvContent += `${index + 1},${produto.nome},${produto.codigo},${produto.quantidade},R\$ ${produto.valor.toFixed(2)}\n`
          })
          csvContent += `\n`
        }
        
        if (Object.keys(dadosRelatorio.vendasPorCategoria).length > 0) {
          csvContent += `VENDAS POR CATEGORIA\n`
          csvContent += `Categoria,Valor Total,Participação %\n`
          Object.entries(dadosRelatorio.vendasPorCategoria)
            .sort(([,a], [,b]) => (b as number) - (a as number))
            .forEach(([categoria, valor]) => {
              const participacao = ((valor as number) / dadosRelatorio.resumo.totalVendas * 100).toFixed(1)
              csvContent += `${categoria},R\$ ${(valor as number).toFixed(2)},${participacao}%\n`
            })
          csvContent += `\n`
        }
        
        csvContent += `INFORMAÇÕES ADICIONAIS\n`
        csvContent += `Sistema,StockPro\n`
        csvContent += `Versão,1.0\n`
        csvContent += `Gerado em,${new Date().toLocaleString('pt-BR')}\n`
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `relatorio-stockpro-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        toast.success(
          'Excel exportado!', 
          'Arquivo CSV baixado - abra no Excel para visualizar'
        )
      }
    } catch (error) {
      console.error('Erro ao exportar:', error)
      toast.error(
        'Erro na exportação', 
        `Não foi possível gerar o relatório em ${formato.toUpperCase()}`
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <MobileHeader title="Relatórios e Análises" currentPage="/relatorios" />

        <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          
          {/* Loading de carregamento inicial */}
          {isLoadingData && (
            <div className="bg-white rounded-lg shadow-lg p-8 sm:p-12 mb-6">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-green-500 border-t-transparent mb-4 sm:mb-6"></div>
                <p className="text-gray-600 font-medium text-base sm:text-lg">Carregando relatórios...</p>
                <p className="text-gray-500 text-sm mt-2">Sincronizando dados do Firebase</p>
              </div>
            </div>
          )}

          {/* Filtro de Período com Calendário */}
          {!isLoadingData && (
            <div className="mb-6 bg-white p-4 sm:p-6 rounded-lg shadow-lg border">
              <div className="space-y-4">
                <div className="flex flex-col space-y-4">
                  <label className="text-base sm:text-lg font-bold text-gray-800">📅 Período de Análise:</label>
                  <select
                    value={periodoSelecionado}
                    onChange={(e) => atualizarPeriodo(e.target.value)}
                    disabled={loading}
                    className="w-full border-2 border-gray-600 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-bold bg-white text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm disabled:opacity-60"
                  >
                    <option value="7">Últimos 7 dias</option>
                    <option value="30">Últimos 30 dias</option>
                    <option value="90">Últimos 90 dias</option>
                    <option value="365">Último ano</option>
                    <option value="personalizado">📅 Personalizado</option>
                  </select>
                  
                  {/* Loading indicator para período */}
                  {loading && (
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
                            disabled={loading}
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
                            disabled={loading}
                            className="w-full border-2 border-purple-600 rounded-md px-3 py-2 text-sm sm:text-base font-bold bg-white text-gray-900 focus:ring-2 focus:ring-purple-300 focus:border-purple-700 shadow-sm disabled:opacity-60"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                        <LoadingButton
                          onClick={aplicarFiltroPersonalizado}
                          isLoading={loading}
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
                            isLoading={loading}
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
                    📊 {movimentacoes?.length || 0} movimentações
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
                      isLoading={loading}
                      loadingText="Gerando PDF..."
                      variant="danger"
                      size="md"
                      className="flex-1 sm:flex-none"
                      disabled={!produtos || !movimentacoes}
                    >
                      📄 Exportar PDF
                    </LoadingButton>
                    <LoadingButton
                      onClick={() => exportarRelatorio('excel')}
                      isLoading={loading}
                      loadingText="Gerando Excel..."
                      variant="success"
                      size="md"
                      className="flex-1 sm:flex-none"
                      disabled={!produtos || !movimentacoes}
                    >
                      �� Exportar Excel
                    </LoadingButton>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cards de Resumo */}
          {!isLoadingData && produtos && movimentacoes && (
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
          {!isLoadingData && movimentacoes && (
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

          {!isLoadingData && produtos && movimentacoes && (
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
          {!isLoadingData && (
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
    </ProtectedRoute>
  )
}