'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Produto {
  id: number
  codigo: string
  nome: string
  categoria: string
  estoqueMinimo: number
  estoque: number
  ativo: boolean
}

interface AlertaProduto {
  id: number
  codigo: string
  nome: string
  categoria: string
  estoque: number
  estoqueMinimo: number
  nivel: 'critico' | 'baixo' | 'zerado'
}

interface AlertSystemProps {
  showInDashboard?: boolean
  compact?: boolean
}

export default function AlertSystem({ showInDashboard = false, compact = false }: AlertSystemProps) {
  const router = useRouter()
  const [alertas, setAlertas] = useState<AlertaProduto[]>([])
  const [showAlertas, setShowAlertas] = useState(false)
  const [alertasVistos, setAlertasVistos] = useState<number[]>([])

  useEffect(() => {
    carregarAlertas()
    // Atualizar alertas a cada 30 segundos
    const interval = setInterval(carregarAlertas, 30000)
    return () => clearInterval(interval)
  }, [])

  const carregarAlertas = () => {
    const produtosSalvos = localStorage.getItem('stockpro_produtos')
    if (produtosSalvos) {
      try {
        const produtos: Produto[] = JSON.parse(produtosSalvos)
        const produtosAtivos = produtos.filter(p => p.ativo)
        
        const novosAlertas: AlertaProduto[] = []
        
        produtosAtivos.forEach(produto => {
          if (produto.estoque <= produto.estoqueMinimo) {
            let nivel: 'critico' | 'baixo' | 'zerado' = 'baixo'
            
            if (produto.estoque === 0) {
              nivel = 'zerado'
            } else if (produto.estoque <= produto.estoqueMinimo * 0.5) {
              nivel = 'critico'
            }
            
            novosAlertas.push({
              id: produto.id,
              codigo: produto.codigo,
              nome: produto.nome,
              categoria: produto.categoria,
              estoque: produto.estoque,
              estoqueMinimo: produto.estoqueMinimo,
              nivel
            })
          }
        })
        
        setAlertas(novosAlertas)
        
        // Salvar alertas para persistência
        localStorage.setItem('stockpro_alertas_ativos', JSON.stringify(novosAlertas))
      } catch (error) {
        console.error('Erro ao carregar alertas:', error)
      }
    }
  }

  const marcarComoVisto = (alertaId: number) => {
    const novosVistos = [...alertasVistos, alertaId]
    setAlertasVistos(novosVistos)
    localStorage.setItem('stockpro_alertas_vistos', JSON.stringify(novosVistos))
  }

  const marcarTodosComoVistos = () => {
    const todosIds = alertas.map(a => a.id)
    setAlertasVistos(todosIds)
    localStorage.setItem('stockpro_alertas_vistos', JSON.stringify(todosIds))
  }

  const alertasNaoVistos = alertas.filter(a => !alertasVistos.includes(a.id))

  const getNivelColor = (nivel: string) => {
    switch (nivel) {
      case 'zerado': return 'bg-red-500 text-white'
      case 'critico': return 'bg-orange-500 text-white'
      case 'baixo': return 'bg-yellow-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getNivelIcon = (nivel: string) => {
    switch (nivel) {
      case 'zerado': return '🚫'
      case 'critico': return '🚨'
      case 'baixo': return '⚠️'
      default: return '❓'
    }
  }

  const getNivelTexto = (nivel: string) => {
    switch (nivel) {
      case 'zerado': return 'ESGOTADO'
      case 'critico': return 'CRÍTICO'
      case 'baixo': return 'BAIXO'
      default: return 'ALERTA'
    }
  }

  // Versão compacta para o header
  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowAlertas(!showAlertas)}
          className={`relative p-2 rounded-lg transition-all duration-200 ${
            alertasNaoVistos.length > 0 
              ? 'bg-red-100 text-red-600 hover:bg-red-200 animate-pulse' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <div className="text-xl">🚨</div>
          {alertasNaoVistos.length > 0 && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold animate-bounce">
              {alertasNaoVistos.length}
            </div>
          )}
        </button>

        {/* Dropdown de alertas */}
        {showAlertas && (
          <div className="absolute right-0 top-12 w-80 bg-white rounded-lg shadow-xl border-2 border-gray-200 z-50 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">🚨 Alertas de Estoque</h3>
              {alertasNaoVistos.length > 0 && (
                <button
                  onClick={marcarTodosComoVistos}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                >
                  Marcar todos como vistos
                </button>
              )}
            </div>
            
            {alertas.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <div className="text-2xl mb-2">✅</div>
                <p>Todos os produtos estão com estoque adequado!</p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {alertas.map((alerta) => (
                  <div
                    key={alerta.id}
                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 ${
                      alertasVistos.includes(alerta.id) ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg">{getNivelIcon(alerta.nivel)}</span>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{alerta.nome}</p>
                            <p className="text-xs text-gray-500">#{alerta.codigo} • {alerta.categoria}</p>
                          </div>
                        </div>
                        <div className="mt-1 flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${getNivelColor(alerta.nivel)}`}>
                            {getNivelTexto(alerta.nivel)}
                          </span>
                          <span className="text-xs text-gray-600">
                            {alerta.estoque} / {alerta.estoqueMinimo} unidades
                          </span>
                        </div>
                      </div>
                      {!alertasVistos.includes(alerta.id) && (
                        <button
                          onClick={() => marcarComoVisto(alerta.id)}
                          className="text-xs text-blue-600 hover:text-blue-800 ml-2"
                        >
                          ✓ Visto
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="p-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowAlertas(false)
                  router.push('/produtos')
                }}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold py-2 px-4 rounded"
              >
                📦 Gerenciar Produtos
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  // Versão completa para o dashboard
  if (showInDashboard && alertas.length > 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6 border-l-4 border-red-500">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-red-800 flex items-center">
            <span className="text-2xl mr-2 animate-pulse">🚨</span>
            Alertas de Estoque ({alertas.length})
          </h3>
          <button
            onClick={() => router.push('/produtos')}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold"
          >
            📦 Gerenciar Produtos
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {alertas.slice(0, 6).map((alerta) => (
            <div
              key={alerta.id}
              className={`p-4 rounded-lg border-2 ${
                alerta.nivel === 'zerado' 
                  ? 'border-red-500 bg-red-50' 
                  : alerta.nivel === 'critico'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-yellow-500 bg-yellow-50'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{getNivelIcon(alerta.nivel)}</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${getNivelColor(alerta.nivel)}`}>
                  {getNivelTexto(alerta.nivel)}
                </span>
              </div>
              <h4 className="font-bold text-gray-900 mb-1">{alerta.nome}</h4>
              <p className="text-sm text-gray-600 mb-2">#{alerta.codigo} • {alerta.categoria}</p>
              <div className="text-sm">
                <span className="font-medium">Estoque: </span>
                <span className={`font-bold ${alerta.estoque === 0 ? 'text-red-600' : 'text-orange-600'}`}>
                  {alerta.estoque}
                </span>
                <span className="text-gray-500"> / {alerta.estoqueMinimo} unidades</span>
              </div>
            </div>
          ))}
        </div>
        
        {alertas.length > 6 && (
          <div className="mt-4 text-center">
            <button
              onClick={() => router.push('/produtos')}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Ver todos os {alertas.length} alertas →
            </button>
          </div>
        )}
      </div>
    )
  }

  return null
}