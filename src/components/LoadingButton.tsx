'use client'
import { ReactNode, ButtonHTMLAttributes } from 'react'

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  loadingText?: string
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'warning' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
}

export default function LoadingButton({
  isLoading = false,
  loadingText = 'Carregando...',
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...props
}: LoadingButtonProps) {
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 border-blue-600 hover:border-blue-700 focus:ring-blue-500 disabled:bg-blue-400',
    secondary: 'bg-white text-blue-600 hover:bg-gray-100 border-gray-300 hover:border-gray-400 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-400',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 border-yellow-500 hover:border-yellow-600 focus:ring-yellow-500 disabled:bg-yellow-400',
    danger: 'bg-red-600 text-white hover:bg-red-700 border-red-600 hover:border-red-700 focus:ring-red-500 disabled:bg-red-400',
    success: 'bg-green-600 text-white hover:bg-green-700 border-green-600 hover:border-green-700 focus:ring-green-500 disabled:bg-green-400'
  }
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }
  
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
  
  const variantClasses = variants[variant]
  const sizeClasses = sizes[size]
  
  const finalClassName = `${baseClasses} ${variantClasses} ${sizeClasses} ${className}`
  
  return (
    <button
      className={finalClassName}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {isLoading ? loadingText : children}
    </button>
  )
}