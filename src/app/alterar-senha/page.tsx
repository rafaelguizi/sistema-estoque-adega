'use client'
import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToastContext } from '@/components/ToastProvider'
import LoadingButton from '@/components/LoadingButton'

// Componente de Loading
function AlterarSenhaLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando...</p>
      </div>
    </div>
  )
}

// Componente principal
function AlterarSenhaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const toast = useToastContext()
  
  const [loading, setLoading] = useState(false)
  const [obrigatorio, setObrigatorio] = useState(false)
  const [formData, setFormData] = useState({
    novaSenha: '',
    confirmarSenha: ''
  })
  const [validacao, setValidacao] = useState({
    tamanho: false,
    maiuscula: false,
    minuscula: false,
    numero: false,
    especial: false
  })

  useEffect(() => {
    const isObrigatorio = searchParams.get('obrigatorio') === 'true'
    setObrigatorio(isObrigatorio)
  }, [searchParams])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Validar senha em tempo real
    if (field === 'novaSenha') {
      setValidacao({
        tamanho: value.length >= 8,
        maiuscula: /[A-Z]/.test(value),
        minuscula: /[a-z]/.test(value),
        numero: /[0-9]/.test(value),
        especial: /[!@#$%^&*(),.?":{}|<>]/.test(value)
      })
    }
  }

  const handleAlterarSenha = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.novaSenha || !formData.confirmarSenha) {
      toast.error('Campos obrigatórios', 'Preencha todos os campos')
      return
    }

    if (formData.novaSenha !== formData.confirmarSenha) {
      toast.error('Senhas diferentes', 'As senhas não coincidem')
      return
    }

    const todasValidacoes = Object.values(validacao).every(v => v)
    if (!todasValidacoes) {
      toast.error('Senha inválida', 'A senha não atende aos critérios de segurança')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/alterar-senha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao alterar senha')
      }

      console.log('✅ Senha alterada com sucesso')
      toast.success('Senha alterada!', 'Sua senha foi atualizada com sucesso')
      
      // Redirecionar para dashboard
      setTimeout(() => {
        router.push('/dashboard')
      }, 1500)

    } catch (error: any) {
      console.error('❌ Erro ao alterar senha:', error)
      toast.error('Erro', error.message)
    } finally {
      setLoading(false)
    }
  }

  const voltarLogin = () => {
    if (obrigatorio) {
      toast.warning('Alteração obrigatória', 'Você deve alterar sua senha antes de continuar')
      return
    }
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mb-4">
            <span className="text-white font-bold text-2xl">🔐</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {obrigatorio ? 'Alterar Senha Obrigatória' : 'Alterar Senha'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {obrigatorio 
              ? 'Por segurança, você deve alterar sua senha temporária'
              : 'Defina uma nova senha para sua conta'
            }
          </p>
          
          {obrigatorio && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Primeiro acesso detectado!</strong> Altere sua senha antes de continuar.
              </p>
            </div>
          )}
        </div>

        {/* Formulário */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleAlterarSenha} className="space-y-6">
            
            {/* Nova Senha */}
            <div>
              <label htmlFor="novaSenha" className="block text-sm font-medium text-gray-700 mb-2">
                Nova Senha
              </label>
              <input
                id="novaSenha"
                type="password"
                value={formData.novaSenha}
                onChange={(e) => handleInputChange('novaSenha', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                placeholder="Digite sua nova senha"
                disabled={loading}
                required
              />
            </div>

            {/* Confirmar Senha */}
            <div>
              <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700 mb-2">
                Confirmar Nova Senha
              </label>
              <input
                id="confirmarSenha"
                type="password"
                value={formData.confirmarSenha}
                onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 placeholder-gray-500"
                placeholder="Confirme sua nova senha"
                disabled={loading}
                required
              />
            </div>

            {/* Critérios de Validação */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Critérios de Segurança:</h4>
              <div className="space-y-2 text-sm">
                <div className={`flex items-center ${validacao.tamanho ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className="mr-2">{validacao.tamanho ? '✅' : '⭕'}</span>
                  Pelo menos 8 caracteres
                </div>
                <div className={`flex items-center ${validacao.maiuscula ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className="mr-2">{validacao.maiuscula ? '✅' : '⭕'}</span>
                  Uma letra maiúscula (A-Z)
                </div>
                <div className={`flex items-center ${validacao.minuscula ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className="mr-2">{validacao.minuscula ? '✅' : '⭕'}</span>
                  Uma letra minúscula (a-z)
                </div>
                <div className={`flex items-center ${validacao.numero ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className="mr-2">{validacao.numero ? '✅' : '⭕'}</span>
                  Um número (0-9)
                </div>
                <div className={`flex items-center ${validacao.especial ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className="mr-2">{validacao.especial ? '✅' : '⭕'}</span>
                  Um caractere especial (!@#$%...)
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="space-y-3">
              <LoadingButton
                type="submit"
                isLoading={loading}
                loadingText="Alterando..."
                variant="primary"
                size="lg"
                className="w-full"
                disabled={!Object.values(validacao).every(v => v) || formData.novaSenha !== formData.confirmarSenha}
              >
                🔐 Alterar Senha
              </LoadingButton>
              
              {!obrigatorio && (
                <button
                  type="button"
                  onClick={voltarLogin}
                  className="w-full px-4 py-2 text-gray-600 hover:text-gray-700 text-sm"
                  disabled={loading}
                >
                  ← Voltar ao Login
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Componente principal exportado
export default function AlterarSenhaPage() {
  return (
    <Suspense fallback={<AlterarSenhaLoading />}>
      <AlterarSenhaContent />
    </Suspense>
  )
}