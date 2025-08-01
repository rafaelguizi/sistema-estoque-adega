'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useFirestore } from '@/hooks/useFirestore'
import { useToastContext } from '@/components/ToastProvider'
import LoadingButton from '@/components/LoadingButton'
import MobileHeader from '@/components/MobileHeader'
import AlertSystem from '@/components/AlertSystem'
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

          {/* Sistema de Alertas */}
          <AlertSystem showInDashboard={true} />

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
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                    <LoadingButton
                      onClick={() => router.push('/produtos')}
                      variant="secondary"
                      size="sm"
                      className="w-full sm:w-auto bg-black bg-opacity-20 hover:bg-opacity-30 text-white border-white"
                    >
                      ➕ Novo Produto
                    </LoadingButton>
                    <LoadingButton
                      onClick={() => router.push('/movimentacoes')}
                      variant="secondary"
                      size="sm"
                      className="w-full sm:w-auto bg-black bg-opacity-20 hover:bg-opacity-30 text-white border-white"
                    >
                      📦 Nova Movimentação
                    </LoadingButton>
                  </div>
                </div>
              </div>

              {/* Cards de Estatísticas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">

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

              {/* Alertas Manuais (caso o AlertSystem não apareça) */}
              {(produtosEstoqueBaixo.length > 0 || produtosEstoqueZerado.length > 0) && (
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
                  </div>
                </div>
              )}

              {/* Ações Rápidas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">

                {/* Gestão de Produtos */}
                <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow duration-200">
                  <div className="text-center">
                    <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">📦</div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Gestão de Produtos</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Cadastre, edite e gerencie seus produtos
                    </p>
                    <LoadingButton
                      onClick={() => router.push('/produtos')}
                      variant="primary"
                      size="md"
                      className="w-full"
                    >
                      Gerenciar Produtos
                    </LoadingButton>
                  </div>
                </div>

                {/* Movimentações */}
                <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow duration-200">
                  <div className="text-center">
                    <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">↔️</div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Movimentações</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Registre entradas e saídas do estoque
                    </p>
                    <LoadingButton
                      onClick={() => router.push('/movimentacoes')}
                      variant="primary"
                      size="md"
                      className="w-full"
                    >
                      Ver Movimentações
                    </LoadingButton>
                  </div>
                </div>

                {/* Relatórios */}
                <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 hover:shadow-xl transition-shadow duration-200 sm:col-span-2 lg:col-span-1">
                  <div className="text-center">
                    <div className="text-4xl sm:text-5xl mb-3 sm:mb-4">📈</div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">Relatórios</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      Analise vendas e performance do estoque
                    </p>
                    <LoadingButton
                      onClick={() => router.push('/relatorios')}
                      variant="success"
                      size="md"
                      className="w-full"
                    >
                      Ver Relatórios
                    </LoadingButton>
                  </div>
                </div>
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