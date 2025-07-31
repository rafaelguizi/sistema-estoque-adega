import jsPDF from 'jspdf'
import 'jspdf-autotable'
import * as XLSX from 'xlsx'

// Declaração de tipos para jsPDF com autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: AutoTableOptions) => jsPDF
    lastAutoTable: {
      finalY: number
    }
  }
}

interface AutoTableOptions {
  startY?: number
  head?: string[][]
  body?: (string | number)[][]
  theme?: string
  headStyles?: {
    fillColor?: number[]
  }
  margin?: {
    left?: number
    right?: number
  }
}

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

export const exportarRelatorioPDF = (
  estatisticas: Estatisticas
) => {
  const doc = new jsPDF()
  
  // Configurações
  const pageWidth = doc.internal.pageSize.width
  const margin = 20
  
  // Cabeçalho
  doc.setFontSize(20)
  doc.setTextColor(40, 40, 40)
  doc.text('StockPro - Relatório de Vendas', margin, 30)
  
  doc.setFontSize(12)
  doc.setTextColor(100, 100, 100)
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, 40)
  doc.text(`Período: ${estatisticas.periodoTexto}`, margin, 50)
  
  // Linha separadora
  doc.setLineWidth(0.5)
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, 55, pageWidth - margin, 55)
  
  let currentY = 70
  
  // Resumo Executivo
  doc.setFontSize(16)
  doc.setTextColor(40, 40, 40)
  doc.text('📊 Resumo Executivo', margin, currentY)
  currentY += 15
  
  // Tabela de resumo
  const resumoData = [
    ['Total de Vendas', `R\$ ${estatisticas.totalVendas.toFixed(2)}`],
    ['Total de Compras', `R\$ ${estatisticas.totalCompras.toFixed(2)}`],
    ['Lucro Líquido', `R\$ ${estatisticas.lucroReal.toFixed(2)}`],
    ['Número de Vendas', estatisticas.numeroVendas.toString()],
    ['Itens Vendidos', estatisticas.quantidadeVendida.toString()]
  ]
  
  doc.autoTable({
    startY: currentY,
    head: [['Métrica', 'Valor']],
    body: resumoData,
    theme: 'grid',
    headStyles: { fillColor: [66, 139, 202] },
    margin: { left: margin, right: margin }
  })
  
  currentY = doc.lastAutoTable.finalY + 20
  
  // Top 5 Produtos
  if (estatisticas.rankingProdutos.length > 0) {
    doc.setFontSize(16)
    doc.text('🏆 Top 5 Produtos Mais Vendidos', margin, currentY)
    currentY += 15
    
    const produtosData = estatisticas.rankingProdutos.map((produto, index) => [
      (index + 1).toString(),
      produto.nome,
      produto.quantidade.toString(),
      `R\$ ${produto.valor.toFixed(2)}`
    ])
    
    doc.autoTable({
      startY: currentY,
      head: [['#', 'Produto', 'Qtd Vendida', 'Valor Total']],
      body: produtosData,
      theme: 'grid',
      headStyles: { fillColor: [40, 167, 69] },
      margin: { left: margin, right: margin }
    })
    
    currentY = doc.lastAutoTable.finalY + 20
  }
  
  // Vendas por Categoria
  if (Object.keys(estatisticas.vendasPorCategoria).length > 0) {
    // Verificar se precisa de nova página
    if (currentY > 220) {
      doc.addPage()
      currentY = 30
    }
    
    doc.setFontSize(16)
    doc.text('📋 Vendas por Categoria', margin, currentY)
    currentY += 15
    
    const categoriasData = Object.entries(estatisticas.vendasPorCategoria)
      .sort(([,a], [,b]) => b - a)
      .map(([categoria, valor]) => [
        categoria,
        `R\$ ${valor.toFixed(2)}`
      ])
    
    doc.autoTable({
      startY: currentY,
      head: [['Categoria', 'Valor Total']],
      body: categoriasData,
      theme: 'grid',
      headStyles: { fillColor: [108, 117, 125] },
      margin: { left: margin, right: margin }
    })
  }
  
  // Função para adicionar rodapé
  const addFooter = (pageNum: number) => {
    doc.setFontSize(10)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `StockPro - Sistema de Gestão de Estoque | Página ${pageNum}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    )
  }
  
  // Adicionar rodapé na primeira página
  addFooter(1)
  
  // Se houver mais páginas, adicionar rodapé nelas também
  const totalPages = (doc as unknown as { internal: { getNumberOfPages(): number } }).internal.getNumberOfPages()
  for (let i = 2; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(i)
  }
  
  // Download
  doc.save(`StockPro_Relatorio_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`)
}

export const exportarRelatorioExcel = (
  estatisticas: Estatisticas,
  produtos: Produto[],
  movimentacoes: Movimentacao[]
) => {
  // Criar workbook
  const wb = XLSX.utils.book_new()
  
  // Aba 1: Resumo
  const resumoData = [
    ['StockPro - Relatório de Vendas'],
    [`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`],
    [`Período: ${estatisticas.periodoTexto}`],
    [''],
    ['RESUMO EXECUTIVO'],
    ['Métrica', 'Valor'],
    ['Total de Vendas', `R\$ ${estatisticas.totalVendas.toFixed(2)}`],
    ['Total de Compras', `R\$ ${estatisticas.totalCompras.toFixed(2)}`],
    ['Lucro Líquido', `R\$ ${estatisticas.lucroReal.toFixed(2)}`],
    ['Número de Vendas', estatisticas.numeroVendas],
    ['Itens Vendidos', estatisticas.quantidadeVendida]
  ]
  
  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData)
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo')
  
  // Aba 2: Top Produtos
  if (estatisticas.rankingProdutos.length > 0) {
    const topProdutosData = [
      ['TOP 5 PRODUTOS MAIS VENDIDOS'],
      [''],
      ['Posição', 'Produto', 'Código', 'Qtd Vendida', 'Valor Total'],
      ...estatisticas.rankingProdutos.map((produto, index) => [
        index + 1,
        produto.nome,
        produto.codigo,
        produto.quantidade,
        produto.valor
      ])
    ]
    
    const wsTopProdutos = XLSX.utils.aoa_to_sheet(topProdutosData)
    XLSX.utils.book_append_sheet(wb, wsTopProdutos, 'Top Produtos')
  }
  
  // Aba 3: Vendas por Categoria
  if (Object.keys(estatisticas.vendasPorCategoria).length > 0) {
    const categoriasData = [
      ['VENDAS POR CATEGORIA'],
      [''],
      ['Categoria', 'Valor Total'],
      ...Object.entries(estatisticas.vendasPorCategoria)
        .sort(([,a], [,b]) => b - a)
        .map(([categoria, valor]) => [categoria, valor])
    ]
    
    const wsCategorias = XLSX.utils.aoa_to_sheet(categoriasData)
    XLSX.utils.book_append_sheet(wb, wsCategorias, 'Categorias')
  }
  
  // Aba 4: Produtos
  const produtosData = [
    ['LISTA DE PRODUTOS'],
    [''],
    ['Código', 'Nome', 'Categoria', 'Estoque', 'Estoque Mín', 'Valor Compra', 'Valor Venda', 'Status'],
    ...produtos.map(produto => [
      produto.codigo,
      produto.nome,
      produto.categoria,
      produto.estoque,
      produto.estoqueMinimo,
      produto.valorCompra,
      produto.valorVenda,
      produto.ativo ? 'Ativo' : 'Inativo'
    ])
  ]
  
  const wsProdutos = XLSX.utils.aoa_to_sheet(produtosData)
  XLSX.utils.book_append_sheet(wb, wsProdutos, 'Produtos')
  
  // Aba 5: Movimentações
  const movimentacoesData = [
    ['MOVIMENTAÇÕES'],
    [''],
    ['Data', 'Hora', 'Produto', 'Código', 'Tipo', 'Quantidade', 'Valor Unit', 'Valor Total', 'Observação'],
    ...movimentacoes.map(mov => [
      mov.data,
      mov.hora,
      mov.produto,
      mov.codigo,
      mov.tipo === 'entrada' ? 'Entrada' : 'Saída',
      mov.quantidade,
      mov.valorUnitario,
      mov.valorTotal,
      mov.observacao
    ])
  ]
  
  const wsMovimentacoes = XLSX.utils.aoa_to_sheet(movimentacoesData)
  XLSX.utils.book_append_sheet(wb, wsMovimentacoes, 'Movimentações')
  
  // Download
  XLSX.writeFile(wb, `StockPro_Relatorio_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.xlsx`)
}