'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

interface MobileHeaderProps {
  title: string
  currentPage: string
}

export default function MobileHeader({ title, currentPage }: MobileHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '🏠' },
    { name: 'Produtos', path: '/produtos', icon: '📦' },
    { name: 'Movimentações', path: '/movimentacoes', icon: '✏️' },
    { name: 'Relatórios', path: '/relatorios', icon: '📊' }
  ]

  const handleNavigation = (path: string) => {
    router.push(path)
    setMobileMenuOpen(false)
  }

  const handleLogout = async () => {
    try {
      const { auth } = await import('@/lib/firebase')
      const { signOut } = await import('firebase/auth')
      if (auth) {
        await signOut(auth)
        router.push('/login')
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error)
    }
  }

  // Se não estiver logado, não renderizar
  if (!user) return null

  return (
    <>
      {/* Header Responsivo */}
      <header className="bg-white shadow-lg sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            
            {/* Logo e Menu Mobile */}
            <div className="flex items-center space-x-4">
              {/* Botão Menu Mobile */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                aria-label="Menu"
              >
                <div className="flex flex-col space-y-1">
                  <span className={`block w-5 h-0.5 bg-gray-600 transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
                  <span className={`block w-5 h-0.5 bg-gray-600 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`}></span>
                  <span className={`block w-5 h-0.5 bg-gray-600 transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
                </div>
              </button>
              
              {/* Logo - sempre clicável para voltar ao dashboard */}
              <button 
                onClick={() => router.push('/dashboard')}
                className="text-xl sm:text-2xl font-bold text-gray-800 hover:text-purple-600 transition-colors"
              >
                📦 StockPro
              </button>
              
              {/* Título Desktop */}
              <div className="hidden sm:flex items-center space-x-4">
                <span className="text-gray-400">|</span>
                <h2 className="text-lg lg:text-xl font-semibold text-gray-700">{title}</h2>
              </div>
            </div>

            {/* Navegação Desktop - SEM scroll horizontal */}
            <div className="hidden md:flex items-center space-x-4">
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
              
              {/* Botão Logout Desktop */}
              <button
                onClick={handleLogout}
                className="text-red-600 hover:text-red-800 font-medium transition-colors"
              >
                🚪 Sair
              </button>
            </div>
          </div>

          {/* Título Mobile - aparece abaixo do header */}
          <div className="sm:hidden pb-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700">{title}</h2>
          </div>
        </div>
      </header>

      {/* Menu Mobile Overlay */}
      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu Lateral */}
          <div className="fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden">
            
            {/* Header do Menu */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">📦 StockPro</h2>
                  <p className="text-purple-100 text-sm">Sistema de Gestão</p>
                  <p className="text-purple-200 text-xs mt-1">{user.email}</p>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center hover:bg-opacity-30 transition-colors"
                >
                  <span className="text-white text-lg">×</span>
                </button>
              </div>
            </div>

            {/* Lista de Menu */}
            <div className="py-4">
              {menuItems.map((item) => {
                const isActive = currentPage === item.path
                
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNavigation(item.path)}
                    className={`w-full flex items-center space-x-4 px-6 py-4 text-left hover:bg-gray-50 transition-colors duration-200 ${
                      isActive ? 'bg-purple-50 border-r-4 border-purple-600' : ''
                    }`}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <span className={`font-medium ${isActive ? 'text-purple-600' : 'text-gray-700'}`}>
                        {item.name}
                      </span>
                      {isActive && (
                        <div className="text-xs text-purple-500">Página atual</div>
                      )}
                    </div>
                  </button>
                )
              })}
              
              {/* Separador */}
              <div className="border-t border-gray-200 my-4"></div>
              
              {/* Botão Logout Mobile */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-4 px-6 py-4 text-left hover:bg-red-50 transition-colors duration-200"
              >
                <span className="text-2xl">🚪</span>
                <div>
                  <span className="font-medium text-red-600">Sair</span>
                  <div className="text-xs text-red-500">Fazer logout</div>
                </div>
              </button>
            </div>

            {/* Footer do Menu */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gray-50 border-t">
              <div className="text-center">
                <p className="text-sm text-gray-600">Versão Mobile</p>
                <p className="text-xs text-gray-500">StockPro v1.0</p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}