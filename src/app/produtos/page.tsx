'use client'
import { useState, useEffect, useRef } from 'react'
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
  codigoBarras: string
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
  // 🆕 CAMPOS ESPECÍFICOS POR CATEGORIA
  camposEspecificos?: Record<string, any>
  marca?: string
  modelo?: string
  cor?: string
  tamanho?: string
}

// 🆕 SISTEMA DE CATEGORIAS INTELIGENTES
interface CampoEspecifico {
  nome: string
  tipo: 'text' | 'number' | 'date' | 'select' | 'boolean'
  obrigatorio: boolean
  opcoes?: string[]
  placeholder?: string
}

interface CategoriaProduto {
  id: string
  nome: string
  icone: string
  temValidade: boolean
  campos: CampoEspecifico[]
}

// 🆕 CATEGORIAS PREDEFINIDAS COM CAMPOS ESPECÍFICOS
const CATEGORIAS_INTELIGENTES: CategoriaProduto[] = [
  {
    id: 'alimenticio',
    nome: 'Alimentos e Bebidas',
    icone: '🍎',
    temValidade: true,
    campos: [
      { nome: 'lote', tipo: 'text', obrigatorio: false, placeholder: 'Número do lote' },
      { nome: 'fornecedor', tipo: 'text', obrigatorio: false, placeholder: 'Nome do fornecedor' },
      { nome: 'origem', tipo: 'text', obrigatorio: false, placeholder: 'País/região de origem' },
      { nome: 'peso', tipo: 'number', obrigatorio: false, placeholder: 'Peso em gramas' },
      { nome: 'volume', tipo: 'number', obrigatorio: false, placeholder: 'Volume em ml' }
    ]
  },
  {
    id: 'vestuario',
    nome: 'Roupas e Acessórios',
    icone: '👕',
    temValidade: false,
    campos: [
      { nome: 'genero', tipo: 'select', obrigatorio: false, opcoes: ['Masculino', 'Feminino', 'Unissex', 'Infantil'] },
      { nome: 'estacao', tipo: 'select', obrigatorio: false, opcoes: ['Verão', 'Inverno', 'Meia-estação', 'Atemporal'] },
      { nome: 'material', tipo: 'text', obrigatorio: false, placeholder: 'Ex: 100% algodão' },
      { nome: 'cuidados', tipo: 'text', obrigatorio: false, placeholder: 'Instruções de lavagem' }
    ]
  },
  {
    id: 'calcados',
    nome: 'Calçados',
    icone: '👟',
    temValidade: false,
    campos: [
      { nome: 'numeracao', tipo: 'text', obrigatorio: true, placeholder: 'Ex: 38, 39, 40...' },
      { nome: 'genero', tipo: 'select', obrigatorio: false, opcoes: ['Masculino', 'Feminino', 'Unissex', 'Infantil'] },
      { nome: 'tipo', tipo: 'select', obrigatorio: false, opcoes: ['Casual', 'Social', 'Esportivo', 'Sandália', 'Bota'] },
      { nome: 'material', tipo: 'text', obrigatorio: false, placeholder: 'Ex: Couro, Sintético...' }
    ]
  },
  {
    id: 'farmacia',
    nome: 'Farmácia e Saúde',
    icone: '💊',
    temValidade: true,
    campos: [
      { nome: 'principioAtivo', tipo: 'text', obrigatorio: false, placeholder: 'Princípio ativo' },
      { nome: 'dosagem', tipo: 'text', obrigatorio: false, placeholder: 'Ex: 500mg' },
      { nome: 'laboratorio', tipo: 'text', obrigatorio: false, placeholder: 'Laboratório fabricante' },
      { nome: 'prescricao', tipo: 'select', obrigatorio: false, opcoes: ['Livre', 'Receita Simples', 'Receita Especial'] },
      { nome: 'lote', tipo: 'text', obrigatorio: true, placeholder: 'Número do lote' },
      { nome: 'registro', tipo: 'text', obrigatorio: false, placeholder: 'Registro ANVISA' }
    ]
  },
  {
    id: 'beleza',
    nome: 'Beleza e Cuidados',
    icone: '💄',
    temValidade: true,
    campos: [
      { nome: 'tipo', tipo: 'select', obrigatorio: false, opcoes: ['Maquiagem', 'Skincare', 'Cabelo', 'Perfumaria', 'Unhas'] },
      { nome: 'genero', tipo: 'select', obrigatorio: false, opcoes: ['Masculino', 'Feminino', 'Unissex'] },
      { nome: 'tipoPele', tipo: 'select', obrigatorio: false, opcoes: ['Oleosa', 'Seca', 'Mista', 'Sensível', 'Todos os tipos'] },
      { nome: 'fragancia', tipo: 'text', obrigatorio: false, placeholder: 'Descrição da fragrância' }
    ]
  },
  {
    id: 'automotivo',
    nome: 'Automotivo',
    icone: '🔧',
    temValidade: false,
    campos: [
      { nome: 'aplicacao', tipo: 'text', obrigatorio: false, placeholder: 'Veículos compatíveis' },
      { nome: 'marca', tipo: 'text', obrigatorio: false, placeholder: 'Marca da peça' },
      { nome: 'codigoOriginal', tipo: 'text', obrigatorio: false, placeholder: 'Código original da peça' },
      { nome: 'garantia', tipo: 'number', obrigatorio: false, placeholder: 'Garantia em meses' },
      { nome: 'categoria', tipo: 'select', obrigatorio: false, opcoes: ['Motor', 'Suspensão', 'Freios', 'Elétrica', 'Carroceria', 'Filtros', 'Óleos'] }
    ]
  },
  {
    id: 'eletronicos',
    nome: 'Eletrônicos',
    icone: '📱',
    temValidade: false,
    campos: [
      { nome: 'voltagem', tipo: 'select', obrigatorio: false, opcoes: ['110V', '220V', 'Bivolt'] },
      { nome: 'garantia', tipo: 'number', obrigatorio: false, placeholder: 'Garantia em meses' },
      { nome: 'potencia', tipo: 'text', obrigatorio: false, placeholder: 'Ex: 1200W' },
      { nome: 'dimensoes', tipo: 'text', obrigatorio: false, placeholder: 'Altura x Largura x Profundidade' },
      { nome: 'peso', tipo: 'number', obrigatorio: false, placeholder: 'Peso em kg' }
    ]
  },
  {
    id: 'casa',
    nome: 'Casa e Decoração',
    icone: '🏠',
    temValidade: false,
    campos: [
      { nome: 'ambiente', tipo: 'select', obrigatorio: false, opcoes: ['Sala', 'Quarto', 'Cozinha', 'Banheiro', 'Área Externa', 'Escritório'] },
      { nome: 'material', tipo: 'text', obrigatorio: false, placeholder: 'Material principal' },
      { nome: 'dimensoes', tipo: 'text', obrigatorio: false, placeholder: 'Dimensões do produto' },
      { nome: 'estilo', tipo: 'select', obrigatorio: false, opcoes: ['Moderno', 'Clássico', 'Rústico', 'Industrial', 'Minimalista'] }
    ]
  },
  {
    id: 'geral',
    nome: 'Categoria Geral',
    icone: '📦',
    temValidade: false,
    campos: [
      { nome: 'observacoes', tipo: 'text', obrigatorio: false, placeholder: 'Observações gerais' }
    ]
  }
]

