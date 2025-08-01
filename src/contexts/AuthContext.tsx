'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  UserCredential
} from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<UserCredential>
  register: (email: string, password: string) => Promise<UserCredential>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      console.log('⚠️ Firebase Auth não está disponível')
      setLoading(false)
      return
    }

    console.log('🔥 Configurando listener de autenticação...')
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('👤 Estado de autenticação mudou:', user ? 'Logado' : 'Deslogado')
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const login = async (email: string, password: string): Promise<UserCredential> => {
    if (!auth) {
      console.log('❌ Firebase Auth não inicializado para login')
      throw new Error('Firebase não inicializado')
    }
    
    console.log('🔑 Tentando fazer login...')
    const result = await signInWithEmailAndPassword(auth, email, password)
    console.log('✅ Login realizado com sucesso!')
    return result
  }

  const register = async (email: string, password: string): Promise<UserCredential> => {
    if (!auth) {
      console.log('❌ Firebase Auth não inicializado para registro')
      throw new Error('Firebase não inicializado')
    }
    
    console.log('📝 Tentando criar conta...')
    const result = await createUserWithEmailAndPassword(auth, email, password)
    console.log('✅ Conta criada com sucesso!')
    return result
  }

  const logout = async (): Promise<void> => {
    if (!auth) {
      console.log('❌ Firebase Auth não inicializado para logout')
      throw new Error('Firebase não inicializado')
    }
    
    console.log('🚪 Fazendo logout...')
    await signOut(auth)
    console.log('✅ Logout realizado!')
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}