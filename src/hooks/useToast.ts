'use client'
import { useState, useCallback } from 'react'
import { ToastData } from '@/components/Toast'

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newToast: ToastData = { ...toast, id }
    
    setToasts(prev => [...prev, newToast])
    
    return id
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  // Funções de conveniência
  const success = useCallback((title: string, message: string, options?: Partial<ToastData>) => {
    return addToast({
      type: 'success',
      title,
      message,
      duration: 4000,
      ...options
    })
  }, [addToast])

  const error = useCallback((title: string, message: string, options?: Partial<ToastData>) => {
    return addToast({
      type: 'error',
      title,
      message,
      duration: 6000,
      ...options
    })
  }, [addToast])

  const warning = useCallback((title: string, message: string, options?: Partial<ToastData>) => {
    return addToast({
      type: 'warning',
      title,
      message,
      duration: 5000,
      ...options
    })
  }, [addToast])

  const info = useCallback((title: string, message: string, options?: Partial<ToastData>) => {
    return addToast({
      type: 'info',
      title,
      message,
      duration: 4000,
      ...options
    })
  }, [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info
  }
}