// 🆕 FUNÇÃO PARA BUSCAR CATEGORIA
function buscarCategoria(id: string): CategoriaProduto | undefined {
  return CATEGORIAS_INTELIGENTES.find(cat => cat.id === id)
}

// 🆕 COMPONENTE PARA CAMPOS ESPECÍFICOS
interface CamposEspecificosProps {
  categoria: CategoriaProduto
  valores: Record<string, any>
  onChange: (campo: string, valor: any) => void
  disabled?: boolean
}

function CamposEspecificos({ categoria, valores, onChange, disabled }: CamposEspecificosProps) {
  const renderCampo = (campo: CampoEspecifico) => {
    const valor = valores[campo.nome] || ''

    switch (campo.tipo) {
      case 'select':
        return (
          <select
            value={valor}
            onChange={(e) => onChange(campo.nome, e.target.value)}
            className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm text-sm"
            required={campo.obrigatorio}
            disabled={disabled}
          >
            <option value="">Selecione...</option>
            {campo.opcoes?.map(opcao => (
              <option key={opcao} value={opcao}>{opcao}</option>
            ))}
          </select>
        )
      
      case 'number':
        return (
          <input
            type="number"
            value={valor}
            onChange={(e) => onChange(campo.nome, e.target.value)}
            className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm text-sm"
            placeholder={campo.placeholder}
            required={campo.obrigatorio}
            disabled={disabled}
          />
        )
      
      case 'date':
        return (
          <input
            type="date"
            value={valor}
            onChange={(e) => onChange(campo.nome, e.target.value)}
            className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm text-sm"
            required={campo.obrigatorio}
            disabled={disabled}
          />
        )
      
      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={valor || false}
              onChange={(e) => onChange(campo.nome, e.target.checked)}
              className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              disabled={disabled}
            />
            <span className="text-sm text-gray-700">Sim</span>
          </div>
        )
      
      default: // text
        return (
          <input
            type="text"
            value={valor}
            onChange={(e) => onChange(campo.nome, e.target.value)}
            className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm text-sm"
            placeholder={campo.placeholder}
            required={campo.obrigatorio}
            disabled={disabled}
          />
        )
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-bold text-gray-900 mb-3 flex items-center">
          <span className="text-2xl mr-2">{categoria.icone}</span>
          Campos específicos - {categoria.nome}
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {categoria.campos.map(campo => (
            <div key={campo.nome}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {campo.nome.charAt(0).toUpperCase() + campo.nome.slice(1)}
                {campo.obrigatorio && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderCampo(campo)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Produtos() {
  const router = useRouter()
  const { user } = useAuth()
  const toast = useToastContext()
  
  // Hooks do Firestore
  const { 
    data: produtos, 
    loading: loadingProdutos, 
    addDocument, 
    updateDocument, 
    deleteDocument 
  } = useFirestore<Produto>('produtos')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNovaCategoria, setShowNovaCategoria] = useState(false)
  const [novaCategoria, setNovaCategoria] = useState('')
  const [showScanner, setShowScanner] = useState(false)
  const [loading, setLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 🆕 ESTADOS PARA CATEGORIA INTELIGENTE
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>('')
  const [camposEspecificos, setCamposEspecificos] = useState<Record<string, any>>({})

  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    codigoBarras: '',
    estoqueMinimo: '',
    valorCompra: '',
    valorVenda: '',
    estoque: '',
    marca: '',
    modelo: '',
    cor: '',
    tamanho: '',
    // 🆕 CAMPOS DE VALIDADE
    temValidade: false,
    dataValidade: '',
    diasAlerta: '30'
  })

  // Estados de filtro
  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('')
  const [filtroValidade, setFiltroValidade] = useState('')
  const [buscaCategoria, setBuscaCategoria] = useState('')

  // Categorias pré-definidas (mantidas para compatibilidade)
  const categoriasPadrao = [
    'Eletrônicos',
    'Roupas e Acessórios',
    'Casa e Jardim',
    'Esportes e Lazer',
    'Livros e Papelaria',
    'Beleza e Cuidados',
    'Alimentação',
    'Bebidas',
    'Ferramentas',
    'Automóveis',
    'Brinquedos',
    'Informática'
  ]

  // 🆕 FUNÇÃO PARA VERIFICAR VALIDADE
  const verificarValidade = (produto: Produto) => {
    if (!produto.temValidade || !produto.dataValidade) return { status: 'sem_validade', diasRestantes: null }

    const hoje = new Date()
    const dataValidade = new Date(produto.dataValidade)
    const diasRestantes = Math.ceil((dataValidade.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
    const diasAlerta = produto.diasAlerta || 30

    if (diasRestantes < 0) return { status: 'vencido', diasRestantes }
    if (diasRestantes === 0) return { status: 'vence_hoje', diasRestantes }
    if (diasRestantes <= 7) return { status: 'vence_em_7_dias', diasRestantes }
    if (diasRestantes <= diasAlerta) return { status: 'proximo_vencimento', diasRestantes }
    
    return { status: 'valido', diasRestantes }
  }

  // Gerar próximo código automaticamente
  const gerarProximoCodigo = () => {
    if (!produtos) return '001'
    const produtosAtivos = produtos.filter(p => p.ativo)
    const proximoNumero = produtosAtivos.length + 1
    return proximoNumero.toString().padStart(3, '0') // 001, 002, 003...
  }

  // Obter todas as categorias (padrão + personalizadas + inteligentes)
  const obterTodasCategorias = () => {
    const categoriasInteligentes = CATEGORIAS_INTELIGENTES.map(cat => cat.nome)
    const categoriasPersonalizadas = produtos ? [...new Set(produtos.map(p => p.categoria))].filter(Boolean) : []
    const todasCategorias = [...new Set([...categoriasInteligentes, ...categoriasPadrao, ...categoriasPersonalizadas])]

    // Filtrar categorias baseado na busca
    if (buscaCategoria) {
      return todasCategorias.filter(cat =>
        cat.toLowerCase().includes(buscaCategoria.toLowerCase())
      )
    }

    return todasCategorias.sort()
  }

  // 🆕 FUNÇÃO PARA LIDAR COM MUDANÇA DE CATEGORIA
  const handleCategoriaChange = (nomeCategoria: string) => {
    const categoriaInteligente = CATEGORIAS_INTELIGENTES.find(cat => cat.nome === nomeCategoria)
    
    setFormData(prev => ({
      ...prev,
      categoria: nomeCategoria,
      temValidade: categoriaInteligente?.temValidade || false
    }))
    
    setCategoriaSelecionada(categoriaInteligente?.id || '')
    setCamposEspecificos({}) // Limpar campos específicos
    setBuscaCategoria('')
  }

  // 🆕 FUNÇÃO PARA LIDAR COM CAMPOS ESPECÍFICOS
  const handleCampoEspecifico = (campo: string, valor: any) => {
    setCamposEspecificos(prev => ({
      ...prev,
      [campo]: valor
    }))
  }

  // Iniciar scanner de código de barras
  const iniciarScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment' // Câmera traseira
        }
      })

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setShowScanner(true)
        toast.info('Scanner ativo', 'Aponte a câmera para o código de barras')
      }
    } catch (error) {
      console.error('Erro ao acessar câmera:', error)
      toast.error('Erro na câmera', 'Não foi possível acessar a câmera. Verifique as permissões.')
    }
  }

  // Parar scanner
  const pararScanner = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
    }
    setShowScanner(false)
  }

  // Simular leitura de código de barras (para demonstração)
  const simularLeituraCodigoBarras = () => {
    const codigoSimulado = Math.random().toString().substr(2, 13) // 13 dígitos
    setFormData({...formData, codigoBarras: codigoSimulado})
    pararScanner()
    toast.success('Código escaneado!', `Código: ${codigoSimulado}`)
  }

  const resetForm = () => {
    setFormData({
      nome: '',
      categoria: '',
      codigoBarras: '',
      estoqueMinimo: '',
      valorCompra: '',
      valorVenda: '',
      estoque: '',
      marca: '',
      modelo: '',
      cor: '',
      tamanho: '',
      temValidade: false,
      dataValidade: '',
      diasAlerta: '30'
    })
    setCategoriaSelecionada('')
    setCamposEspecificos({})
    setEditingId(null)
    setShowForm(false)
    setShowNovaCategoria(false)
    setNovaCategoria('')
    setBuscaCategoria('')
    pararScanner()
  }

  const adicionarNovaCategoria = async () => {
    if (!novaCategoria.trim()) {
      toast.warning('Categoria vazia', 'Digite o nome da categoria!')
      return
    }

    const categoriaExiste = obterTodasCategorias().some(cat =>
      cat.toLowerCase() === novaCategoria.toLowerCase()
    )

    if (categoriaExiste) {
      toast.warning('Categoria já existe', 'Esta categoria já está disponível!')
      return
    }

    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 500))

      handleCategoriaChange(novaCategoria)
      setShowNovaCategoria(false)
      setNovaCategoria('')
      toast.success('Categoria adicionada!', 'Nova categoria criada com sucesso!')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!user) {
      toast.error('Erro de autenticação', 'Usuário não encontrado!')
      return
    }

    setLoading(true)
    try {
      // Validações
      if (!formData.nome || !formData.categoria) {
        toast.error('Campos obrigatórios', 'Preencha nome e categoria!')
        return
      }

      // 🆕 VALIDAR CAMPOS ESPECÍFICOS OBRIGATÓRIOS
      const categoriaInteligente = buscarCategoria(categoriaSelecionada)
      if (categoriaInteligente) {
        const camposObrigatorios = categoriaInteligente.campos.filter(campo => campo.obrigatorio)
        for (const campo of camposObrigatorios) {
          if (!camposEspecificos[campo.nome]) {
            toast.error('Campo obrigatório', `O campo "${campo.nome}" é obrigatório para esta categoria!`)
            return
          }
        }
      }

      const estoqueMinimo = parseInt(formData.estoqueMinimo) || 0
      const valorCompra = parseFloat(formData.valorCompra) || 0
      const valorVenda = parseFloat(formData.valorVenda) || 0
      const estoque = parseInt(formData.estoque) || 0
      const diasAlerta = parseInt(formData.diasAlerta) || 30

      if (valorCompra < 0 || valorVenda < 0 || estoqueMinimo < 0 || estoque < 0) {
        toast.warning('Valores inválidos', 'Valores não podem ser negativos!')
        return
      }

      if (valorVenda < valorCompra) {
        toast.warning('Preço de venda baixo', 'Valor de venda deve ser maior que o de compra!')
        return
      }

      // 🆕 VALIDAR DATA DE VALIDADE
      if (formData.temValidade && formData.dataValidade) {
        const dataValidade = new Date(formData.dataValidade)
        const hoje = new Date()
        if (dataValidade <= hoje) {
          toast.warning('Data de validade inválida', 'A data de validade deve ser futura!')
          return
        }
      }

      // Verificar código de barras duplicado
      if (formData.codigoBarras && produtos) {
        const codigoBarrasExiste = produtos.some(p =>
          p.codigoBarras === formData.codigoBarras && p.id !== editingId
        )

        if (codigoBarrasExiste) {
          toast.error('Código de barras já existe', 'Este código de barras já está sendo usado!')
          return
        }
      }

      const novoProduto: Omit<Produto, 'id'> = {
        codigo: editingId ?
          produtos?.find(p => p.id === editingId)?.codigo || gerarProximoCodigo() :
          gerarProximoCodigo(),
        nome: formData.nome,
        categoria: formData.categoria,
        codigoBarras: formData.codigoBarras,
        estoqueMinimo,
        valorCompra,
        valorVenda,
        estoque,
        ativo: true,
        dataCadastro: editingId ?
          produtos?.find(p => p.id === editingId)?.dataCadastro || new Date().toLocaleDateString('pt-BR') :
          new Date().toLocaleDateString('pt-BR'),
        userId: user.uid,
        // 🆕 CAMPOS BÁSICOS OPCIONAIS
        marca: formData.marca,
        modelo: formData.modelo,
        cor: formData.cor,
        tamanho: formData.tamanho,
        // 🆕 CAMPOS DE VALIDADE
        temValidade: formData.temValidade,
        dataValidade: formData.temValidade && formData.dataValidade ? formData.dataValidade : undefined,
        diasAlerta: formData.temValidade ? diasAlerta : undefined,
        // 🆕 CAMPOS ESPECÍFICOS
        camposEspecificos: Object.keys(camposEspecificos).length > 0 ? camposEspecificos : undefined
      }

      if (editingId) {
        await updateDocument(editingId, novoProduto)
        toast.success('Produto atualizado!', 'Dados atualizados com sucesso!')
      } else {
        await addDocument(novoProduto)
        toast.success('Produto cadastrado!', `Código ${novoProduto.codigo} criado!`)
      }

      resetForm()
    } catch (error) {
      console.error('Erro ao salvar produto:', error)
      toast.error('Erro ao salvar', 'Não foi possível salvar o produto!')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async (produto: Produto) => {
    setLoading(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 400))

      // Encontrar categoria inteligente
      const categoriaInteligente = CATEGORIAS_INTELIGENTES.find(cat => cat.nome === produto.categoria)

      setFormData({
        nome: produto.nome,
        categoria: produto.categoria,
        codigoBarras: produto.codigoBarras || '',
        estoqueMinimo: produto.estoqueMinimo.toString(),
        valorCompra: produto.valorCompra.toString(),
        valorVenda: produto.valorVenda.toString(),
        estoque: produto.estoque.toString(),
        marca: produto.marca || '',
        modelo: produto.modelo || '',
        cor: produto.cor || '',
        tamanho: produto.tamanho || '',
        temValidade: produto.temValidade || false,
        dataValidade: produto.dataValidade || '',
        diasAlerta: produto.diasAlerta?.toString() || '30'
      })

      setCategoriaSelecionada(categoriaInteligente?.id || '')
      setCamposEspecificos(produto.camposEspecificos || {})
      setEditingId(produto.id)
      setShowForm(true)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      setLoading(true)
      try {
        await deleteDocument(id)
        toast.success('Produto excluído!', 'Produto removido com sucesso!')
      } catch (error) {
        console.error('Erro ao excluir produto:', error)
        toast.error('Erro ao excluir', 'Não foi possível excluir o produto!')
      } finally {
        setLoading(false)
      }
    }
  }

  const toggleStatus = async (id: string) => {
    if (!produtos) return

    setLoading(true)
    try {
      const produto = produtos.find(p => p.id === id)
      if (!produto) return

      await updateDocument(id, { ...produto, ativo: !produto.ativo })

      const novoStatus = !produto.ativo
      toast.success(
        `Produto ${novoStatus ? 'ativado' : 'desativado'}!`,
        `Status alterado com sucesso!`
      )
    } catch (error) {
      console.error('Erro ao alterar status:', error)
      toast.error('Erro ao alterar status', 'Não foi possível alterar o status!')
    } finally {
      setLoading(false)
    }
  }

  // 🆕 FILTRAR PRODUTOS COM VALIDADE
  const produtosFiltrados = produtos ? produtos.filter(produto => {
    const matchBusca = produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
                      produto.codigo.toLowerCase().includes(busca.toLowerCase()) ||
                      produto.categoria.toLowerCase().includes(busca.toLowerCase()) ||
                      produto.codigoBarras.toLowerCase().includes(busca.toLowerCase()) ||
                      produto.marca?.toLowerCase().includes(busca.toLowerCase()) ||
                      produto.modelo?.toLowerCase().includes(busca.toLowerCase())

    const matchCategoria = filtroCategoria === '' || produto.categoria === filtroCategoria
    const matchStatus = filtroStatus === '' ||
                       (filtroStatus === 'ativo' && produto.ativo) ||
                       (filtroStatus === 'inativo' && !produto.ativo)

    // 🆕 FILTRO DE VALIDADE
    let matchValidade = true
    if (filtroValidade) {
      const validadeInfo = verificarValidade(produto)
      switch (filtroValidade) {
        case 'vencidos':
          matchValidade = validadeInfo.status === 'vencido'
          break
        case 'vencendo_hoje':
          matchValidade = validadeInfo.status === 'vence_hoje'
          break
        case 'vencendo_7_dias':
          matchValidade = validadeInfo.status === 'vence_em_7_dias'
          break
        case 'proximo_vencimento':
          matchValidade = validadeInfo.status === 'proximo_vencimento'
          break
        case 'com_validade':
          matchValidade = produto.temValidade === true
          break
        case 'sem_validade':
          matchValidade = !produto.temValidade
          break
      }
    }

    return matchBusca && matchCategoria && matchStatus && matchValidade
  }) : []

  // Obter categorias únicas para filtro
  const categoriasParaFiltro = produtos ? [...new Set(produtos.map(p => p.categoria))].filter(Boolean) : []

  // 🆕 ESTATÍSTICAS DE VALIDADE
  const estatisticasValidade = produtos ? {
    vencidos: produtos.filter(p => verificarValidade(p).status === 'vencido').length,
    vencendoHoje: produtos.filter(p => verificarValidade(p).status === 'vence_hoje').length,
    vencendoEm7Dias: produtos.filter(p => verificarValidade(p).status === 'vence_em_7_dias').length,
    proximoVencimento: produtos.filter(p => verificarValidade(p).status === 'proximo_vencimento').length,
    comValidade: produtos.filter(p => p.temValidade).length
  } : { vencidos: 0, vencendoHoje: 0, vencendoEm7Dias: 0, proximoVencimento: 0, comValidade: 0 }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <MobileHeader title="Gestão de Produtos" currentPage="/produtos" />

        <main className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">

          {/* Loading de carregamento inicial */}
          {loadingProdutos && (
            <div className="bg-white rounded-lg shadow-lg p-8 sm:p-12 mb-6">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-purple-500 border-t-transparent mb-4 sm:mb-6"></div>
                <p className="text-gray-600 font-medium text-base sm:text-lg">Carregando produtos...</p>
                <p className="text-gray-500 text-sm mt-2">Sincronizando dados do Firebase</p>
              </div>
            </div>
          )}

          {/* 🆕 ALERTAS DE VALIDADE CRÍTICOS */}
          {!loadingProdutos && (estatisticasValidade.vencidos > 0 || estatisticasValidade.vencendoHoje > 0) && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-2xl">🚨</span>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Alertas de Validade Críticos!
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc list-inside space-y-1">
                      {estatisticasValidade.vencidos > 0 && (
                        <li><strong>{estatisticasValidade.vencidos} produto(s) vencido(s)</strong></li>
                      )}
                      {estatisticasValidade.vencendoHoje > 0 && (
                        <li><strong>{estatisticasValidade.vencendoHoje} produto(s) vencendo hoje</strong></li>
                      )}
                    </ul>
                    <button
                      onClick={() => setFiltroValidade('vencidos')}
                      className="mt-2 text-red-800 underline hover:text-red-900 font-medium"
                    >
                      Filtrar produtos com problemas →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botões de ação */}
          {!loadingProdutos && (
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Controle de Produtos</h1>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                <LoadingButton
                  onClick={() => router.push('/pdv')}
                  variant="success"
                  size="md"
                  className="w-full sm:w-auto"
                >
                  🛒 PDV (Vendas)
                </LoadingButton>
                <LoadingButton
                  onClick={() => setShowForm(true)}
                  variant="primary"
                  size="md"
                  className="w-full sm:w-auto"
                >
                  ➕ Novo Produto
                </LoadingButton>
              </div>
            </div>
          )}

          {/* 🆕 FILTROS ATUALIZADOS COM VALIDADE */}
          {!loadingProdutos && (
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg mb-6">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">🔍 Filtros</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Buscar</label>
                  <input
                    type="text"
                    placeholder="Nome, código, marca, modelo..."
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    className="w-full border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm placeholder-gray-600 text-sm sm:text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Categoria</label>
                  <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    className="w-full border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm text-sm sm:text-base"
                  >
                    <option value="">Todas as categorias</option>
                    {categoriasParaFiltro.map(categoria => (
                      <option key={categoria} value={categoria}>{categoria}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Status</label>
                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    className="w-full border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm text-sm sm:text-base"
                  >
                    <option value="">Todos os status</option>
                    <option value="ativo">✅ Ativos</option>
                    <option value="inativo">❌ Inativos</option>
                  </select>
                </div>

                {/* 🆕 FILTRO DE VALIDADE */}
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-2">Validade</label>
                  <select
                    value={filtroValidade}
                    onChange={(e) => setFiltroValidade(e.target.value)}
                    className="w-full border-2 border-gray-400 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm text-sm sm:text-base"
                  >
                    <option value="">Todos os produtos</option>
                    <option value="vencidos">🚨 Vencidos</option>
                    <option value="vencendo_hoje">⏰ Vencendo hoje</option>
                    <option value="vencendo_7_dias">📅 Vencendo em 7 dias</option>
                    <option value="proximo_vencimento">⚠️ Próximo do vencimento</option>
                    <option value="com_validade">📆 Com validade</option>
                    <option value="sem_validade">♾️ Sem validade</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <LoadingButton
                    onClick={() => {
                      setBusca('')
                      setFiltroCategoria('')
                      setFiltroStatus('')
                      setFiltroValidade('')
                    }}
                    variant="secondary"
                    size="md"
                    className="w-full"
                  >
                    🧹 Limpar Filtros
                  </LoadingButton>
                </div>
              </div>
            </div>
          )}

          {/* 🆕 RESUMO DOS FILTROS COM ESTATÍSTICAS DE VALIDADE */}
          {!loadingProdutos && produtos && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                <span className="text-blue-800 font-medium text-sm sm:text-base">
                  📊 {produtosFiltrados.length} de {produtos.length} produtos
                </span>
                <div className="flex items-center space-x-4 text-xs sm:text-sm">
                  <span className="text-blue-600">📱 {produtos.filter(p => p.codigoBarras).length} com código de barras</span>
                  <span className="text-orange-600">📅 {estatisticasValidade.comValidade} com validade</span>
                  {(estatisticasValidade.vencidos + estatisticasValidade.vencendoHoje) > 0 && (
                    <span className="text-red-600 font-medium">
                      🚨 {estatisticasValidade.vencidos + estatisticasValidade.vencendoHoje} críticos
                    </span>
                  )}
                  {(busca || filtroCategoria || filtroStatus || filtroValidade) && (
                    <span className="text-blue-600">🔍 Filtros ativos</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 🆕 FORMULÁRIO ATUALIZADO COM CATEGORIAS INTELIGENTES */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center p-4 sm:p-6 border-b">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    {editingId ? '✏️ Editar Produto' : '➕ Novo Produto'}
                  </h3>
                  <button
                    onClick={resetForm}
                    className="text-gray-400 hover:text-gray-600"
                    disabled={loading}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">

                  {/* Mostrar código apenas na edição */}
                  {editingId && produtos && (
                    <div className="bg-gray-50 p-3 rounded-lg border">
                      <label className="block text-sm font-bold text-gray-800 mb-1">Código do Produto</label>
                      <p className="text-lg font-bold text-purple-600">#{produtos.find(p => p.id === editingId)?.codigo}</p>
                    </div>
                  )}

                  {/* Código automático para novos produtos */}
                  {!editingId && (
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <label className="block text-sm font-bold text-green-800 mb-1">Código Automático</label>
                      <p className="text-lg font-bold text-green-600">#{gerarProximoCodigo()}</p>
                      <p className="text-xs text-green-600">Código gerado automaticamente</p>
                    </div>
                  )}

                  {/* 🆕 SELEÇÃO DE CATEGORIA INTELIGENTE */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">🏷️ Categoria do Produto</h4>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
                      {CATEGORIAS_INTELIGENTES.map(cat => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleCategoriaChange(cat.nome)}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            formData.categoria === cat.nome
                              ? 'border-purple-500 bg-purple-50 text-purple-800'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                          disabled={loading}
                        >
                          <div className="text-2xl mb-1">{cat.icone}</div>
                          <div className="text-xs font-medium">{cat.nome}</div>
                          {cat.temValidade && (
                            <div className="text-xs text-orange-600 mt-1">📅 Com validade</div>
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Busca de categoria personalizada */}
                    <div className="border-t pt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ou busque/crie uma categoria personalizada:
                      </label>
                      <input
                        type="text"
                        placeholder="Buscar categoria..."
                        value={buscaCategoria}
                        onChange={(e) => setBuscaCategoria(e.target.value)}
                        className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm placeholder-gray-500 text-sm mb-2"
                        disabled={loading}
                      />

                      {/* Lista de categorias filtradas */}
                      <div className="border-2 border-gray-300 rounded-lg max-h-32 overflow-y-auto bg-white">
                        {obterTodasCategorias().map(categoria => (
                          <button
                            key={categoria}
                            type="button"
                            onClick={() => handleCategoriaChange(categoria)}
                            className={`w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors text-sm ${
                              formData.categoria === categoria ? 'bg-purple-100 text-purple-800 font-bold' : 'text-gray-700'
                            }`}
                            disabled={loading}
                          >
                            {categoria}
                          </button>
                        ))}

                        {/* Opção para adicionar nova categoria */}
                        {!showNovaCategoria && (
                          <button
                            type="button"
                            onClick={() => setShowNovaCategoria(true)}
                            className="w-full text-left px-3 py-2 text-green-600 hover:bg-green-50 transition-colors font-medium text-sm border-t"
                            disabled={loading}
                          >
                            ➕ Adicionar nova categoria
                          </button>
                        )}
                      </div>

                      {/* Campo para nova categoria */}
                      {showNovaCategoria && (
                        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <label className="block text-sm font-bold text-green-800 mb-2">Nova Categoria:</label>
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={novaCategoria}
                              onChange={(e) => setNovaCategoria(e.target.value)}
                              className="flex-1 border-2 border-green-400 rounded-lg px-3 py-2 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 shadow-sm text-sm"
                              placeholder="Nome da categoria"
                              disabled={loading}
                            />
                            <LoadingButton
                              type="button"
                              onClick={adicionarNovaCategoria}
                              isLoading={loading}
                              variant="success"
                              size="sm"
                            >
                              ✅
                            </LoadingButton>
                            <button
                              type="button"
                              onClick={() => {
                                setShowNovaCategoria(false)
                                setNovaCategoria('')
                              }}
                              className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                              disabled={loading}
                            >
                              ❌
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Categoria selecionada */}
                      {formData.categoria && (
                        <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                          <span className="text-sm text-purple-800">Categoria selecionada: </span>
                          <span className="font-bold text-purple-900">{formData.categoria}</span>
                          {formData.temValidade && (
                            <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                              📅 Produto com validade
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Informações Básicas */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">📝 Informações Básicas</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-800 mb-2">
                          Nome do Produto *
                        </label>
                        <input
                          type="text"
                          value={formData.nome}
                          onChange={(e) => setFormData({...formData, nome: e.target.value})}
                          className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm placeholder-gray-600 text-sm"
                          placeholder="Digite o nome do produto"
                          required
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">Marca</label>
                        <input
                          type="text"
                          value={formData.marca}
                          onChange={(e) => setFormData({...formData, marca: e.target.value})}
                          className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm text-sm"
                          placeholder="Ex: Nike, Samsung..."
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">Modelo</label>
                        <input
                          type="text"
                          value={formData.modelo}
                          onChange={(e) => setFormData({...formData, modelo: e.target.value})}
                          className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm text-sm"
                          placeholder="Ex: Air Max, Galaxy S24..."
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">Cor</label>
                        <input
                          type="text"
                          value={formData.cor}
                          onChange={(e) => setFormData({...formData, cor: e.target.value})}
                          className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm text-sm"
                          placeholder="Ex: Azul, Preto..."
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">Tamanho</label>
                        <input
                          type="text"
                          value={formData.tamanho}
                          onChange={(e) => setFormData({...formData, tamanho: e.target.value})}
                          className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm text-sm"
                          placeholder="Ex: M, 42, 500ml..."
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>

                  {/* 🆕 CAMPOS ESPECÍFICOS DA CATEGORIA */}
                  {categoriaSelecionada && buscarCategoria(categoriaSelecionada) && (
                    <CamposEspecificos
                      categoria={buscarCategoria(categoriaSelecionada)!}
                      valores={camposEspecificos}
                      onChange={handleCampoEspecifico}
                      disabled={loading}
                    />
                  )}

                  {/* 🆕 CONTROLE DE VALIDADE */}
                  {formData.temValidade && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h4 className="text-lg font-bold text-orange-900 mb-4">📅 Controle de Validade</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-orange-800 mb-2">
                            Data de Validade *
                          </label>
                          <input
                            type="date"
                            value={formData.dataValidade}
                            onChange={(e) => setFormData({...formData, dataValidade: e.target.value})}
                            className="w-full border-2 border-orange-300 rounded-lg px-3 py-2 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm text-sm"
                            required={formData.temValidade}
                            disabled={loading}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-orange-800 mb-2">
                            Alertar quantos dias antes?
                          </label>
                          <input
                            type="number"
                            value={formData.diasAlerta}
                            onChange={(e) => setFormData({...formData, diasAlerta: e.target.value})}
                            className="w-full border-2 border-orange-300 rounded-lg px-3 py-2 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 shadow-sm text-sm"
                            placeholder="30"
                            min="1"
                            disabled={loading}
                          />
                        </div>
                      </div>
                      
                      <div className="mt-3 p-3 bg-orange-100 rounded-lg">
                        <p className="text-sm text-orange-800">
                          ⚠️ <strong>Sistema de alertas:</strong> Você receberá notificações quando o produto estiver próximo do vencimento.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Código de Barras */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">📱 Código de Barras</h4>
                    
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={formData.codigoBarras}
                        onChange={(e) => setFormData({...formData, codigoBarras: e.target.value})}
                        className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm placeholder-gray-600 text-sm"
                        placeholder="Digite ou escaneie o código de barras"
                        disabled={loading}
                      />
                      <div className="flex space-x-2">
                        <LoadingButton
                          type="button"
                          onClick={iniciarScanner}
                          variant="secondary"
                          size="sm"
                          className="flex-1"
                          disabled={loading}
                        >
                          📱 Escanear
                        </LoadingButton>
                        <LoadingButton
                          type="button"
                          onClick={simularLeituraCodigoBarras}
                          variant="warning"
                          size="sm"
                          className="flex-1"
                          disabled={loading}
                        >
                          🎲 Simular
                        </LoadingButton>
                      </div>
                      <p className="text-xs text-gray-500">
                        💡 O código de barras permite vendas rápidas no PDV
                      </p>
                    </div>
                  </div>

                  {/* Preços e Estoque */}
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="text-lg font-bold text-gray-900 mb-4">💰 Preços e Estoque</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">
                          Valor de Compra
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.valorCompra}
                          onChange={(e) => setFormData({...formData, valorCompra: e.target.value})}
                          className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm placeholder-gray-600 text-sm"
                          placeholder="0.00"
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">
                          Valor de Venda
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.valorVenda}
                          onChange={(e) => setFormData({...formData, valorVenda: e.target.value})}
                          className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm placeholder-gray-600 text-sm"
                          placeholder="0.00"
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">
                          Estoque Atual
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.estoque}
                          onChange={(e) => setFormData({...formData, estoque: e.target.value})}
                          className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm placeholder-gray-600 text-sm"
                          placeholder="0"
                          disabled={loading}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-800 mb-2">
                          Estoque Mínimo
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.estoqueMinimo}
                          onChange={(e) => setFormData({...formData, estoqueMinimo: e.target.value})}
                          className="w-full border-2 border-gray-400 rounded-lg px-3 py-2 text-gray-900 font-medium bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 shadow-sm placeholder-gray-600 text-sm"
                          placeholder="0"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Cálculo de margem */}
                    {formData.valorCompra && formData.valorVenda && (
                      <div className="mt-4 bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-lg border-2 border-green-200">
                        <h5 className="font-bold text-gray-800 mb-2 text-sm">💰 Análise de Margem:</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Margem de lucro:</span>
                            <span className="font-bold text-green-600 ml-1">
                              R$ {(parseFloat(formData.valorVenda) - parseFloat(formData.valorCompra)).toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Percentual:</span>
                            <span className="font-bold text-blue-600 ml-1">
                              {(((parseFloat(formData.valorVenda) - parseFloat(formData.valorCompra)) / parseFloat(formData.valorCompra)) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botões */}
                  <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
                    <LoadingButton
                      type="submit"
                      isLoading={loading}
                      loadingText="Salvando..."
                      variant="primary"
                      size="md"
                      className="flex-1"
                    >
                      {editingId ? '💾 Atualizar' : '➕ Cadastrar'}
                    </LoadingButton>
                    <LoadingButton
                      type="button"
                      onClick={resetForm}
                      variant="secondary"
                      size="md"
                      className="flex-1"
                      disabled={loading}
                    >
                      ❌ Cancelar
                    </LoadingButton>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Scanner de Código de Barras */}
          {showScanner && (
            <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                <div className="flex justify-between items-center p-4 border-b">
                  <h3 className="text-lg font-bold text-gray-900">�� Scanner de Código de Barras</h3>
                  <button
                    onClick={pararScanner}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="p-4">
                  <div className="relative">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-64 bg-black rounded-lg"
                    />
                    <canvas ref={canvasRef} className="hidden" />

                    {/* Overlay de mira */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="border-2 border-red-500 w-48 h-24 rounded-lg"></div>
                    </div>
                  </div>

                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-600 mb-4">
                      Aponte a câmera para o código de barras
                    </p>
                    <LoadingButton
                      onClick={simularLeituraCodigoBarras}
                      variant="primary"
                      size="md"
                      className="w-full"
                    >
                      🎲 Simular Leitura (Teste)
                    </LoadingButton>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 🆕 LISTA DE PRODUTOS ATUALIZADA COM VALIDADE */}
          {!loadingProdutos && (
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">📋 Lista de Produtos</h3>
              </div>

              {produtosFiltrados.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <div className="text-4xl sm:text-6xl mb-4">📦</div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Nenhum produto encontrado</h3>
                  <p className="text-gray-500 mb-4 text-sm sm:text-base">
                    {!produtos || produtos.length === 0
                      ? 'Comece cadastrando seu primeiro produto.'
                      : 'Tente ajustar os filtros para encontrar os produtos desejados.'
                    }
                  </p>
                  <LoadingButton
                    onClick={() => setShowForm(true)}
                    variant="primary"
                    size="md"
                    className="w-full sm:w-auto"
                  >
                    ➕ Novo Produto
                  </LoadingButton>
                </div>
              ) : (
                <>
                  {/* Versão Mobile - Cards */}
                  <div className="block sm:hidden">
                    <div className="divide-y divide-gray-200">
                      {produtosFiltrados.map((produto) => {
                        const validadeInfo = verificarValidade(produto)
                        
                        return (
                          <div key={produto.id} className="p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2 mb-2">
                                  <h4 className="text-sm font-bold text-gray-900 truncate">{produto.nome}</h4>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    produto.ativo
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {produto.ativo ? '✅ Ativo' : '❌ Inativo'}
                                  </span>
                                </div>

                                <div className="space-y-1 text-xs text-gray-600">
                                  <p><span className="font-medium">Código:</span> #{produto.codigo}</p>
                                  {produto.codigoBarras && (
                                    <p><span className="font-medium">Código de Barras:</span> {produto.codigoBarras}</p>
                                  )}
                                  <p><span className="font-medium">Categoria:</span> {produto.categoria}</p>
                                  {produto.marca && (
                                    <p><span className="font-medium">Marca:</span> {produto.marca}</p>
                                  )}
                                  <p><span className="font-medium">Estoque:</span> {produto.estoque} unidades</p>
                                  <p><span className="font-medium">Compra:</span> R$ {produto.valorCompra.toFixed(2)}</p>
                                  <p><span className="font-medium">Venda:</span> R$ {produto.valorVenda.toFixed(2)}</p>
                                  
                                  {/* 🆕 INFORMAÇÕES DE VALIDADE */}
                                  {produto.temValidade && produto.dataValidade && (
                                    <p>
                                      <span className="font-medium">Validade:</span> {new Date(produto.dataValidade).toLocaleDateString('pt-BR')}
                                      {validadeInfo.diasRestantes !== null && (
                                        <span className="ml-1">
                                          ({validadeInfo.diasRestantes >= 0 ? `${validadeInfo.diasRestantes} dias` : 'Vencido'})
                                        </span>
                                      )}
                                    </p>
                                  )}
                                </div>

                                {/* Status do estoque e validade */}
                                <div className="mt-2 flex flex-wrap items-center gap-1">
                                  {produto.estoque === 0 ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      🚫 Sem estoque
                                    </span>
                                  ) : produto.estoque <= produto.estoqueMinimo ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      ⚠️ Estoque baixo
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      ✅ Estoque normal
                                    </span>
                                  )}

                                  {produto.codigoBarras && (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      📱 Com código de barras
                                    </span>
                                  )}

                                  {/* 🆕 BADGES DE VALIDADE */}
                                  {produto.temValidade && (
                                    <>
                                      {validadeInfo.status === 'vencido' && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                          🚨 Vencido
                                        </span>
                                      )}
                                      {validadeInfo.status === 'vence_hoje' && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                          ⏰ Vence hoje
                                        </span>
                                      )}
                                      {validadeInfo.status === 'vence_em_7_dias' && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                          📅 Vence em {validadeInfo.diasRestantes} dias
                                        </span>
                                      )}
                                      {validadeInfo.status === 'proximo_vencimento' && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                          ⚠️ Próximo do vencimento
                                        </span>
                                      )}
                                      {validadeInfo.status === 'valido' && (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                          📅 Válido
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Ações Mobile */}
                              <div className="flex flex-col space-y-2 ml-4">
                                <LoadingButton
                                  onClick={() => handleEdit(produto)}
                                  isLoading={loading}
                                  variant="primary"
                                  size="sm"
                                  className="text-xs px-2 py-1"
                                >
                                  ✏️
                                </LoadingButton>
                                <LoadingButton
                                  onClick={() => toggleStatus(produto.id)}
                                  isLoading={loading}
                                  variant={produto.ativo ? "warning" : "success"}
                                  size="sm"
                                  className="text-xs px-2 py-1"
                                >
                                  {produto.ativo ? '⏸️' : '▶️'}
                                </LoadingButton>
                                <LoadingButton
                                  onClick={() => handleDelete(produto.id)}
                                  isLoading={loading}
                                  variant="danger"
                                  size="sm"
                                  className="text-xs px-2 py-1"
                                >
                                  🗑️
                                </LoadingButton>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Versão Desktop - Tabela */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Produto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Categoria
                          </th>  
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Código de Barras
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estoque
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Valores
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Validade
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ações
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {produtosFiltrados.map((produto) => {
                          const validadeInfo = verificarValidade(produto)
                          
                          return (
                            <tr key={produto.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-medium text-gray-900">{produto.nome}</div>
                                  <div className="text-sm text-gray-500">
                                    #{produto.codigo}
                                    {produto.marca && ` • ${produto.marca}`}
                                    {produto.modelo && ` • ${produto.modelo}`}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {produto.categoria}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {produto.codigoBarras ? (
                                  <div>
                                    <div className="font-mono text-xs">{produto.codigoBarras}</div>
                                    <div className="text-xs text-blue-600">📱 Escaneável</div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">Não cadastrado</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  <div className="font-medium">{produto.estoque} unidades</div>
                                  <div className="text-gray-500">Mín: {produto.estoqueMinimo}</div>
                                </div>
                                <div className="mt-1">
                                  {produto.estoque === 0 ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                      🚫 Sem estoque
                                    </span>
                                  ) : produto.estoque <= produto.estoqueMinimo ? (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                      ⚠️ Estoque baixo
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      ✅ Normal
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div>Compra: R$ {produto.valorCompra.toFixed(2)}</div>
                                <div>Venda: R$ {produto.valorVenda.toFixed(2)}</div>
                              </td>
                              
                              {/* 🆕 COLUNA DE VALIDADE */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                {produto.temValidade && produto.dataValidade ? (
                                  <div>
                                    <div className="text-sm text-gray-900">
                                      {new Date(produto.dataValidade).toLocaleDateString('pt-BR')}
                                    </div>
                                    <div className="mt-1">
                                      {validadeInfo.status === 'vencido' && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                          🚨 Vencido
                                        </span>
                                      )}
                                      {validadeInfo.status === 'vence_hoje' && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                          ⏰ Vence hoje
                                        </span>
                                      )}
                                      {validadeInfo.status === 'vence_em_7_dias' && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                          📅 {validadeInfo.diasRestantes} dias
                                        </span>
                                      )}
                                      {validadeInfo.status === 'proximo_vencimento' && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                          ⚠️ {validadeInfo.diasRestantes} dias
                                        </span>
                                      )}
                                      {validadeInfo.status === 'valido' && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                          ✅ Válido
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-gray-400 text-sm">Sem validade</span>
                                )}
                              </td>
                              
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  produto.ativo
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {produto.ativo ? '✅ Ativo' : '❌ Inativo'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <LoadingButton
                                    onClick={() => handleEdit(produto)}
                                    isLoading={loading}
                                    variant="primary"
                                    size="sm"
                                  >
                                    ✏️
                                  </LoadingButton>
                                  <LoadingButton
                                    onClick={() => toggleStatus(produto.id)}
                                    isLoading={loading}
                                    variant={produto.ativo ? "warning" : "success"}
                                    size="sm"
                                  >
                                    {produto.ativo ? '⏸️' : '▶️'}
                                  </LoadingButton>
                                  <LoadingButton
                                    onClick={() => handleDelete(produto.id)}
                                    isLoading={loading}
                                    variant="danger"
                                    size="sm"
                                  >
                                    🗑️
                                  </LoadingButton>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 🆕 ESTATÍSTICAS ATUALIZADAS COM VALIDADE */}
          {!loadingProdutos && produtos && produtos.length > 0 && (
            <div className="mt-6 sm:mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 sm:p-6 border border-purple-200">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">📊 Resumo dos Produtos</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center p-3 bg-white rounded-lg shadow">
                  <div className="text-xl sm:text-2xl font-bold text-blue-600">{produtos.filter(p => p.ativo).length}</div>
                  <div className="text-blue-600 text-xs sm:text-sm font-medium">Produtos Ativos</div>
                </div>

                <div className="text-center p-3 bg-white rounded-lg shadow">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">{produtos.filter(p => p.codigoBarras).length}</div>
                  <div className="text-green-600 text-xs sm:text-sm font-medium">Com Código de Barras</div>
                </div>

                <div className="text-center p-3 bg-white rounded-lg shadow">
                  <div className="text-xl sm:text-2xl font-bold text-red-600">{produtos.filter(p => p.estoque === 0).length}</div>
                  <div className="text-red-600 text-xs sm:text-sm font-medium">Sem Estoque</div>
                </div>

                <div className="text-center p-3 bg-white rounded-lg shadow">
                  <div className="text-xl sm:text-2xl font-bold text-yellow-600">{produtos.filter(p => p.estoque <= p.estoqueMinimo && p.estoque > 0).length}</div>
                  <div className="text-yellow-600 text-xs sm:text-sm font-medium">Estoque Baixo</div>
                </div>

                {/* 🆕 ESTATÍSTICAS DE VALIDADE */}
                <div className="text-center p-3 bg-white rounded-lg shadow">
                  <div className="text-xl sm:text-2xl font-bold text-orange-600">{estatisticasValidade.comValidade}</div>
                  <div className="text-orange-600 text-xs sm:text-sm font-medium">Com Validade</div>
                </div>

                <div className="text-center p-3 bg-white rounded-lg shadow">
                  <div className="text-lg sm:text-xl font-bold text-purple-600">
                    R$ {produtos.filter(p => p.ativo).reduce((total, p) => total + (p.estoque * p.valorCompra), 0).toFixed(2)}
                  </div>
                  <div className="text-purple-600 text-xs sm:text-sm font-medium">Valor Estoque</div>
                </div>
              </div>

              {/* 🆕 ALERTAS DE VALIDADE NO RESUMO */}
              {(estatisticasValidade.vencidos > 0 || estatisticasValidade.vencendoHoje > 0 || estatisticasValidade.vencendoEm7Dias > 0) && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">🚨 Alertas de Validade:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    {estatisticasValidade.vencidos > 0 && (
                      <div className="text-red-700">
                        <strong>{estatisticasValidade.vencidos}</strong> produto(s) vencido(s)
                      </div>
                    )}
                    {estatisticasValidade.vencendoHoje > 0 && (
                      <div className="text-orange-700">
                        <strong>{estatisticasValidade.vencendoHoje}</strong> vencendo hoje
                      </div>
                    )}
                    {estatisticasValidade.vencendoEm7Dias > 0 && (
                      <div className="text-yellow-700">
                        <strong>{estatisticasValidade.vencendoEm7Dias}</strong> vencendo em 7 dias
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 🆕 INFORMAÇÕES SOBRE SISTEMA INTELIGENTE */}
          <div className="mt-6 sm:mt-8 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="text-xl sm:text-2xl">🧠</div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Sistema Inteligente de Categorias
                </h3>
                <div className="mt-2 text-xs sm:text-sm text-blue-700 space-y-1">
                  <p>• <strong>Categorias inteligentes</strong> com campos específicos para cada tipo de produto</p>
                  <p>• <strong>Controle automático de validade</strong> para produtos perecíveis</p>
                  <p>• <strong>Alertas personalizáveis</strong> de vencimento por categoria</p>
                  <p>• <strong>Campos dinâmicos</strong> que se adaptam ao tipo de negócio</p>
                  <p>• <strong>Compatível</strong> com farmácias, adegas, roupas, eletrônicos e muito mais</p>
                  <p>• <strong>Scanner de código de barras</strong> integrado para cadastro rápido</p>
                </div>
              </div>
            </div>
          </div>

          {/* Informações sobre Código de Barras */}
          <div className="mt-6 sm:mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="text-xl sm:text-2xl">💡</div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Sistema de Código de Barras
                </h3>
                <div className="mt-2 text-xs sm:text-sm text-blue-700 space-y-1">
                  <p>• <strong>Cadastre códigos de barras</strong> nos produtos para vendas mais rápidas</p>
                  <p>• <strong>Use a câmera</strong> do celular/computador para escanear códigos</p>
                  <p>• <strong>Compatível com leitores físicos</strong> quando conectados ao computador</p>
                  <p>• <strong>PDV otimizado</strong> para vendas com código de barras</p>
                  <p>• <strong>Busca inteligente</strong> por código de barras nos filtros</p>
                  <p>• <strong>Dados sincronizados</strong> em tempo real com o Firebase</p>
                </div>
              </div>
            </div>
          </div>

        </main>
      </div>
    </ProtectedRoute>
  )
}