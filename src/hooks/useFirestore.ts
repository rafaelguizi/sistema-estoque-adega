import { useState, useEffect } from 'react'
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy 
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

export function useFirestore<T>(collectionName: string) {
  const { user } = useAuth()
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setData([])
      setLoading(false)
      return
    }

    loadData()
  }, [user, collectionName])

  const loadData = async () => {
    if (!user) return

    try {
      setLoading(true)
      const q = query(
        collection(db, collectionName),
        where('userId', '==', user.uid),
        orderBy('dataCadastro', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[]
      
      setData(items)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const addItem = async (item: any) => {
    if (!user) return

    const docRef = doc(collection(db, collectionName))
    const newItem = {
      ...item,
      id: docRef.id,
      userId: user.uid,
      dataCadastro: new Date().toISOString()
    }

    await setDoc(docRef, newItem)
    setData(prev => [newItem, ...prev])
    return newItem
  }

  const updateItem = async (id: string, updates: any) => {
    if (!user) return

    const docRef = doc(db, collectionName, id)
    const updatedItem = { ...updates, userId: user.uid }
    
    await setDoc(docRef, updatedItem, { merge: true })
    setData(prev => prev.map(item => 
      (item as any).id === id ? { ...item, ...updatedItem } : item
    ))
  }

  const deleteItem = async (id: string) => {
    if (!user) return

    await deleteDoc(doc(db, collectionName, id))
    setData(prev => prev.filter(item => (item as any).id !== id))
  }

  return {
    data,
    loading,
    addItem,
    updateItem,
    deleteItem,
    refresh: loadData
  }
}