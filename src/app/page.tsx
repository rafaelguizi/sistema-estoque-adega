'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    senha: ''
  })
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // Simular validação (remover depois quando implementar auth real)
    if (formData.email && formData.senha) {
      // Simular delay de autenticação
      setTimeout(() => {
        localStorage.setItem('stockpro_user', JSON.stringify({
          email: formData.email,
          nome: 'Usuário Demo',
          loginTime: new Date().toISOString()
        }))
        router.push('/dashboard')
      }, 1000)
    } else {
      setLoading(false)
      alert('Por favor, preencha todos os campos!')
    }
  }

  const handleDemoLogin = () => {
    setLoading(true)
    localStorage.setItem('stockpro_user', JSON.stringify({
      email: 'demo@stockpro.com',
      nome: 'Usuário Demo',
      loginTime: new Date().toISOString()
    }))
    setTimeout(() => {
      router.push('/dashboard')
    }, 800)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📦</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            StockPro
          </h1>
          <p className="text-gray-600">
            Sistema de Gestão de Estoque
          </p>
          <div className="mt-2 text-sm text-gray-500">
            Versão 1.0 - Controle Total do seu Negócio
          </div>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              E-mail
            </label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder="seu@email.com"
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-400 bg-gray-50 transition-all"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Senha
            </label>
            <input 
              type="password" 
              required
              value={formData.senha}
              onChange={(e) => setFormData({...formData, senha: e.target.value})}
              placeholder="••••••••"
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-400 bg-gray-50 transition-all"
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold py-3 px-4 rounded-lg transition duration-200 shadow-lg flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Entrando...
              </>
            ) : (
              '🔑 Entrar'
            )}
          </button>
        </form>

        {/* Botão Demo */}
        <div className="mt-4">
          <button 
            onClick={handleDemoLogin}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-3 px-4 rounded-lg transition duration-200 shadow-lg"
          >
            🚀 Acesso Demo (Teste Rápido)
          </button>
        </div>
        
        <div className="text-center mt-6 space-y-2">
          <a href="#" className="block text-purple-600 hover:text-purple-800 text-sm">
            Esqueceu sua senha?
          </a>
          <div className="text-xs text-gray-500">
            Não tem conta? <a href="#" className="text-purple-600 hover:text-purple-800">Cadastre-se</a>
          </div>
        </div>

        {/* Recursos do Sistema */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 text-center">
            ✨ Recursos Disponíveis
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="flex items-center">
              <span className="mr-1">📦</span> Gestão de Produtos
            </div>
            <div className="flex items-center">
              <span className="mr-1">🏭</span> Fornecedores
            </div>
            <div className="flex items-center">
              <span className="mr-1">✏️</span> Movimentações
            </div>
            <div className="flex items-center">
              <span className="mr-1">📊</span> Relatórios
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}