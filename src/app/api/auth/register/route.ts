import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { companyName, companyEmail, userName, userEmail, password, plan } = await request.json()

    // Verificar se empresa já existe
    const existingCompany = await prisma.company.findUnique({
      where: { email: companyEmail }
    })

    if (existingCompany) {
      return NextResponse.json(
        { error: 'Empresa já cadastrada com este email' },
        { status: 400 }
      )
    }

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Usuário já cadastrado com este email' },
        { status: 400 }
      )
    }

    // Calcular data de fim do trial (7 dias a partir de agora)
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + 7)

    // Criar empresa
    const company = await prisma.company.create({
      data: {
        name: companyName,
        email: companyEmail,
        plan: plan,
        status: 'TRIAL',
        trialEndsAt: trialEndsAt
      }
    })

    // Criar usuário
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const user = await prisma.user.create({
      data: {
        email: userEmail,
        password: hashedPassword,
        name: userName,
        role: 'ADMIN',
        companyId: company.id
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Conta criada com sucesso!',
      company: {
        id: company.id,
        name: company.name,
        plan: company.plan,
        trialEndsAt: company.trialEndsAt
      }
    })

  } catch (error) {
    console.error('Erro no registro:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}