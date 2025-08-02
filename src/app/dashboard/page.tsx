'use client'
import { useState, useEffect } from 'react'
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
  produtoId: string
  produto: string
  codigo: string
  tipo: 'entrada' | 'saida'
  quantidade: number
  valorUnitario: number
  valorTotal: number
  data: string
  hora: string
  observacao: string
  userId: string
}

export default function Dashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const toast = useToastContext()
  
  // Hooks do Firestore
  const { data: produtos, loading: loadingProdutos } = useFirestore<Produto>('produtos')
  const { data: movimentacoes, loading: loadingMovimentacoes } = useFirestore<Movimentacao>('movimentacoes')

  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simular um pequeno delay para melhor UX
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Aguardar dados do Firebase
  const isDataLoading = loading || loadingProdutos || loadingMovimentacoes

  // 🆕 FUNÇÃO PARA VERIFICAR PRODUTOS PRÓXIMOS DO VENCIMENTO
  const verificarProdutosVencimento = () => {
    if (!produtos) return { vencendoHoje: [], vencendoEm7Dias: [], vencendoEm30Dias: [], vencidos: [] }

    const hoje = new Date()
    const em7Dias = new Date(hoje.getTime() + 7 * 24 * 60 * 60 * 1000)
    const em30Dias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000)

    const produtosComValidade = produtos.filter(p => p.ativo && p.temValidade && p.dataValidade)

    const vencidos: Produto[] = []
    const vencendoHoje: Produto[] = []
    const vencendoEm7Dias: Produto[] = []
    const vencendoEm30Dias: Produto[] = []

    produtosComValidade.forEach(produto => {
      if (!produto.dataValidade) return

      const dataValidade = new Date(produto.dataValidade)
      const diasParaVencer = Math.ceil((dataValidade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))

      if (diasParaVencer < 0) {
        vencidos.push(produto)
      } else if (diasParaVencer === 0) {
        vencendoHoje.push(produto)
      } else if (diasParaVencer <= 7) {
        vencendoEm7Dias.push(produto)
      } else if (diasParaVencer <= (produto.diasAlerta || 30)) {
        vencendoEm30Dias.push(produto)
      }
    })

    return { vencendoHoje, vencendoEm7Dias, vencendoEm30Dias, vencidos }
  }

  // Calcular faturamento mensal (zera todo dia 1)
  const calcularFaturamentoMensal = () => {
    if (!movimentacoes) return { totalFaturamento: 0, quantidadeVendas: 0, mesAno: '' }

    const agora = new Date()
    const anoAtual = agora.getFullYear()
    const mesAtual = agora.getMonth() // 0-11

    // Filtrar vendas do mês atual
    const vendasMesAtual = movimentacoes.filter(mov => {
      if (mov.tipo !== 'saida') return false

      const [dia, mes, ano] = mov.data.split('/')
      const dataMovimentacao = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))

      return dataMovimentacao.getFullYear() === anoAtual &&
             dataMovimentacao.getMonth() === mesAtual
    })

    const totalFaturamento = vendasMesAtual.reduce((total, mov) => total + mov.valorTotal, 0)
    const quantidadeVendas = vendasMesAtual.length

    return {
      totalFaturamento,
      quantidadeVendas,
      mesAno: agora.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    }
  }

  // Calcular estatísticas
  const produtosAtivos = produtos ? produtos.filter(p => p.ativo) : []
  const produtosEstoqueBaixo = produtosAtivos.filter(p => p.estoque <= p.estoqueMinimo)
  const produtosEstoqueZerado = produtosAtivos.filter(p => p.estoque === 0)

  // 🆕 ALERTAS DE VALIDADE
  const alertasValidade = verificarProdutosVencimento()
  const totalProdutosComProblemaValidade = alertasValidade.vencidos.length + 
                                          alertasValidade.vencendoHoje.length + 
                                          alertasValidade.vencendoEm7Dias.length

  // Faturamento mensal
  const faturamentoMensal = calcularFaturamentoMensal()

  // Valor total do estoque
  const valorTotalEstoque = produtosAtivos.reduce((total, produto) => {
    return total + (produto.estoque * produto.valorCompra)
  }, 0)

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <MobileHeader title="Dashboard Principal" currentPage="/dashboard" />

        <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">

          {/* Loading State */}
          {isDataLoading && (
            <div className="bg-white rounded-lg shadow-lg p-8 sm:p-12 mb-6">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-purple-500 border-t-transparent mb-4 sm:mb-6"></div>
                <p className="text-gray-600 font-medium text-base sm:text-lg">Carregando dashboard...</p>
                <p className="text-gray-500 text-sm mt-2">Sincronizando dados do Firebase</p>
              </div>
            </div>
          )}

          {!isDataLoading && (
            <>
              {/* Boas-vindas */}
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-4 sm:p-6 mb-6 text-white">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0">
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
                      Bem-vindo ao StockPro! 🚀
                    </h1>
                    <p className="text-purple-100 mt-1 text-sm sm:text-base">
                      Gerencie seu estoque de forma inteligente e eficiente
                    </p>
                    {user && (
                      <p className="text-purple-200 text-xs sm:text-sm mt-1">
                        Logado como: {user.email}
                      </p>
                    )}
                  </div>
                  
                  {/* 🔧 BOTÕES CORRIGIDOS - AGORA VISÍVEIS */}
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                    <button
                      onClick={() => router.push('/produtos')}
                      className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white border border-white border-opacity-30 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
                    >
                      <span>➕</span>
                      <span>Novo Produto</span>
                    </button>
                    <button
                      onClick={() => router.push('/movimentacoes')}
                      className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white border border-white border-opacity-30 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-2"
                    >
                      <span>📦</span>
                      <span>Nova Movimentação</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Cards de Estatísticas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-6 sm:mb-8">

                {/* Total de Produtos */}
                <div className="bg-gradient-to-r from-blue-400 to-blue-600 p-4 sm:p-6 rounded-lg shadow-lg text-white transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-blue-100 text-xs sm:text-sm">Total de Produtos</p>
                      <p className="text-xl sm:text-2xl font-bold">{produtosAtivos.length}</p>
                      <p className="text-blue-100 text-xs">Produtos ativos</p>
                    </div>
                    <div className="text-2xl sm:text-3xl ml-2">📦</div>
                  </div>
                </div>

                {/* Estoque Baixo */}
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 sm:p-6 rounded-lg shadow-lg text-white transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-yellow-100 text-xs sm:text-sm">Estoque Baixo</p>
                      <p className="text-xl sm:text-2xl font-bold">{produtosEstoqueBaixo.length}</p>
                      <p className="text-yellow-100 text-xs">Precisam reposição</p>
                    </div>
                    <div className="text-2xl sm:text-3xl ml-2">⚠️</div>
                  </div>
                </div>

                {/* Estoque Zerado */}
                <div className="bg-gradient-to-r from-red-400 to-red-600 p-4 sm:p-6 rounded-lg shadow-lg text-white transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-red-100 text-xs sm:text-sm">Estoque Zerado</p>
                      <p className="text-xl sm:text-2xl font-bold">{produtosEstoqueZerado.length}</p>
                      <p className="text-red-100 text-xs">Sem estoque</p>
                    </div>
                    <div className="text-2xl sm:text-3xl ml-2">🚫</div>
                  </div>
                </div>

                {/* 🆕 ALERTAS DE VALIDADE */}
                <div className="bg-gradient-to-r from-purple-400 to-purple-600 p-4 sm:p-6 rounded-lg shadow-lg text-white transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-purple-100 text-xs sm:text-sm">Próximos ao Vencimento</p>
                      <p className="text-xl sm:text-2xl font-bold">{totalProdutosComProblemaValidade}</p>
                      <p className="text-purple-100 text-xs">Requer atenção</p>
                    </div>
                    <div className="text-2xl sm:text-3xl ml-2">📅</div>
                  </div>
                </div>

                {/* Faturamento Mensal */}
                <div className="bg-gradient-to-r from-green-400 to-green-600 p-4 sm:p-6 rounded-lg shadow-lg text-white transform hover:scale-105 transition-all duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-green-100 text-xs sm:text-sm">Faturamento ({faturamentoMensal.mesAno})</p>
                      <p className="text-lg sm:text-xl font-bold">R\$ {faturamentoMensal.totalFaturamento.toFixed(2)}</p>
                      <p className="text-green-100 text-xs">{faturamentoMensal.quantidadeVendas} vendas</p>
                    </div>
                    <div className="text-2xl sm:text-3xl ml-2">💰</div>
                  </div>
                </div>
              </div>

              {/* Informativo sobre Faturamento Mensal */}
              {faturamentoMensal.totalFaturamento > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl">📊</div>
                    <div>
                      <h3 className="text-sm font-medium text-green-800">
                        Faturamento de {faturamentoMensal.mesAno}
                      </h3>
                      <div className="mt-2 text-xs sm:text-sm text-green-700 space-y-1">
                        <p>• <strong>Total faturado:</strong> R\$ {faturamentoMensal.totalFaturamento.toFixed(2)}</p>
                        <p>• <strong>Número de vendas:</strong> {faturamentoMensal.quantidadeVendas} transações</p>
                        <p>• <strong>Ticket médio:</strong> R\$ {faturamentoMensal.quantidadeVendas > 0 ? (faturamentoMensal.totalFaturamento / faturamentoMensal.quantidadeVendas).toFixed(2) : '0.00'}</p>
                        <p className="text-green-600 font-medium">💡 O faturamento zera automaticamente todo dia 1º do mês</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 🚨 ALERTAS DE ESTOQUE - ÚNICO BLOCO */}
              {(produtosEstoqueBaixo.length > 0 || produtosEstoqueZerado.length > 0 || totalProdutosComProblemaValidade > 0) && (
                <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-6 sm:mb-8">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center">
                    🚨 Alertas de Estoque
                  </h3>

                  <div className="space-y-4">
                    {/* Produtos com estoque zerado */}
                    {produtosEstoqueZerado.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                        <h4 className="font-bold text-red-800 mb-2 flex items-center text-sm sm:text-base">
                          🚫 Produtos sem estoque ({produtosEstoqueZerado.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                          {produtosEstoqueZerado.slice(0, 6).map(produto => (
                            <div key={produto.id} className="bg-white p-2 sm:p-3 rounded border border-red-200">
                              <p className="font-medium text-gray-900 text-sm truncate">{produto.nome}</p>
                              <p className="text-xs text-gray-500">#{produto.codigo}</p>
                              <p className="text-xs text-red-600 font-medium">Estoque: 0</p>
                            </div>
                          ))}
                        </div>
                        {produtosEstoqueZerado.length > 6 && (
                          <p className="text-red-600 text-xs sm:text-sm mt-2">
                            +{produtosEstoqueZerado.length - 6} produtos também estão sem estoque
                          </p>
                        )}
                      </div>
                    )}

                    {/* Produtos com estoque baixo */}
                    {produtosEstoqueBaixo.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                        <h4 className="font-bold text-yellow-800 mb-2 flex items-center text-sm sm:text-base">
                          ⚠️ Produtos com estoque baixo ({produtosEstoqueBaixo.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                          {produtosEstoqueBaixo.slice(0, 6).map(produto => (
                            <div key={produto.id} className="bg-white p-2 sm:p-3 rounded border border-yellow-200">
                              <p className="font-medium text-gray-900 text-sm truncate">{produto.nome}</p>
                              <p className="text-xs text-gray-500">#{produto.codigo}</p>
                              <p className="text-xs text-yellow-600 font-medium">
                                Estoque: {produto.estoque} (mín: {produto.estoqueMinimo})
                              </p>
                            </div>
                          ))}
                        </div>
                        {produtosEstoqueBaixo.length > 6 && (
                          <p className="text-yellow-600 text-xs sm:text-sm mt-2">
                            +{produtosEstoqueBaixo.length - 6} produtos também estão com estoque baixo
                          </p>
                        )}
                      </div>
                    )}

                    {/* 🆕 ALERTAS DE VALIDADE INTEGRADOS */}
                    {alertasValidade.vencidos.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                        <h4 className="font-bold text-red-800 mb-2 flex items-center text-sm sm:text-base">
                          🚨 Produtos VENCIDOS ({alertasValidade.vencidos.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                          {alertasValidade.vencidos.slice(0, 6).map(produto => (
                            <div key={produto.id} className="bg-white p-2 sm:p-3 rounded border border-red-200">
                              <p className="font-medium text-gray-900 text-sm truncate">{produto.nome}</p>
                              <p className="text-xs text-gray-500">#{produto.codigo}</p>
                              <p className="text-xs text-red-600 font-medium">
                                Venceu em: {produto.dataValidade ? new Date(produto.dataValidade).toLocaleDateString('pt-BR') : 'N/A'}
                              </p>
                            </div>
                          ))}
                        </div>
                        {alertasValidade.vencidos.length > 6 && (
                          <p className="text-red-600 text-xs sm:text-sm mt-2">
                            +{alertasValidade.vencidos.length - 6} produtos também estão vencidos
                          </p>
                        )}
                      </div>
                    )}

                    {alertasValidade.vencendoHoje.length > 0 && (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
                        <h4 className="font-bold text-orange-800 mb-2 flex items-center text-sm sm:text-base">
                          ⏰ Produtos vencendo HOJE ({alertasValidade.vencendoHoje.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                          {alertasValidade.vencendoHoje.slice(0, 6).map(produto => (
                            <div key={produto.id} className="bg-white p-2 sm:p-3 rounded border border-orange-200">
                              <p className="font-medium text-gray-900 text-sm truncate">{produto.nome}</p>
                              <p className="text-xs text-gray-500">#{produto.codigo}</p>
                              <p className="text-xs text-orange-600 font-medium">Vence hoje!</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {alertasValidade.vencendoEm7Dias.length > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                        <h4 className="font-bold text-yellow-800 mb-2 flex items-center text-sm sm:text-base">
                          📆 Produtos vencendo em até 7 dias ({alertasValidade.vencendoEm7Dias.length})
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                          {alertasValidade.vencendoEm7Dias.slice(0, 6).map(produto => {
                            const diasParaVencer = produto.dataValidade ? 
                              Math.ceil((new Date(produto.dataValidade).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0
                            
                            return (
                              <div key={produto.id} className="bg-white p-2 sm:p-3 rounded border border-yellow-200">
                                <p className="font-medium text-gray-900 text-sm truncate">{produto.nome}</p>
                                <p className="text-xs text-gray-500">#{produto.codigo}</p>
                                <p className="text-xs text-yellow-600 font-medium">
                                  Vence em {diasParaVencer} dia{diasParaVencer !== 1 ? 's' : ''}
                                </p>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Ações Rápidas - BOTÕES GRANDES E VISÍVEIS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <button
                  onClick={() => router.push('/produtos')}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <div className="text-3xl mb-2">➕</div>
                  <div className="font-semibold text-lg">Novo Produto</div>
                  <div className="text-blue-100 text-sm mt-1">Cadastrar item</div>
                </button>

                <button
                  onClick={() => router.push('/movimentacoes')}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <div className="text-3xl mb-2">📦</div>
                  <div className="font-semibold text-lg">Nova Movimentação</div>
                  <div className="text-green-100 text-sm mt-1">Entrada/Saída</div>
                </button>

                <button
                  onClick={() => router.push('/pdv')}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <div className="text-3xl mb-2">💰</div>
                  <div className="font-semibold text-lg">PDV</div>
                  <div className="text-purple-100 text-sm mt-1">Ponto de Venda</div>
                </button>

                <button
                  onClick={() => router.push('/relatorios')}
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                >
                  <div className="text-3xl mb-2">📊</div>
                  <div className="font-semibold text-lg">Relatórios</div>
                  <div className="text-orange-100 text-sm mt-1">Análises</div>
                </button>
              </div>

              {/* Resumo do Estoque */}
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">📊 Resumo do Estoque</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl sm:text-3xl font-bold text-blue-600">{produtosAtivos.length}</p>
                    <p className="text-blue-600 text-sm font-medium">Produtos Ativos</p>
                  </div>

                  <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                    <p className="text-lg sm:text-xl font-bold text-green-600">
                      R\$ {valorTotalEstoque.toFixed(2)}
                    </p>
                    <p className="text-green-600 text-sm font-medium">Valor do Estoque</p>
                  </div>

                  <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl sm:text-3xl font-bold text-purple-600">{movimentacoes?.length || 0}</p>
                    <p className="text-purple-600 text-sm font-medium">Total Movimentações</p>
                  </div>

                  <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg">
                    <p className="text-2xl sm:text-3xl font-bold text-orange-600">
                      {Math.round(((produtosAtivos.length - produtosEstoqueBaixo.length) / Math.max(produtosAtivos.length, 1)) * 100)}%
                    </p>
                    <p className="text-orange-600 text-sm font-medium">Estoque Saudável</p>
                  </div>
                </div>
              </div>

              {/* Dicas sobre Faturamento Mensal */}
              <div className="mt-6 sm:mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <div className="text-xl sm:text-2xl">💡</div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Sobre o Faturamento Mensal
                    </h3>
                    <div className="mt-2 text-xs sm:text-sm text-blue-700 space-y-1">
                      <p>• O faturamento é calculado apenas com as <strong>vendas (saídas)</strong> do mês atual</p>
                      <p>• Automaticamente zera todo dia 1º do mês para um novo ciclo</p>
                      <p>• Para análises históricas, use a aba <strong>Relatórios</strong> com períodos personalizados</p>
                      <p>• O lucro líquido detalhado está disponível nos relatórios</p>
                      <p>• Todos os dados são sincronizados em tempo real com o Firebase</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}