'use client'
import { createContext, useContext, ReactNode } from 'react'
import { useToast } from '@/hooks/useToast'
import ToastContainer, { ToastData } from './Toast'

interface ToastContextType {
  success: (title: string, message: string, options?: Partial<ToastData>) => string
  error: (title: string, message: string, options?: Partial<ToastData>) => string
  warning: (title: string, message: string, options?: Partial<ToastData>) => string
  info: (title: string, message: string, options?: Partial<ToastData>) => string
  addToast: (toast: Omit<ToastData, 'id'>) => string
  removeToast: (id: string) => void
  clearAllToasts: () => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const toast = useToast()

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toast.toasts} onRemove={toast.removeToast} />
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
}