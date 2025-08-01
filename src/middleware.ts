import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rotas públicas que não precisam de autenticação
  const publicPaths = [
    '/login', 
    '/register', 
    '/admin',
    '/api/auth/login', 
    '/api/auth/register'
  ]
  
  // Se for uma rota pública, permitir acesso
  if (publicPaths.includes(pathname)) {
    return NextResponse.next()
  }

  // Para rotas protegidas, deixar o cliente verificar autenticação
  // (Firebase Auth funciona melhor no lado do cliente)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}