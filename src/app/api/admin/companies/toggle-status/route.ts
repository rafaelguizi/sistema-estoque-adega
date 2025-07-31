import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { companyId, status } = await request.json()

    const updatedCompany = await prisma.company.update({
      where: { id: companyId },
      data: { status }
    })

    return NextResponse.json({ 
      success: true, 
      company: updatedCompany 
    })

  } catch (error) {
    console.error('Erro ao alterar status:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}