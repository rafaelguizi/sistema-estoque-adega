import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'

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

interface EstatisticasRelatorio {
  totalVendas: number
  totalCompras: number
  lucroReal: number
  quantidadeVendida: number
  numeroVendas: number
  periodoTexto: string
  rankingProdutos: Array<{
    codigo: string
    nome: string
    quantidade: number
    valor: number
  }>
  vendasPorCategoria: { [key: string]: number }
}

export const exportarRelatorioPDF = (
  estatisticas: EstatisticasRelatorio,
  produtos: Produto[],
  movimentacoes: Movimentacao[]
) => {
  const doc = new jsPDF()
  
  // Configurar fonte
  doc.setFont('helvetica')
  
  // Cabeçalho com fundo colorido
  doc.setFillColor(128, 0, 128) // Roxo
  doc.rect(15, 15, 180, 25, 'F')
  
  doc.setFontSize(20)
  doc.setTextColor(255, 255, 255) // Branco
  doc.text('STOCKPRO - RELATORIO DE ANALISE', 20, 30)
  
  doc.setFontSize(12)
  doc.setTextColor(255, 255, 255)
  doc.text(`Periodo: ${estatisticas.periodoTexto}`, 20, 37)
  
  // Reset cor do texto
  doc.setTextColor(0, 0, 0)
  
  let yPosition = 55
  
  // Data de geração
  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, yPosition)
  yPosition += 15
  
  // Resumo Financeiro
  doc.setFillColor(240, 240, 240)
  doc.rect(15, yPosition - 5, 180, 8, 'F')
  
  doc.setFontSize(16)
  doc.setTextColor(0, 0, 0)
  doc.text('RESUMO FINANCEIRO', 20, yPosition)
  yPosition += 15
  
  doc.setFontSize(11)
  doc.text(`Total de Vendas: R\$ ${estatisticas.totalVendas.toFixed(2)}`, 25, yPosition)
  yPosition += 8
  doc.text(`Total de Compras: R\$ ${estatisticas.totalCompras.toFixed(2)}`, 25, yPosition)
  yPosition += 8
  doc.text(`Lucro Liquido: R\$ ${estatisticas.lucroReal.toFixed(2)}`, 25, yPosition)
  yPosition += 8
  
  // Calcular margem de lucro
  const margemLucro = estatisticas.totalVendas > 0 ? 
    ((estatisticas.lucroReal / estatisticas.totalVendas) * 100).toFixed(1) : '0.0'
  doc.text(`Margem de Lucro: ${margemLucro}%`, 25, yPosition)
  yPosition += 8
  
  doc.text(`Numero de Vendas: ${estatisticas.numeroVendas}`, 25, yPosition)
  yPosition += 8
  doc.text(`Quantidade Vendida: ${estatisticas.quantidadeVendida} unidades`, 25, yPosition)
  yPosition += 20
  
  // Valor do Estoque
  const valorEstoque = produtos.filter(p => p.ativo).reduce((total, p) => total + (p.estoque * p.valorCompra), 0)
  doc.text(`Valor Total do Estoque: R\$ ${valorEstoque.toFixed(2)}`, 25, yPosition)
  yPosition += 8
  doc.text(`Produtos Ativos: ${produtos.filter(p => p.ativo).length}`, 25, yPosition)
  yPosition += 20
  
  // Top 5 Produtos
  if (estatisticas.rankingProdutos.length > 0) {
    doc.setFillColor(240, 240, 240)
    doc.rect(15, yPosition - 5, 180, 8, 'F')
    
    doc.setFontSize(16)
    doc.text('TOP 5 PRODUTOS MAIS VENDIDOS', 20, yPosition)
    yPosition += 15
    
    doc.setFontSize(10)
    estatisticas.rankingProdutos.forEach((produto, index) => {
      const posicao = index === 0 ? '1º LUGAR' : 
                    index === 1 ? '2º LUGAR' : 
                    index === 2 ? '3º LUGAR' : `${index + 1}º LUGAR`
      
      doc.setFont('helvetica', 'bold')
      doc.text(`${posicao}: ${produto.nome}`, 25, yPosition)
      yPosition += 6
      
      doc.setFont('helvetica', 'normal')
      doc.text(`Codigo: ${produto.codigo} | Qtd Vendida: ${produto.quantidade} unidades`, 30, yPosition)
      yPosition += 6
      doc.text(`Valor Total: R\$ ${produto.valor.toFixed(2)}`, 30, yPosition)
      yPosition += 10
    })
    yPosition += 10
  }
  
  // Vendas por Categoria
  if (Object.keys(estatisticas.vendasPorCategoria).length > 0) {
    // Verificar se precisa de nova página
    if (yPosition > 220) {
      doc.addPage()
      yPosition = 30
    }
    
    doc.setFillColor(240, 240, 240)
    doc.rect(15, yPosition - 5, 180, 8, 'F')
    
    doc.setFontSize(16)
    doc.text('VENDAS POR CATEGORIA', 20, yPosition)
    yPosition += 15
    
    doc.setFontSize(10)
    Object.entries(estatisticas.vendasPorCategoria)
      .sort(([,a], [,b]) => b - a)
      .forEach(([categoria, valor]) => {
        const percentual = ((valor / estatisticas.totalVendas) * 100).toFixed(1)
        
        doc.setFont('helvetica', 'bold')
        doc.text(`${categoria}:`, 25, yPosition)
        
        doc.setFont('helvetica', 'normal')
        doc.text(`R\$ ${valor.toFixed(2)} (${percentual}% do total)`, 80, yPosition)
        yPosition += 8
      })
    yPosition += 15
  }
  
  // Situação do Estoque
  if (yPosition > 200) {
    doc.addPage()
    yPosition = 30
  }
  
  doc.setFillColor(240, 240, 240)
  doc.rect(15, yPosition - 5, 180, 8, 'F')
  
  doc.setFontSize(16)
  doc.text('SITUACAO DO ESTOQUE', 20, yPosition)
  yPosition += 15
  
  const produtosAtivos = produtos.filter(p => p.ativo)
  doc.setFontSize(9)
  
  // Contadores de status
  let estoqueNormal = 0
  let estoqueBaixo = 0
  let estoqueZerado = 0
  
  produtosAtivos.forEach(produto => {
    if (produto.estoque === 0) {
      estoqueZerado++
    } else if (produto.estoque <= produto.estoqueMinimo) {
      estoqueBaixo++
    } else {
      estoqueNormal++
    }
  })
  
  // Resumo do estoque
  doc.setFont('helvetica', 'bold')
  doc.text('RESUMO DO ESTOQUE:', 25, yPosition)
  yPosition += 8
  
  doc.setFont('helvetica', 'normal')
  doc.text(`Produtos com estoque normal: ${estoqueNormal}`, 30, yPosition)
  yPosition += 6
  doc.text(`Produtos com estoque baixo: ${estoqueBaixo}`, 30, yPosition)
  yPosition += 6
  doc.text(`Produtos com estoque zerado: ${estoqueZerado}`, 30, yPosition)
  yPosition += 15
  
  // Listar produtos com estoque crítico
  const produtosCriticos = produtosAtivos.filter(p => p.estoque <= p.estoqueMinimo)
  
  if (produtosCriticos.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.text('PRODUTOS COM ESTOQUE CRITICO:', 25, yPosition)
    yPosition += 8
    
    doc.setFont('helvetica', 'normal')
    produtosCriticos.slice(0, 15).forEach(produto => { // Limitar para não quebrar página
      const status = produto.estoque === 0 ? 'ZERADO' : 'BAIXO'
      doc.text(`${produto.nome} (${produto.codigo}): ${produto.estoque} un. - ${status}`, 30, yPosition)
      yPosition += 6
    })
    
    if (produtosCriticos.length > 15) {
      yPosition += 5
      doc.text(`... e mais ${produtosCriticos.length - 15} produtos com estoque critico`, 30, yPosition)
    }
  }
  
  // Rodapé em todas as páginas
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    
    // Linha no rodapé
    doc.setDrawColor(128, 0, 128)
    doc.line(15, 280, 195, 280)
    
    doc.setFontSize(8)
    doc.setTextColor(100, 100, 100)
    doc.text(
      'StockPro - Sistema de Gestao de Estoque',
      20,
      285
    )
    doc.text(
      `Pagina ${i} de ${pageCount}`,
      170,
      285
    )
  }
  
  // Salvar arquivo
  const nomeArquivo = `StockPro_Relatorio_${new Date().toISOString().split('T')[0]}.pdf`
  doc.save(nomeArquivo)
}

