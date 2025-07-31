'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface MobileMenuProps {
  currentPage: string
}

export default function MobileMenu({ currentPage }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: '🏠', color: 'text-purple-600' },
    { name: 'Produtos', path: '/produtos', icon: '📦', color: 'text-purple-600' },
    { name: 'Movimentações', path: '/movimentacoes', icon: '✏️', color: 'text-blue-600' },
    { name: 'Relatórios', path: '/relatorios', icon: '📊', color: 'text-green-600' }
  ]

  const handleNavigation = (path: string) => {
    router.push(path)
    setIsOpen(false)
  }

  return (
    <>
      {/* Botão do Menu Mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
        aria-label="Menu"
      >
        <div className="flex flex-col space-y-1">
          <span className={`block w-5 h-0.5 bg-gray-600 transition-all duration-300 ${isOpen ? 'rotate-45 translate-y-1.5' : ''}`}></span>
          <span className={`block w-5 h-0.5 bg-gray-600 transition-all duration-300 ${isOpen ? 'opacity-0' : ''}`}></span>
          <span className={`block w-5 h-0.5 bg-gray-600 transition-all duration-300 ${isOpen ? '-rotate-45 -translate-y-1.5' : ''}`}></span>
        </div>
      </button>

      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Menu Lateral */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Header do Menu */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">📦 StockPro</h2>
              <p className="text-purple-100 text-sm">Sistema de Gestão</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
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
  )
}