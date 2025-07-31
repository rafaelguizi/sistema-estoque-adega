const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanDatabase() {
  try {
    console.log('🔍 Verificando o que existe no banco...')
    
    // Contar usuários
    const users = await prisma.user.count()
    console.log(`   Usuários: ${users}`)
    
    // Contar empresas
    const companies = await prisma.company.count()
    console.log(`   Empresas: ${companies}`)
    
    // Listar empresas
    const companiesList = await prisma.company.findMany({
      include: { users: true }
    })
    
    console.log('\n📋 EMPRESAS CADASTRADAS:')
    companiesList.forEach(company => {
      console.log(`🏢 ${company.name} (${company.email})`)
      console.log(`   Status: ${company.status}`)
      console.log(`   Plano: ${company.plan}`)
      console.log(`   Usuários: ${company.users.length}`)
      if (company.trialEndsAt) {
        const daysLeft = Math.ceil((new Date(company.trialEndsAt) - new Date()) / (1000 * 60 * 60 * 24))
        console.log(`   Trial: ${daysLeft} dias restantes`)
      }
      console.log('')
    })
    
    console.log('✅ Verificação concluída!')
    console.log('💡 Como só existem User e Company, não há dados de produtos para limpar ainda.')

  } catch (error) {
    console.error('❌ Erro:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanDatabase()