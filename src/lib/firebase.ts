import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getAuth, Auth } from 'firebase/auth'
import { getFirestore, Firestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Variáveis para armazenar as instâncias
let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

// Função para validar configuração
function validateFirebaseConfig() {
  const requiredFields = [
    'apiKey',
    'authDomain', 
    'projectId',
    'storageBucket',
    'messagingSenderId',
    'appId'
  ]

  const missingFields = requiredFields.filter(field => !firebaseConfig[field as keyof typeof firebaseConfig])
  
  if (missingFields.length > 0) {
    console.error('❌ Variáveis de ambiente Firebase faltando:', missingFields)
    return false
  }

  return true
}

// Função para inicializar Firebase apenas no cliente
function initializeFirebase() {
  if (typeof window === 'undefined') {
    // Estamos no servidor, não inicializar
    console.log('🔒 Firebase: Execução no servidor, pulando inicialização')
    return { app: null, auth: null, db: null }
  }

  if (!validateFirebaseConfig()) {
    console.warn('⚠️ Configurações do Firebase inválidas ou incompletas')
    return { app: null, auth: null, db: null }
  }

  try {
    // Evitar múltiplas inicializações
    if (getApps().length === 0) {
      app = initializeApp(firebaseConfig)
      console.log('🔥 Firebase inicializado com sucesso')
    } else {
      app = getApps()[0]
      console.log('🔥 Firebase já estava inicializado')
    }

    auth = getAuth(app)
    db = getFirestore(app)

    console.log('✅ Serviços Firebase configurados:', {
      hasAuth: !!auth,
      hasDb: !!db,
      projectId: firebaseConfig.projectId,
      environment: process.env.NODE_ENV
    })

    return { app, auth, db }
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error)
    return { app: null, auth: null, db: null }
  }
}

// Inicializar apenas no cliente
if (typeof window !== 'undefined') {
  const firebase = initializeFirebase()
  app = firebase.app
  auth = firebase.auth
  db = firebase.db
}

export { auth, db }
export default app