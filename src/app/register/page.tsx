'use client'
import { useState, useEffect } from 'react'

interface Produto {
  id: string
  nome: string
  categoria: string
  preco: number
  estoque: number
  estoqueMinimo: number
  fornecedor?: string
  descricao?: string
  createdAt: string
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null)
  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    preco: '',
    estoque: '',
    estoqueMinimo: '',
    fornecedor: '',
    descricao: ''
  })

  // Buscar produtos
  const fetchProdutos = async () => {
    try {
      const response = await fetch('/api/produtos')
      if (response.ok) {
        const data = await response.json()
        setProdutos(data)
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProdutos()
  }, [])

  // Salvar produto
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const url = editingProduct ? `/api/produtos/${editingProduct.id}` : '/api/produtos'
      const method = editingProduct ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          preco: parseFloat(formData.preco),
          estoque: parseInt(formData.estoque),
          estoqueMinimo: parseInt(formData.estoqueMinimo)
        })
      })

      if (response.ok) {
        await fetchProdutos()
        setShowForm(false)
        setEditingProduct(null)
        setFormData({
          nome: '',
          categoria: '',
          preco: '',
          estoque: '',
          estoqueMinimo: '',
          fornecedor: '',
          descricao: ''
        })
      }
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
    } finally {
      setLoading(false)
    }
  }

  // Editar produto
  const handleEdit = (produto: Produto) => {
    setEditingProduct(produto)
    setFormData({
      nome: produto.nome,
      categoria: produto.categoria,
      preco: produto.preco.toString(),
      estoque: produto.estoque.toString(),
      estoqueMinimo: produto.estoqueMinimo.toString(),
      fornecedor: produto.fornecedor || '',
      descricao: produto.descricao || ''
    })
    setShowForm(true)
  }

  // Deletar produto
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return

    try {
      const response = await fetch(`/api/produtos/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchProdutos()
      }
    } catch (error) {
      console.error('Erro ao deletar produto:', error)
    }
  }

  if (loading && produtos.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Carregando produtos...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">🍷 Produtos</h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          ➕ Novo Produto
        </button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? 'Editar Produto' : 'Novo Produto'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Nome do produto"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
              
              <input
                type="text"
                placeholder="Categoria"
                value={formData.categoria}
                onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
              
              <input
                type="number"
                step="0.01"
                placeholder="Preço"
                value={formData.preco}
                onChange={(e) => setFormData({...formData, preco: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
              
              <input
                type="number"
                placeholder="Estoque atual"
                value={formData.estoque}
                onChange={(e) => setFormData({...formData, estoque: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
              
              <input
                type="number"
                placeholder="Estoque mínimo"
                value={formData.estoqueMinimo}
                onChange={(e) => setFormData({...formData, estoqueMinimo: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
              
              <input
                type="text"
                placeholder="Fornecedor (opcional)"
                value={formData.fornecedor}
                onChange={(e) => setFormData({...formData, fornecedor: e.target.value})}
                className="w-full p-2 border rounded"
              />
              
              <textarea
                placeholder="Descrição (opcional)"
                value={formData.descricao}
                onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                className="w-full p-2 border rounded"
                rows={3}
              />
              
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingProduct(null)
                    setFormData({
                      nome: '',
                      categoria: '',
                      preco: '',
                      estoque: '',
                      estoqueMinimo: '',
                      fornecedor: '',
                      descricao: ''
                    })
                  }}
                  className="flex-1 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lista de produtos */}
      <div className="grid gap-4">
        {produtos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Nenhum produto cadastrado
          </div>
        ) : (
          produtos.map((produto) => (
            <div key={produto.id} className="bg-white p-4 rounded-lg shadow border">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{produto.nome}</h3>
                  <p className="text-gray-600">{produto.categoria}</p>
                  <p className="text-xl font-bold text-green-600">R\$ {produto.preco.toFixed(2)}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className={`px-2 py-1 rounded ${
                      produto.estoque <= produto.estoqueMinimo 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      Estoque: {produto.estoque}
                    </span>
                    <span className="text-gray-500">
                      Mín: {produto.estoqueMinimo}
                    </span>
                  </div>
                  {produto.fornecedor && (
                    <p className="text-sm text-gray-500 mt-1">
                      Fornecedor: {produto.fornecedor}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(produto)}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(produto.id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}