export const exportarRelatorioExcel = (
  estatisticas: EstatisticasRelatorio,
  produtos: Produto[],
  movimentacoes: Movimentacao[]
) => {
  // Criar workbook
  const wb = XLSX.utils.book_new()
  
  // Aba 1: Resumo Financeiro
  const resumoData = [
    ['📊 RESUMO FINANCEIRO - STOCKPRO'],
    [''],
    ['Período:', estatisticas.periodoTexto],
    ['Gerado em:', new Date().toLocaleString('pt-BR')],
    [''],
    ['💰 VENDAS'],
    ['Total de Vendas:', `R\$ ${estatisticas.totalVendas.toFixed(2)}`],
    ['Número de Vendas:', estatisticas.numeroVendas],
    ['Quantidade Vendida:', `${estatisticas.quantidadeVendida} unidades`],
    [''],
    ['🛒 COMPRAS'],
    ['Total de Compras:', `R\$ ${estatisticas.totalCompras.toFixed(2)}`],
    [''],
    ['📈 LUCRO'],
    ['Lucro Líquido:', `R\$ ${estatisticas.lucroReal.toFixed(2)}`],
    ['Margem de Lucro:', `${estatisticas.totalVendas > 0 ? ((estatisticas.lucroReal / estatisticas.totalVendas) * 100).toFixed(2) : '0'}%`],
    [''],
    ['🏦 ESTOQUE'],
    ['Valor do Estoque:', `R\$ ${produtos.filter(p => p.ativo).reduce((total, p) => total + (p.estoque * p.valorCompra), 0).toFixed(2)}`],
    ['Produtos Ativos:', produtos.filter(p => p.ativo).length]
  ]
  
  const wsResumo = XLSX.utils.aoa_to_sheet(resumoData)
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo Financeiro')
  
  // Aba 2: Top Produtos
  if (estatisticas.rankingProdutos.length > 0) {
    const topProdutosData = [
      ['🏆 TOP 5 PRODUTOS MAIS VENDIDOS'],
      [''],
      ['Posição', 'Produto', 'Código', 'Quantidade Vendida', 'Valor Total'],
      ...estatisticas.rankingProdutos.map((produto, index) => [
        `${index + 1}º`,
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
      ['📋 VENDAS POR CATEGORIA'],
      [''],
      ['Categoria', 'Valor Total', 'Percentual'],
      ...Object.entries(estatisticas.vendasPorCategoria)
        .sort(([,a], [,b]) => b - a)
        .map(([categoria, valor]) => [
          categoria,
          valor,
          `${((valor / estatisticas.totalVendas) * 100).toFixed(2)}%`
        ])
    ]
    
    const wsCategorias = XLSX.utils.aoa_to_sheet(categoriasData)
    XLSX.utils.book_append_sheet(wb, wsCategorias, 'Vendas por Categoria')
  }
  
  // Aba 4: Estoque Atual
  const produtosAtivos = produtos.filter(p => p.ativo)
  const estoqueData = [
    ['📦 SITUAÇÃO DO ESTOQUE'],
    [''],
    ['Produto', 'Código', 'Categoria', 'Estoque Atual', 'Estoque Mínimo', 'Valor Compra', 'Valor Venda', 'Status'],
    ...produtosAtivos.map(produto => [
      produto.nome,
      produto.codigo,
      produto.categoria,
      produto.estoque,
      produto.estoqueMinimo,
      produto.valorCompra,
      produto.valorVenda,
      produto.estoque <= produto.estoqueMinimo ? 'Baixo' : 
      produto.estoque === 0 ? 'Zerado' : 'Normal'
    ])
  ]
  
  const wsEstoque = XLSX.utils.aoa_to_sheet(estoqueData)
  XLSX.utils.book_append_sheet(wb, wsEstoque, 'Estoque Atual')
  
  // Aba 5: Movimentações
  if (movimentacoes.length > 0) {
    const movimentacoesData = [
      ['✏️ HISTÓRICO DE MOVIMENTAÇÕES'],
      [''],
      ['Data', 'Hora', 'Produto', 'Código', 'Tipo', 'Quantidade', 'Valor Unitário', 'Valor Total', 'Observação'],
      ...movimentacoes
        .sort((a, b) => {
          const dataA = new Date(`${a.data.split('/').reverse().join('-')} ${a.hora}`)
          const dataB = new Date(`${b.data.split('/').reverse().join('-')} ${b.hora}`)
          return dataB.getTime() - dataA.getTime()
        })
        .map(mov => [
          mov.data,
          mov.hora,
          mov.produto,
          mov.codigo,
          mov.tipo === 'entrada' ? 'Entrada' : 'Saída',
          mov.quantidade,
          mov.valorUnitario,
          mov.valorTotal,
          mov.observacao || ''
        ])
    ]
    
    const wsMovimentacoes = XLSX.utils.aoa_to_sheet(movimentacoesData)
    XLSX.utils.book_append_sheet(wb, wsMovimentacoes, 'Movimentações')
  }
  
  // Aba 6: Análise de Estoque
  const analiseEstoqueData = [
    ['📊 ANÁLISE DETALHADA DO ESTOQUE'],
    [''],
    ['RESUMO POR STATUS'],
    ['Status', 'Quantidade de Produtos', 'Percentual'],
    ['Normal', produtos.filter(p => p.ativo && p.estoque > p.estoqueMinimo).length, `${((produtos.filter(p => p.ativo && p.estoque > p.estoqueMinimo).length / produtos.filter(p => p.ativo).length) * 100).toFixed(1)}%`],
    ['Baixo', produtos.filter(p => p.ativo && p.estoque <= p.estoqueMinimo && p.estoque > 0).length, `${((produtos.filter(p => p.ativo && p.estoque <= p.estoqueMinimo && p.estoque > 0).length / produtos.filter(p => p.ativo).length) * 100).toFixed(1)}%`],
    ['Zerado', produtos.filter(p => p.ativo && p.estoque === 0).length, `${((produtos.filter(p => p.ativo && p.estoque === 0).length / produtos.filter(p => p.ativo).length) * 100).toFixed(1)}%`],
    [''],
    ['PRODUTOS CRÍTICOS (Estoque <= Mínimo)'],
    ['Produto', 'Código', 'Categoria', 'Estoque Atual', 'Estoque Mínimo', 'Status'],
    ...produtos.filter(p => p.ativo && p.estoque <= p.estoqueMinimo).map(produto => [
      produto.nome,
      produto.codigo,
      produto.categoria,
      produto.estoque,
      produto.estoqueMinimo,
      produto.estoque === 0 ? 'ZERADO' : 'BAIXO'
    ])
  ]
  
  const wsAnaliseEstoque = XLSX.utils.aoa_to_sheet(analiseEstoqueData)
  XLSX.utils.book_append_sheet(wb, wsAnaliseEstoque, 'Análise de Estoque')
  
  // Salvar arquivo
  const nomeArquivo = `StockPro_Relatorio_${new Date().toISOString().split('T')[0]}.xlsx`
  XLSX.writeFile(wb, nomeArquivo)
}