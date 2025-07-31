'use client'
import { useRouter } from 'next/navigation'
import MobileMenu from './MobileMenu'

interface ResponsiveHeaderProps {
  title: string
  currentPage: string
  showBackButton?: boolean
  backPath?: string
}

export default function ResponsiveHeader({ 
  title, 
  currentPage, 
  showBackButton = false, 
  backPath = '/dashboard' 
}: ResponsiveHeaderProps) {
  const router = useRouter()

  return (
    <header className="bg-white shadow-lg sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          
          {/* Logo e Título */}
          <div className="flex items-center space-x-4">
            {/* Menu Mobile */}
            <MobileMenu currentPage={currentPage} />
            
            {/* Logo - sempre visível */}
            <button 
              onClick={() => router.push('/dashboard')}
              className="text-xl sm:text-2xl font-bold text-gray-800 hover:text-purple-600 transition-colors"
            >
              📦 StockPro
            </button>
            
            {/* Separador e título - oculto em mobile */}
            <div className="hidden sm:flex items-center space-x-4">
              <span className="text-gray-400">|</span>
              <h2 className="text-lg lg:text-xl font-semibold text-gray-700">{title}</h2>
            </div>
          </div>

          {/* Navegação Desktop */}
          <div className="hidden md:flex space-x-4">
            {currentPage !== '/dashboard' && (
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-purple-600 hover:text-purple-800 font-medium transition-colors"
              >
                🏠 Dashboard
              </button>
            )}
            {currentPage !== '/produtos' && (
              <button 
                onClick={() => router.push('/produtos')}
                className="text-purple-600 hover:text-purple-800 font-medium transition-colors"
              >
                📦 Produtos
              </button>
            )}
            {currentPage !== '/movimentacoes' && (
              <button 
                onClick={() => router.push('/movimentacoes')}
                className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                ✏️ Movimentações
              </button>
            )}
            {currentPage !== '/relatorios' && (
              <button 
                onClick={() => router.push('/relatorios')}
                className="text-green-600 hover:text-green-800 font-medium transition-colors"
              >
                📊 Relatórios
              </button>
            )}
          </div>

          {/* Botão Voltar Mobile */}
          {showBackButton && (
            <button
              onClick={() => router.push(backPath)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <span className="text-lg">←</span>
            </button>
          )}
        </div>

        {/* Título Mobile - aparece abaixo do header */}
        <div className="sm:hidden pb-3 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
        </div>
      </div>
    </header>
  )
}