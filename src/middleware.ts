import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback-secret')

export async function middleware(request: NextRequest) {
  // Rotas públicas que não precisam de autenticação
  const publicPaths = ['/login', '/register', '/api/auth/login', '/api/auth/register']
  
  if (publicPaths.includes(request.nextUrl.pathname)) {
    return NextResponse.next()
  }

  // Verificar token de autenticação
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const { payload } = await jwtVerify(token, secret)
    
    // Verificar status da empresa
    if (payload.companyStatus === 'SUSPENDED') {
      return NextResponse.redirect(new URL('/suspended', request.url))
    }

    // Adicionar dados do usuário ao header para uso nas páginas
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', payload.userId as string)
    requestHeaders.set('x-company-id', payload.companyId as string)
    requestHeaders.set('x-user-role', payload.role as string)

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}