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
  const [auth, setAuth] = useState<any>(null)

  useEffect(() => {
    // Importar Firebase apenas no cliente
    const initAuth = async () => {
      try {
        const { auth: firebaseAuth } = await import('@/lib/firebase')
        setAuth(firebaseAuth)

        if (!firebaseAuth) {
          console.log('⚠️ Firebase Auth não está disponível')
          setLoading(false)
          return
        }

        console.log('🔥 Configurando listener de autenticação...')
        const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
          console.log('👤 Estado de autenticação mudou:', user ? 'Logado' : 'Deslogado')
          setUser(user)
          setLoading(false)
        })

        return unsubscribe
      } catch (error) {
        console.error('❌ Erro ao inicializar Auth:', error)
        setLoading(false)
      }
    }

    initAuth()
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