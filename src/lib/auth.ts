import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'sua-chave-secreta-super-segura'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: string
  companyId: string
  companyName: string
  primeiroAcesso: boolean
  senhaTemporaria: boolean
  plan: string
}

// Gerar hash da senha
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

// Verificar senha
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

// Gerar JWT token
export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      companyId: user.companyId,
      primeiroAcesso: user.primeiroAcesso,
      senhaTemporaria: user.senhaTemporaria
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  )
}

// Verificar JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    return null
  }
}

// Autenticar usuário
export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { 
        company: true 
      }
    })

    if (!user) {
      return null
    }

    const senhaValida = await verifyPassword(password, user.password)
    if (!senhaValida) {
      return null
    }

    // Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: { ultimoLogin: new Date() }
    })

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      companyName: user.company.name,
      primeiroAcesso: user.primeiroAcesso,
      senhaTemporaria: user.senhaTemporaria,
      plan: user.company.plan
    }
  } catch (error) {
    console.error('Erro na autenticação:', error)
    return null
  }
}

// Alterar senha
export async function alterarSenha(userId: string, novaSenha: string): Promise<boolean> {
  try {
    const senhaHash = await hashPassword(novaSenha)
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: senhaHash,
        primeiroAcesso: false,
        senhaTemporaria: false
      }
    })

    return true
  } catch (error) {
    console.error('Erro ao alterar senha:', error)
    return false
  }
}

// Criar cliente a partir do checkout
export async function criarClienteDoCheckout(dadosCheckout: any): Promise<{ 
  user: AuthUser; 
  credenciais: { email: string; senha: string } 
}> {
  try {
    // Gerar credenciais
    const emailLogin = dadosCheckout.cliente.emailEmpresa
    const senhaTemporaria = gerarSenhaTemporaria()
    const senhaHash = await hashPassword(senhaTemporaria)

    // Criar empresa
    const company = await prisma.company.create({
      data: {
        name: dadosCheckout.cliente.nomeEmpresa,
        email: dadosCheckout.cliente.emailEmpresa,
        plan: dadosCheckout.plano.id.toUpperCase(),
        status: 'ACTIVE',
        
        // Dados adicionais
        nomeFantasia: dadosCheckout.cliente.nomeEmpresa,
        cnpj: dadosCheckout.cliente.cnpj,
        telefone: dadosCheckout.cliente.telefone,
        
        // Dados da compra
        valorPago: dadosCheckout.plano.preco,
        metodoPagamento: dadosCheckout.metodoPagamento,
        transacaoId: `TXN_${Date.now()}`,
        dataCompra: new Date()
      }
    })

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email: emailLogin,
        password: senhaHash,
        name: dadosCheckout.cliente.nome,
        role: 'ADMIN',
        companyId: company.id,
        primeiroAcesso: true,
        senhaTemporaria: true
      }
    })

    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      companyId: company.id,
      companyName: company.name,
      primeiroAcesso: user.primeiroAcesso,
      senhaTemporaria: user.senhaTemporaria,
      plan: company.plan
    }

    return {
      user: authUser,
      credenciais: {
        email: emailLogin,
        senha: senhaTemporaria
      }
    }
  } catch (error) {
    console.error('Erro ao criar cliente:', error)
    throw new Error('Erro ao criar cliente')
  }
}

// Gerar senha temporária
function gerarSenhaTemporaria(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let senha = ''
  for (let i = 0; i < 8; i++) {
    senha += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return senha
}

// Validar força da senha
export function validarSenha(senha: string): { valida: boolean; erros: string[] } {
  const erros: string[] = []
  
  if (senha.length < 8) {
    erros.push('A senha deve ter pelo menos 8 caracteres')
  }
  
  if (!/[A-Z]/.test(senha)) {
    erros.push('A senha deve conter pelo menos uma letra maiúscula')
  }
  
  if (!/[a-z]/.test(senha)) {
    erros.push('A senha deve conter pelo menos uma letra minúscula')
  }
  
  if (!/[0-9]/.test(senha)) {
    erros.push('A senha deve conter pelo menos um número')
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(senha)) {
    erros.push('A senha deve conter pelo menos um caractere especial')
  }
  
  return {
    valida: erros.length === 0,
    erros
  }
}