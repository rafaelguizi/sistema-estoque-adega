const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createUser() {
  try {
    console.log('🧹 Limpando dados antigos...')
    
    // Deletar TODOS os usuários primeiro
    await prisma.user.deleteMany({})
    console.log('✅ Usuários deletados')
    
    // Deletar TODAS as empresas
    await prisma.company.deleteMany({})
    console.log('✅ Empresas deletadas')

    console.log('🏗️ Criando dados novos...')

    // Criar empresa
    const company = await prisma.company.create({
      data: {
        name: 'Empresa Teste',
        email: 'empresa@teste.com',
        plan: 'PRO',
        status: 'ACTIVE'
      }
    })
    console.log('✅ Empresa criada:', company.name)

    // Criar usuário associado à empresa
    const hashedPassword = await bcrypt.hash('123456', 10)
    
    const user = await prisma.user.create({
      data: {
        email: 'admin@teste.com',
        password: hashedPassword,
        name: 'Admin Teste',
        role: 'ADMIN',
        companyId: company.id
      }
    })

    console.log('✅ Usuário criado:', user.email)
    console.log('🔑 Senha:', '123456')
    console.log('🏢 Empresa:', company.name)
    console.log('🎉 PRONTO! Pode fazer login!')

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createUser()