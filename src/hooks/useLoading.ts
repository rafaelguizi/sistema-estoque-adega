'use client'
import { useState, useCallback } from 'react'

type LoadingStates = Record<string, boolean>

export function useLoading() {
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({})

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }))
  }, [])

  const isLoading = useCallback((key?: string) => {
    if (!key) {
      return Object.values(loadingStates).some(Boolean)
    }
    return loadingStates[key] || false
  }, [loadingStates])

  const withLoading = useCallback(async <T>(
    key: string,
    asyncFn: () => Promise<T>
  ): Promise<T> => {
    setLoading(key, true)
    try {
      return await asyncFn()
    } finally {
      setLoading(key, false)
    }
  }, [setLoading])

  return {
    isLoading,
    setLoading,
    withLoading,
    loadingStates
  }
}