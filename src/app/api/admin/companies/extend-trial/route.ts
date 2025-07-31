import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { companyId, days } = await request.json()

    // Buscar empresa atual
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    })

    if (!company) {
      return NextResponse.json(
        { error: 'Empresa não encontrada' },
        { status: 404 }
      )
    }

    // Calcular nova data de fim do trial
    const currentTrialEnd = company.trialEndsAt || new Date()
    const newTrialEnd = new Date(currentTrialEnd)
    newTrialEnd.setDate(newTrialEnd.getDate() + days)

    // Atualizar empresa
    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: { 
        trialEndsAt: newTrialEnd,
        status: 'TRIAL' // Garantir que está em trial
      }
    })

    return NextResponse.json({ 
      success: true, 
      company: updatedCompany 
    })

  } catch (error) {
    console.error('Erro ao estender trial:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}