'use client'
import { useState, useEffect } from 'react'
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc,
  deleteDoc, 
  query, 
  where,
  Timestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

export function useFirestore<T>(collectionName: string) {
  const { user } = useAuth()
  const [data, setData] = useState<T[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      setData([])
      setLoading(false)
      return
    }

    loadData()
  }, [user, collectionName])

  const loadData = async () => {
    if (!user || !db) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const q = query(
        collection(db, collectionName),
        where('userId', '==', user.uid)
      )
      
      const querySnapshot = await getDocs(q)
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[]
      
      // Ordenar no cliente por dataCadastro
      const sortedItems = items.sort((a: any, b: any) => {
        const dateA = new Date(a.dataCadastro || 0)
        const dateB = new Date(b.dataCadastro || 0)
        return dateB.getTime() - dateA.getTime()
      })
      
      setData(sortedItems)
    } catch (error) {
      console.error('Erro ao carregar dados do Firestore:', error)
      setError('Erro ao carregar dados')
      setData([])
    } finally {
      setLoading(false)
    }
  }

  const addDocument = async (item: any) => {
    if (!user || !db) {
      throw new Error('Usuário não autenticado ou Firebase não inicializado')
    }

    try {
      const docRef = doc(collection(db, collectionName))
      
      const newItemData = {
        ...item,
        id: docRef.id,
        userId: user.uid,
        dataCadastro: item.dataCadastro || new Date().toLocaleDateString('pt-BR'),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      }

      await setDoc(docRef, newItemData)
      setData(prev => prev ? [newItemData, ...prev] : [newItemData])
      
      return newItemData
    } catch (error) {
      console.error('Erro ao adicionar documento:', error)
      throw new Error('Erro ao salvar dados')
    }
  }

  const updateDocument = async (id: string, updates: any) => {
    if (!user || !db) {
      throw new Error('Usuário não autenticado ou Firebase não inicializado')
    }

    try {
      const docRef = doc(db, collectionName, id)
      
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now()
      }
      
      await updateDoc(docRef, updateData)
      
      setData(prev => prev ? prev.map((item: any) => 
        item.id === id ? { ...item, ...updateData } : item
      ) : [])
    } catch (error) {
      console.error('Erro ao atualizar documento:', error)
      throw new Error('Erro ao atualizar dados')
    }
  }

  const deleteDocument = async (id: string) => {
    if (!user || !db) {
      throw new Error('Usuário não autenticado ou Firebase não inicializado')
    }

    try {
      await deleteDoc(doc(db, collectionName, id))
      setData(prev => prev ? prev.filter((item: any) => item.id !== id) : [])
    } catch (error) {
      console.error('Erro ao deletar documento:', error)
      throw new Error('Erro ao deletar dados')
    }
  }

  return {
    data,
    loading,
    error,
    addDocument,
    updateDocument,
    deleteDocument,
    refresh: loadData
  }
}