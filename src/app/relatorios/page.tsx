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
  // 🆕 CAMPOS DE VALIDADE
  temValidade?: boolean
  dataValidade?: string
  diasAlerta?: number
  marca?: string
  modelo?: string
  camposEspecificos?: Record<string, any>
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
  // 🆕 ESTADO PARA ABA ATIVA
  const [abaAtiva, setAbaAtiva] = useState<'vendas' | 'validade' | 'estoque'>('vendas')

  // Loading geral
  const isLoadingData = loadingProdutos || loadingMovimentacoes

  // 🆕 FUNÇÃO PARA VERIFICAR VALIDADE
  const verificarValidade = (produto: Produto) => {
    if (!produto.temValidade || !produto.dataValidade) return { status: 'sem_validade', diasRestantes: null }

    const hoje = new Date()
    const dataValidade = new Date(produto.dataValidade)
    const diasRestantes = Math.ceil((dataValidade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
    const diasAlerta = produto.diasAlerta || 30

    if (diasRestantes < 0) return { status: 'vencido', diasRestantes }
    if (diasRestantes === 0) return { status: 'vence_hoje', diasRestantes }
    if (diasRestantes <= 7) return { status: 'vence_em_7_dias', diasRestantes }
    if (diasRestantes <= diasAlerta) return { status: 'proximo_vencimento', diasRestantes }
    
    return { status: 'valido', diasRestantes }
  }

  // 🆕 CALCULAR ESTATÍSTICAS DE VALIDADE
  const calcularEstatisticasValidade = () => {
    if (!produtos) return {
      vencidos: [],
      vencendoHoje: [],
      vencendoEm7Dias: [],
      proximoVencimento: [],
      validos: [],
      semValidade: [],
      totalComValidade: 0,
      valorPerdido: 0
    }

    const vencidos: Produto[] = []
    const vencendoHoje: Produto[] = []
    const vencendoEm7Dias: Produto[] = []
    const proximoVencimento: Produto[] = []
    const validos: Produto[] = []
    const semValidade: Produto[] = []

    produtos.forEach(produto => {
      if (!produto.ativo) return

      const validadeInfo = verificarValidade(produto)
      
      switch (validadeInfo.status) {
        case 'vencido':
          vencidos.push(produto)
          break
        case 'vence_hoje':
          vencendoHoje.push(produto)
          break
        case 'vence_em_7_dias':
          vencendoEm7Dias.push(produto)
          break
        case 'proximo_vencimento':
          proximoVencimento.push(produto)
          break
        case 'valido':
          validos.push(produto)
          break
        default:
          semValidade.push(produto)
      }
    })

    // Calcular valor perdido com produtos vencidos
    const valorPerdido = vencidos.reduce((total, produto) => {
      return total + (produto.estoque * produto.valorCompra)
    }, 0)

    return {
      vencidos,
      vencendoHoje,
      vencendoEm7Dias,
      proximoVencimento,
      validos,
      semValidade,
      totalComValidade: produtos.filter(p => p.temValidade && p.ativo).length,
      valorPerdido
    }
  }

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

  // Calcular estatísticas de vendas
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
  const estatisticasValidade = calcularEstatisticasValidade()

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

  // 🆕 FUNÇÃO PARA EXPORTAR RELATÓRIO COM VALIDADE
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
        titulo: 'Relatório Completo - StockPro',
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
        // 🆕 DADOS DE VALIDADE
        validade: {
          totalComValidade: estatisticasValidade.totalComValidade,
          vencidos: estatisticasValidade.vencidos.length,
          vencendoHoje: estatisticasValidade.vencendoHoje.length,
          vencendoEm7Dias: estatisticasValidade.vencendoEm7Dias.length,
          proximoVencimento: estatisticasValidade.proximoVencimento.length,
          valorPerdido: estatisticasValidade.valorPerdido,
          produtosVencidos: estatisticasValidade.vencidos.map(p => ({
            nome: p.nome,
            codigo: p.codigo,
            categoria: p.categoria,
            estoque: p.estoque,
            dataValidade: p.dataValidade ? new Date(p.dataValidade).toLocaleDateString('pt-BR') : 'N/A',
            valorPerdido: p.estoque * p.valorCompra
          }))
        },
        topProdutos: estatisticas.rankingProdutos,
        vendasPorCategoria: estatisticas.vendasPorCategoria
      }

      if (formato === 'pdf') {
        // Gerar HTML para PDF com dados de validade
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>Relatório Completo StockPro</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
              .header { text-align: center; border-bottom: 2px solid #4F46E5; padding-bottom: 20px; margin-bottom: 30px; }
              .title { color: #4F46E5; font-size: 28px; font-weight: bold; margin: 0; }
              .subtitle { color: #6B7280; font-size: 16px; margin: 5px 0; }
              .section { margin: 25px 0; page-break-inside: avoid; }
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
              .warning { color: #D97706; }
              .critical { color: #DC2626; font-weight: bold; }
              .alert-box { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 8px; padding: 15px; margin: 15px 0; }
              @media print { body { margin: 0; } .section { page-break-inside: avoid; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="title">📦 StockPro - Relatório Completo</h1>
              <p class="subtitle">Período: ${dadosRelatorio.periodo}</p>
              <p class="subtitle">Gerado em: ${dadosRelatorio.dataGeracao}</p>
            </div>

            <!-- Alertas Críticos de Validade -->
            ${(dadosRelatorio.validade.vencidos > 0 || dadosRelatorio.validade.vencendoHoje > 0) ? `
            <div class="alert-box">
              <h2 class="critical">🚨 ALERTAS CRÍTICOS DE VALIDADE</h2>
              <ul>
                ${dadosRelatorio.validade.vencidos > 0 ? `<li class="critical">${dadosRelatorio.validade.vencidos} produto(s) VENCIDO(S)</li>` : ''}
                ${dadosRelatorio.validade.vencendoHoje > 0 ? `<li class="critical">${dadosRelatorio.validade.vencendoHoje} produto(s) vencendo HOJE</li>` : ''}
                ${dadosRelatorio.validade.valorPerdido > 0 ? `<li class="negative">Valor perdido: R$ ${dadosRelatorio.validade.valorPerdido.toFixed(2)}</li>` : ''}
              </ul>
            </div>
            ` : ''}

            <div class="section">
              <h2 class="section-title">💰 Resumo Financeiro</h2>
              <div class="grid">
                <div class="card">
                  <p class="card-title">Total de Vendas</p>
                  <p class="card-value positive">R$ ${dadosRelatorio.resumo.totalVendas.toFixed(2)}</p>
                  <p class="card-subtitle">${dadosRelatorio.resumo.numeroVendas} transações</p>
                </div>
                <div class="card">
                  <p class="card-title">Total de Compras</p>
                  <p class="card-value">R$ ${dadosRelatorio.resumo.totalCompras.toFixed(2)}</p>
                  <p class="card-subtitle">Investimento</p>
                </div>
                <div class="card">
                  <p class="card-title">Lucro Líquido</p>
                  <p class="card-value ${dadosRelatorio.resumo.lucroReal >= 0 ? 'positive' : 'negative'}">R$ ${dadosRelatorio.resumo.lucroReal.toFixed(2)}</p>
                  <p class="card-subtitle">${dadosRelatorio.resumo.margemLucro}% margem</p>
                </div>
                <div class="card">
                  <p class="card-title">Valor do Estoque</p>
                  <p class="card-value">R$ ${dadosRelatorio.estatisticas.valorEstoque.toFixed(2)}</p>
                  <p class="card-subtitle">Investimento atual</p>
                </div>
              </div>
            </div>

            <!-- 🆕 SEÇÃO DE VALIDADE -->
            <div class="section">
              <h2 class="section-title">📅 Controle de Validade</h2>
              <div class="grid">
                <div class="card">
                  <p class="card-title">Produtos com Validade</p>
                  <p class="card-value">${dadosRelatorio.validade.totalComValidade}</p>
                  <p class="card-subtitle">Monitorados</p>
                </div>
                <div class="card">
                  <p class="card-title">Produtos Vencidos</p>
                  <p class="card-value critical">${dadosRelatorio.validade.vencidos}</p>
                  <p class="card-subtitle">Ação necessária</p>
                </div>
                <div class="card">
                  <p class="card-title">Vencendo Hoje</p>
                  <p class="card-value warning">${dadosRelatorio.validade.vencendoHoje}</p>
                  <p class="card-subtitle">Urgente</p>
                </div>
                <div class="card">
                  <p class="card-title">Valor Perdido</p>
                  <p class="card-value negative">R$ ${dadosRelatorio.validade.valorPerdido.toFixed(2)}</p>
                  <p class="card-subtitle">Produtos vencidos</p>
                </div>
              </div>
            </div>

            <!-- Lista de Produtos Vencidos -->
            ${dadosRelatorio.validade.produtosVencidos.length > 0 ? `
            <div class="section">
              <h2 class="section-title">🚨 Produtos Vencidos - Ação Necessária</h2>
              <table class="table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Código</th>
                    <th>Categoria</th>
                    <th>Estoque</th>
                    <th>Data Validade</th>
                    <th>Valor Perdido</th>
                  </tr>
                </thead>
                <tbody>
                  ${dadosRelatorio.validade.produtosVencidos.map((produto: any) => `
                    <tr>
                      <td>${produto.nome}</td>
                      <td>#${produto.codigo}</td>
                      <td>${produto.categoria}</td>
                      <td>${produto.estoque} un.</td>
                      <td class="critical">${produto.dataValidade}</td>
                      <td class="negative">R$ ${produto.valorPerdido.toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            ` : ''}

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
                      <td>R$ ${produto.valor.toFixed(2)}</td>
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
                          <td>R$ ${(valor as number).toFixed(2)}</td>
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
              <p>© ${new Date().getFullYear()} - Sistema Inteligente de Gestão de Estoque</p>
              <p>Inclui controle avançado de validade e análises preditivas</p>
            </div>
          </body>
          </html>
        `

        // Download HTML (que pode ser impresso como PDF)
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `relatorio-completo-stockpro-${new Date().toISOString().split('T')[0]}.html`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        toast.success(
          'PDF exportado!', 
          'Arquivo HTML baixado - abra no navegador e imprima como PDF'
        )
      } else {
        // Gerar CSV para Excel com dados de validade
        let csvContent = '\uFEFF' // BOM para UTF-8
        
        csvContent += `StockPro - Relatório Completo\n`
        csvContent += `Data de Geração,${dadosRelatorio.dataGeracao}\n`
        csvContent += `Período,${dadosRelatorio.periodo}\n\n`
        
        csvContent += `RESUMO FINANCEIRO\n`
        csvContent += `Métrica,Valor\n`
        csvContent += `Total de Vendas,R$ ${dadosRelatorio.resumo.totalVendas.toFixed(2)}\n`
        csvContent += `Total de Compras,R$ ${dadosRelatorio.resumo.totalCompras.toFixed(2)}\n`
        csvContent += `Lucro Líquido,R$ ${dadosRelatorio.resumo.lucroReal.toFixed(2)}\n`
        csvContent += `Margem de Lucro,${dadosRelatorio.resumo.margemLucro}%\n`
        csvContent += `Quantidade Vendida,${dadosRelatorio.resumo.quantidadeVendida} unidades\n`
        csvContent += `Número de Vendas,${dadosRelatorio.resumo.numeroVendas} transações\n`
        csvContent += `Valor do Estoque,R$ ${dadosRelatorio.estatisticas.valorEstoque.toFixed(2)}\n\n`
        
        // 🆕 DADOS DE VALIDADE NO CSV
        csvContent += `CONTROLE DE VALIDADE\n`
        csvContent += `Métrica,Valor\n`
        csvContent += `Produtos com Validade,${dadosRelatorio.validade.totalComValidade}\n`
        csvContent += `Produtos Vencidos,${dadosRelatorio.validade.vencidos}\n`
        csvContent += `Vencendo Hoje,${dadosRelatorio.validade.vencendoHoje}\n`
        csvContent += `Vencendo em 7 Dias,${dadosRelatorio.validade.vencendoEm7Dias}\n`
        csvContent += `Próximo do Vencimento,${dadosRelatorio.validade.proximoVencimento}\n`
        csvContent += `Valor Perdido,R$ ${dadosRelatorio.validade.valorPerdido.toFixed(2)}\n\n`
        
        if (dadosRelatorio.validade.produtosVencidos.length > 0) {
          csvContent += `PRODUTOS VENCIDOS - AÇÃO NECESSÁRIA\n`
          csvContent += `Produto,Código,Categoria,Estoque,Data Validade,Valor Perdido\n`
          dadosRelatorio.validade.produtosVencidos.forEach((produto: any) => {
            csvContent += `${produto.nome},${produto.codigo},${produto.categoria},${produto.estoque},${produto.dataValidade},R$ ${produto.valorPerdido.toFixed(2)}\n`
          })
          csvContent += `\n`
        }
        
        csvContent += `ESTATÍSTICAS GERAIS\n`
        csvContent += `Métrica,Valor\n`
        csvContent += `Produtos Cadastrados,${dadosRelatorio.estatisticas.produtosCadastrados}\n`
        csvContent += `Produtos Ativos,${dadosRelatorio.estatisticas.produtosAtivos}\n`
        csvContent += `Total de Movimentações,${dadosRelatorio.estatisticas.totalMovimentacoes}\n\n`
        
        if (dadosRelatorio.topProdutos.length > 0) {
          csvContent += `TOP 5 PRODUTOS MAIS VENDIDOS\n`
          csvContent += `Posição,Produto,Código,Quantidade,Valor Total\n`
          dadosRelatorio.topProdutos.forEach((produto: any, index: number) => {
            csvContent += `${index + 1},${produto.nome},${produto.codigo},${produto.quantidade},R$ ${produto.valor.toFixed(2)}\n`
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
              csvContent += `${categoria},R$ ${(valor as number).toFixed(2)},${participacao}%\n`
            })
          csvContent += `\n`
        }
        
        csvContent += `INFORMAÇÕES DO SISTEMA\n`
        csvContent += `Sistema,StockPro\n`
        csvContent += `Versão,2.0 - Com Controle de Validade\n`
        csvContent += `Gerado em,${new Date().toLocaleString('pt-BR')}\n`
        
        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `relatorio-completo-stockpro-${new Date().toISOString().split('T')[0]}.csv`
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

          {/* 🆕 ALERTAS CRÍTICOS DE VALIDADE */}
          {!isLoadingData && (estatisticasValidade.vencidos.length > 0 || estatisticasValidade.vencendoHoje.length > 0) && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-2xl">🚨</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Alertas Críticos de Validade!
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc list-inside space-y-1">
                      {estatisticasValidade.vencidos.length > 0 && (
                        <li><strong>{estatisticasValidade.vencidos.length} produto(s) VENCIDO(S)</strong> - Valor perdido: R$ {estatisticasValidade.valorPerdido.toFixed(2)}</li>
                      )}
                      {estatisticasValidade.vencendoHoje.length > 0 && (
                        <li><strong>{estatisticasValidade.vencendoHoje.length} produto(s) vencendo HOJE</strong></li>
                      )}
                    </ul>
                    <button
                      onClick={() => setAbaAtiva('validade')}
                      className="mt-2 text-red-800 underline hover:text-red-900 font-medium"
                    >
                      Ver relatório de validade detalhado →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 🆕 NAVEGAÇÃO POR ABAS */}
          {!isLoadingData && (
            <div className="mb-6 bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex">
                  <button
                    onClick={() => setAbaAtiva('vendas')}
                    className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                      abaAtiva === 'vendas'
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    💰 Vendas e Financeiro
                  </button>
                  <button
                    onClick={() => setAbaAtiva('validade')}
                    className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors relative ${
                      abaAtiva === 'validade'
                        ? 'border-orange-500 text-orange-600 bg-orange-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    📅 Controle de Validade
                    {(estatisticasValidade.vencidos.length + estatisticasValidade.vencendoHoje.length) > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {estatisticasValidade.vencidos.length + estatisticasValidade.vencendoHoje.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setAbaAtiva('estoque')}
                    className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                      abaAtiva === 'estoque'
                        ? 'border-green-500 text-green-600 bg-green-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    📦 Análise de Estoque
                  </button>
                </nav>
              </div>
            </div>
          )}

          {/* Filtro de Período */}
          {!isLoadingData && abaAtiva === 'vendas' && (
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
                  
                  {/* Botões de exportação */}
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
                      �� Exportar PDF
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

          {/* 🆕 CONTEÚDO DA ABA DE VENDAS */}
          {!isLoadingData && abaAtiva === 'vendas' && produtos && movimentacoes && (
            <>
              {/* Cards de Resumo Financeiro */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
                
                {/* Total de Vendas */}
                <div className="bg-gradient-to-r from-green-400 to-green-600 p-4 sm:p-6 rounded-lg shadow-lg text-white transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-green-100 text-xs sm:text-sm">Total de Vendas</p>
                      <p className="text-lg sm:text-2xl font-bold">R$ {estatisticas.totalVendas.toFixed(2)}</p>
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
                      <p className="text-lg sm:text-2xl font-bold">R$ {estatisticas.totalCompras.toFixed(2)}</p>
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
                      <p className="text-lg sm:text-2xl font-bold">R$ {(() => {
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
                        <p className="text-lg sm:text-2xl font-bold">R$ {estatisticas.lucroReal.toFixed(2)}</p>
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

              {/* Gráfico de Vendas por Dia */}
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
                        title={`${dado.dia}: R$ ${dado.vendas.toFixed(2)}`}
                      ></div>
                      <div className="text-xs text-gray-600 mt-2 text-center">
                        <div className="text-xs sm:text-sm">{dado.dia}</div>
                        <div className="font-bold text-purple-600 text-xs">R$ {dado.vendas.toFixed(0)}</div>
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

              {/* Análises de Vendas */}
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
                            <p className="text-xs sm:text-sm text-green-600">R$ {produto.valor.toFixed(2)}</p>
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
                      �� Nenhuma venda por categoria registrada
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
                                <span className="text-gray-900 font-bold ml-2">R$ {valor.toFixed(2)}</span>
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
            </>
          )}

          {/* 🆕 CONTEÚDO DA ABA DE VALIDADE */}
          {!isLoadingData && abaAtiva === 'validade' && produtos && (
            <>
              {/* Cards de Estatísticas de Validade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">
                
                {/* Produtos com Validade */}
                <div className="bg-gradient-to-r from-blue-400 to-blue-600 p-4 sm:p-6 rounded-lg shadow-lg text-white transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-blue-100 text-xs sm:text-sm">Com Validade</p>
                      <p className="text-lg sm:text-2xl font-bold">{estatisticasValidade.totalComValidade}</p>
                      <p className="text-blue-100 text-xs">Monitorados</p>
                    </div>
                    <div className="text-2xl sm:text-3xl ml-2">📅</div>
                  </div>
                </div>

                {/* Produtos Vencidos */}
                <div className="bg-gradient-to-r from-red-400 to-red-600 p-4 sm:p-6 rounded-lg shadow-lg text-white transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-red-100 text-xs sm:text-sm">Vencidos</p>
                      <p className="text-lg sm:text-2xl font-bold">{estatisticasValidade.vencidos.length}</p>
                      <p className="text-red-100 text-xs">Ação necessária</p>
                    </div>
                    <div className="text-2xl sm:text-3xl ml-2">🚨</div>
                  </div>
                </div>

                {/* Vencendo Hoje */}
                <div className="bg-gradient-to-r from-orange-400 to-orange-600 p-4 sm:p-6 rounded-lg shadow-lg text-white transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-orange-100 text-xs sm:text-sm">Vencendo Hoje</p>
                      <p className="text-lg sm:text-2xl font-bold">{estatisticasValidade.vencendoHoje.length}</p>
                      <p className="text-orange-100 text-xs">Urgente</p>
                    </div>
                    <div className="text-2xl sm:text-3xl ml-2">⏰</div>
                  </div>
                </div>

                {/* Vencendo em 7 Dias */}
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 p-4 sm:p-6 rounded-lg shadow-lg text-white transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-yellow-100 text-xs sm:text-sm">Vencendo em 7 Dias</p>
                      <p className="text-lg sm:text-2xl font-bold">{estatisticasValidade.vencendoEm7Dias.length}</p>
                      <p className="text-yellow-100 text-xs">Atenção</p>
                    </div>
                    <div className="text-2xl sm:text-3xl ml-2">📆</div>
                  </div>
                </div>

                {/* Valor Perdido */}
                <div className="bg-gradient-to-r from-purple-400 to-purple-600 p-4 sm:p-6 rounded-lg shadow-lg text-white transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-purple-100 text-xs sm:text-sm">Valor Perdido</p>
                      <p className="text-lg sm:text-2xl font-bold">R$ {estatisticasValidade.valorPerdido.toFixed(2)}</p>
                      <p className="text-purple-100 text-xs">Produtos vencidos</p>
                    </div>
                    <div className="text-2xl sm:text-3xl ml-2">💸</div>
                  </div>
                </div>
              </div>

              {/* Listas Detalhadas de Validade */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                
                {/* Produtos Vencidos */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
                  <h3 className="text-base sm:text-lg font-bold text-red-800 mb-4">🚨 Produtos Vencidos</h3>
                  {estatisticasValidade.vencidos.length === 0 ? (
                    <div className="text-center text-gray-500 py-6 sm:py-8">
                      ✅ Nenhum produto vencido
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {estatisticasValidade.vencidos.map((produto) => {
                        const validadeInfo = verificarValidade(produto)
                        const valorPerdido = produto.estoque * produto.valorCompra
                        
                        return (
                          <div key={produto.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm">{produto.nome}</p>
                                <p className="text-xs text-gray-500">#{produto.codigo} • {produto.categoria}</p>
                                <p className="text-xs text-red-600 mt-1">
                                  Venceu em: {produto.dataValidade ? new Date(produto.dataValidade).toLocaleDateString('pt-BR') : 'N/A'}
                                  {validadeInfo.diasRestantes && (
                                    <span> ({Math.abs(validadeInfo.diasRestantes)} dias atrás)</span>
                                  )}
                                </p>
                              </div>
                              <div className="text-right ml-3">
                                <p className="text-sm font-bold text-gray-900">{produto.estoque} un.</p>
                                <p className="text-xs text-red-600">R$ {valorPerdido.toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Produtos Vencendo Hoje/Próximos */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
                  <h3 className="text-base sm:text-lg font-bold text-orange-800 mb-4">⏰ Vencendo Hoje e Próximos</h3>
                  {(estatisticasValidade.vencendoHoje.length + estatisticasValidade.vencendoEm7Dias.length) === 0 ? (
                    <div className="text-center text-gray-500 py-6 sm:py-8">
                      ✅ Nenhum produto vencendo em breve
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {/* Vencendo hoje */}
                      {estatisticasValidade.vencendoHoje.map((produto) => (
                        <div key={produto.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">{produto.nome}</p>
                              <p className="text-xs text-gray-500">#{produto.codigo} • {produto.categoria}</p>
                              <p className="text-xs text-orange-600 mt-1 font-bold">
                                ⚠️ VENCE HOJE!
                              </p>
                            </div>
                            <div className="text-right ml-3">
                              <p className="text-sm font-bold text-gray-900">{produto.estoque} un.</p>
                              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                                Urgente
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {/* Vencendo em 7 dias */}
                      {estatisticasValidade.vencendoEm7Dias.map((produto) => {
                        const validadeInfo = verificarValidade(produto)
                        
                        return (
                          <div key={produto.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm">{produto.nome}</p>
                                <p className="text-xs text-gray-500">#{produto.codigo} • {produto.categoria}</p>
                                <p className="text-xs text-yellow-600 mt-1">
                                  Vence em {validadeInfo.diasRestantes} dia{validadeInfo.diasRestantes !== 1 ? 's' : ''}
                                </p>
                              </div>
                              <div className="text-right ml-3">
                                <p className="text-sm font-bold text-gray-900">{produto.estoque} un.</p>
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                                  {validadeInfo.diasRestantes}d
                                </span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Análise por Categoria de Validade */}
              {estatisticasValidade.totalComValidade > 0 && (
                <div className="mt-6 bg-white p-4 sm:p-6 rounded-lg shadow-lg">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">📊 Análise de Validade por Categoria</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(() => {
                      const categorias: { [key: string]: { total: number, vencidos: number, proximos: number } } = {}
                      
                      produtos.filter(p => p.ativo && p.temValidade).forEach(produto => {
                        if (!categorias[produto.categoria]) {
                          categorias[produto.categoria] = { total: 0, vencidos: 0, proximos: 0 }
                        }
                        
                        categorias[produto.categoria].total++
                        
                        const validadeInfo = verificarValidade(produto)
                        if (validadeInfo.status === 'vencido') {
                          categorias[produto.categoria].vencidos++
                        } else if (['vence_hoje', 'vence_em_7_dias'].includes(validadeInfo.status)) {
                          categorias[produto.categoria].proximos++
                        }
                      })
                      
                      return Object.entries(categorias).map(([categoria, dados]) => (
                        <div key={categoria} className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2">{categoria}</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Total com validade:</span>
                              <span className="font-bold">{dados.total}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Vencidos:</span>
                              <span className={`font-bold ${dados.vencidos > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                {dados.vencidos}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Próximos:</span>
                              <span className={`font-bold ${dados.proximos > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                {dados.proximos}
                              </span>
                            </div>
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  dados.vencidos > 0 ? 'bg-red-500' : dados.proximos > 0 ? 'bg-orange-500' : 'bg-green-500'
                                }`}
                                style={{ 
                                  width: `${((dados.total - dados.vencidos - dados.proximos) / dados.total) * 100}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))
                    })()}
                  </div>
                </div>
              )}
            </>
          )}

          {/* 🆕 CONTEÚDO DA ABA DE ESTOQUE */}
          {!isLoadingData && abaAtiva === 'estoque' && produtos && (
            <>
              {/* Cards de Estatísticas de Estoque */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                
                {/* Produtos Ativos */}
                <div className="bg-gradient-to-r from-green-400 to-green-600 p-4 sm:p-6 rounded-lg shadow-lg text-white transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-green-100 text-xs sm:text-sm">Produtos Ativos</p>
                      <p className="text-lg sm:text-2xl font-bold">{produtos.filter(p => p.ativo).length}</p>
                      <p className="text-green-100 text-xs">De {produtos.length} total</p>
                    </div>
                    <div className="text-2xl sm:text-3xl ml-2">✅</div>
                  </div>
                </div>

                {/* Sem Estoque */}
                <div className="bg-gradient-to-r from-red-400 to-red-600 p-4 sm:p-6 rounded-lg shadow-lg text-white transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-red-100 text-xs sm:text-sm">Sem Estoque</p>
                      <p className="text-lg sm:text-2xl font-bold">{produtos.filter(p => p.ativo && p.estoque === 0).length}</p>
                      <p className="text-red-100 text-xs">Reposição urgente</p>
                    </div>
                    <div className="text-2xl sm:text-3xl ml-2">🚫</div>
                  </div>
                </div>

                {/* Estoque Baixo */}
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 p-4 sm:p-6 rounded-lg shadow-lg text-white transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-yellow-100 text-xs sm:text-sm">Estoque Baixo</p>
                      <p className="text-lg sm:text-2xl font-bold">{produtos.filter(p => p.ativo && p.estoque > 0 && p.estoque <= p.estoqueMinimo).length}</p>
                      <p className="text-yellow-100 text-xs">Abaixo do mínimo</p>
                    </div>
                    <div className="text-2xl sm:text-3xl ml-2">⚠️</div>
                  </div>
                </div>

                {/* Valor Total do Estoque */}
                <div className="bg-gradient-to-r from-blue-400 to-blue-600 p-4 sm:p-6 rounded-lg shadow-lg text-white transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-blue-100 text-xs sm:text-sm">Valor Total</p>
                      <p className="text-lg sm:text-2xl font-bold">R$ {produtos.filter(p => p.ativo).reduce((total, produto) => {
                        return total + (produto.estoque * produto.valorCompra)
                      }, 0).toFixed(2)}</p>
                      <p className="text-blue-100 text-xs">Investimento</p>
                    </div>
                    <div className="text-2xl sm:text-3xl ml-2">💰</div>
                  </div>
                </div>
              </div>

              {/* Análise Detalhada de Estoque */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                
                {/* Produtos com Estoque Crítico */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">🚨 Estoque Crítico</h3>
                  {(() => {
                    const produtosCriticos = produtos.filter(p => p.ativo && (p.estoque === 0 || p.estoque <= p.estoqueMinimo))
                    
                    return produtosCriticos.length === 0 ? (
                      <div className="text-center text-gray-500 py-6 sm:py-8">
                        ✅ Todos os produtos com estoque adequado
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {produtosCriticos.slice(0, 10).map((produto) => (
                          <div key={produto.id} className={`p-3 rounded-lg border ${
                            produto.estoque === 0 
                              ? 'bg-red-50 border-red-200' 
                              : 'bg-yellow-50 border-yellow-200'
                          }`}>
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <p className="font-medium text-gray-900 text-sm">{produto.nome}</p>
                                <p className="text-xs text-gray-500">#{produto.codigo} • {produto.categoria}</p>
                                <p className={`text-xs mt-1 ${
                                  produto.estoque === 0 ? 'text-red-600' : 'text-yellow-600'
                                }`}>
                                  {produto.estoque === 0 
                                    ? 'SEM ESTOQUE' 
                                    : `Estoque: ${produto.estoque} (mín: ${produto.estoqueMinimo})`
                                  }
                                </p>
                              </div>
                              <div className="text-right ml-3">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  produto.estoque === 0 
                                    ? 'bg-red-100 text-red-800' 
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {produto.estoque === 0 ? 'Crítico' : 'Baixo'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                        {produtosCriticos.length > 10 && (
                          <p className="text-gray-500 text-sm text-center">
                            +{produtosCriticos.length - 10} produtos também precisam de atenção
                          </p>
                        )}
                      </div>
                    )
                  })()}
                </div>

                {/* Estoque por Categoria */}
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">📊 Estoque por Categoria</h3>
                  {(() => {
                    const categorias: { [key: string]: { produtos: number, valorTotal: number, semEstoque: number } } = {}
                    
                    produtos.filter(p => p.ativo).forEach(produto => {
                      if (!categorias[produto.categoria]) {
                        categorias[produto.categoria] = { produtos: 0, valorTotal: 0, semEstoque: 0 }
                      }
                      
                      categorias[produto.categoria].produtos++
                      categorias[produto.categoria].valorTotal += produto.estoque * produto.valorCompra
                      
                      if (produto.estoque === 0) {
                        categorias[produto.categoria].semEstoque++
                      }
                    })
                    
                    const categoriasOrdenadas = Object.entries(categorias)
                      .sort(([,a], [,b]) => b.valorTotal - a.valorTotal)
                    
                    return categoriasOrdenadas.length === 0 ? (
                      <div className="text-center text-gray-500 py-6 sm:py-8">
                        📦 Nenhuma categoria encontrada
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {categoriasOrdenadas.map(([categoria, dados]) => (
                          <div key={categoria} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900">{categoria}</h4>
                              <span className="text-sm font-bold text-gray-900">
                                R$ {dados.valorTotal.toFixed(2)}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-600">Produtos:</span>
                                <span className="ml-1 font-medium">{dados.produtos}</span>
                              </div>
                              <div>
                                <span className="text-gray-600">Sem estoque:</span>
                                <span className={`ml-1 font-medium ${
                                  dados.semEstoque > 0 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {dados.semEstoque}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  dados.semEstoque > 0 ? 'bg-red-500' : 'bg-green-500'
                                }`}
                                style={{ 
                                  width: `${((dados.produtos - dados.semEstoque) / dados.produtos) * 100}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              </div>
            </>
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
                    Sistema Inteligente de Relatórios
                  </h3>
                  <div className="mt-2 text-xs sm:text-sm text-blue-700 space-y-1">
                    <p>• <strong>Análise de vendas:</strong> Performance financeira e produtos mais vendidos</p>
                    <p>• <strong>Controle de validade:</strong> Monitoramento automático de vencimentos</p>
                    <p>• <strong>Gestão de estoque:</strong> Alertas de reposição e análise por categoria</p>
                    <p>• <strong>Exportação completa:</strong> Relatórios em PDF e Excel com todos os dados</p>
                    <p>• <strong>Dados em tempo real:</strong> Sincronização automática com Firebase</p>
                    <p>• <strong>Análises preditivas:</strong> Identificação de tendências e padrões</p>
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