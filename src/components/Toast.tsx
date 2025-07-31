'use client'
import { useEffect, useCallback } from 'react'

export interface ToastData {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
}

interface ToastProps {
  toast: ToastData
  onRemove: (id: string) => void
}

export default function Toast({ toast, onRemove }: ToastProps) {
  const handleRemove = useCallback(() => {
    onRemove(toast.id)
  }, [toast.id, onRemove])

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(handleRemove, toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast.duration, handleRemove])

  const getToastStyles = () => {
    const baseStyles = "transform transition-all duration-300 ease-in-out"
    
    switch (toast.type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-l-4 border-green-400 text-green-800`
      case 'error':
        return `${baseStyles} bg-red-50 border-l-4 border-red-400 text-red-800`
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800`
      case 'info':
        return `${baseStyles} bg-blue-50 border-l-4 border-blue-400 text-blue-800`
      default:
        return `${baseStyles} bg-gray-50 border-l-4 border-gray-400 text-gray-800`
    }
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✅'
      case 'error':
        return '❌'
      case 'warning':
        return '⚠️'
      case 'info':
        return 'ℹ️'
      default:
        return '📢'
    }
  }

  return (
    <div className={`${getToastStyles()} p-4 rounded-lg shadow-lg mb-3 max-w-sm w-full`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-xl mr-3">{getIcon()}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold truncate">
            {toast.title}
          </p>
          <p className="text-sm mt-1 break-words">
            {toast.message}
          </p>
        </div>
        <div className="flex-shrink-0 ml-3">
          <button
            onClick={handleRemove}
            className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors duration-150"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}