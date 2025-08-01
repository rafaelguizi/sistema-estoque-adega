'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import LoadingButton from '@/components/LoadingButton'

interface MotivoErro {
  titulo: string
  descricao: string
  emoji: string
  solucao: string[]
}

export default function PagamentoErroPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [motivoErro, setMotivoErro] = useState<MotivoErro | null>(null)

  const motivosErro: Record<string, MotivoErro> = {
    rejected: {
      titulo: 'Pagamento Rejeitado',
      descricao: 'Seu pagamento foi recusado pela operadora',
      emoji: '❌',
      solucao: [
        'Verifique os dados do cartão',
        'Confirme se há limite disponível',
        'Tente outro cartão ou método de pagamento',
        'Entre em contato com seu banco'
      ]
    },
    cancelled: {
      titulo: 'Pagamento Cancelado',
      descricao: 'O pagamento foi cancelado durante o processo',
      emoji: '🚫',
      solucao: [
        'Tente novamente quando estiver pronto',
        'Verifique sua conexão com a internet',
        'Use outro método de pagamento',
        'Entre em contato conosco se o problema persistir'
      ]
    },
    pending: {
      titulo: 'Pagamento Pendente',
      descricao: 'Seu pagamento está sendo processado',
      emoji: '⏳',
      solucao: [
        'Aguarde a confirmação do pagamento',
        'Verifique seu email em algumas horas',
        'O processo pode levar até 24 horas',
        'Entraremos em contato quando confirmado'
      ]
    },
    timeout: {
      titulo: 'Tempo Esgotado',
      descricao: 'O tempo limite para pagamento foi excedido',
      emoji: '⏰',
      solucao: [
        'Inicie o processo novamente',
        'Complete o pagamento mais rapidamente',
        'Verifique sua conexão com a internet',
        'Tente em outro dispositivo'
      ]
    },
    error: {
      titulo: 'Erro no Sistema',
      descricao: 'Ocorreu um erro técnico durante o processamento',
      emoji: '🔧',
      solucao: [
        'Tente novamente em alguns minutos',
        'Limpe o cache do navegador',
        'Use outro navegador',
        'Entre em contato com nosso suporte'
      ]
    },
    default: {
      titulo: 'Erro no Pagamento',
      descricao: 'Não foi possível processar seu pagamento',
      emoji: '⚠️',
      solucao: [
        'Verifique os dados informados',
        'Tente outro método de pagamento',
        'Entre em contato conosco',
        'Nosso suporte está disponível 24/7'
      ]
    }
  }

  useEffect(() => {
    const motivo = searchParams.get('motivo') || 'default'
    setMotivoErro(motivosErro[motivo] || motivosErro.default)
  }, [searchParams])

  const tentarNovamente = () => {
    router.push('/vendas')
  }

  const entrarContato = () => {
    // Abrir WhatsApp ou email
    window.open('https://wa.me/5511999999999?text=Olá, tive problemas com o pagamento do StockPro', '_blank')
  }

  if (!motivoErro) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header de Erro */}
        <div className="text-center mb-12">
          <div className="text-6xl mb-4">{motivoErro.emoji}</div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {motivoErro.titulo}
          </h1>
          <p className="text-xl text-gray-600">
            {motivoErro.descricao}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* O que aconteceu */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-3">🤔</span>
              O que aconteceu?
            </h2>
            
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-900 mb-2">Detalhes do Problema</h3>
                <p className="text-red-700">{motivoErro.descricao}</p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📋 Informações Técnicas</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p><strong>Horário:</strong> {new Date().toLocaleString('pt-BR')}</p>
                  <p><strong>Motivo:</strong> {searchParams.get('motivo') || 'Não especificado'}</p>
                  <p><strong>ID da Sessão:</strong> {Date.now().toString(36).toUpperCase()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Soluções */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <span className="mr-3">💡</span>
              Como resolver?
            </h2>
            
            <div className="space-y-4">
              {motivoErro.solucao.map((solucao, index) => (
                <div key={index} className="flex items-start">
                  <span className="bg-blue-100 text-blue-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                    {index + 1}
                  </span>
                  <p className="text-gray-700">{solucao}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">💬 Ainda com problemas?</h4>
                <p className="text-sm text-yellow-700 mb-3">
                  Nossa equipe está pronta para te ajudar a resolver qualquer questão.
                </p>
                <LoadingButton
                  onClick={entrarContato}
                  variant="warning"
                  size="sm"
                  className="w-full"
                >
                  📱 Falar com Suporte
                </LoadingButton>
              </div>
            </div>
          </div>
        </div>

        {/* Métodos de Pagamento Alternativos */}
        <div className="bg-white rounded-xl shadow-lg p-8 mt-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="mr-3">💳</span>
            Outros Métodos de Pagamento
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
              <div className="text-4xl mb-3">💳</div>
              <h3 className="font-semibold text-gray-900 mb-2">Cartão de Crédito</h3>
              <p className="text-sm text-gray-600">
                Visa, Mastercard, Elo, American Express
              </p>
            </div>
            
            <div className="text-center p-6 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
              <div className="text-4xl mb-3">📱</div>
              <h3 className="font-semibold text-gray-900 mb-2">PIX</h3>
              <p className="text-sm text-gray-600">
                Pagamento instantâneo e seguro
              </p>
            </div>
            
            <div className="text-center p-6 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
              <div className="text-4xl mb-3">🧾</div>
              <h3 className="font-semibold text-gray-900 mb-2">Boleto</h3>
              <p className="text-sm text-gray-600">
                Vencimento em até 3 dias úteis
              </p>
            </div>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <LoadingButton
            onClick={tentarNovamente}
            variant="primary"
            size="lg"
            className="px-8 py-4"
          >
            🔄 Tentar Novamente
          </LoadingButton>
          
          <LoadingButton
            onClick={entrarContato}
            variant="secondary"
            size="lg"
            className="px-8 py-4"
          >
            💬 Falar com Suporte
          </LoadingButton>
        </div>

        {/* FAQ Rápido */}
        <div className="bg-gray-100 rounded-xl p-8 mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
            ❓ Perguntas Frequentes sobre Pagamentos
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Meu cartão foi recusado, e agora?</h4>
              <p className="text-sm text-gray-600">
                Verifique os dados, limite disponível e tente outro cartão. 
                Se persistir, entre em contato com seu banco.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Quanto tempo leva para processar?</h4>
              <p className="text-sm text-gray-600">
                Cartão é instantâneo, PIX até 2 horas, boleto até 24 horas após pagamento.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Posso mudar o método de pagamento?</h4>
              <p className="text-sm text-gray-600">
                Sim! Você pode escolher outro método ao tentar novamente.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Meus dados estão seguros?</h4>
              <p className="text-sm text-gray-600">
                Sim! Usamos criptografia de ponta e o Mercado Pago para máxima segurança.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}