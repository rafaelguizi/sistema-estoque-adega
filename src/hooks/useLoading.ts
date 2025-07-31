'use client'
import { useState } from 'react'

export function useLoading() {
  const [loadingStates, setLoadingStates] = useState<{ [key: string]: boolean }>({})

  const setLoading = (key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }))
  }

  const isLoading = (key: string) => {
    return loadingStates[key] || false
  }

  const withLoading = async <T>(key: string, asyncFunction: () => Promise<T>): Promise<T> => {
    setLoading(key, true)
    try {
      const result = await asyncFunction()
      return result
    } finally {
      setLoading(key, false)
    }
  }

  return {
    setLoading,
    isLoading,
    withLoading
  }
}