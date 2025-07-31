const { PrismaClient } = require('@prisma/client')
const sqlite3 = require('sqlite3').verbose()

async function checkRealTables() {
  try {
    console.log('🔍 Verificando tabelas reais no banco SQLite...')
    
    // Conectar diretamente ao SQLite
    const db = new sqlite3.Database('./dev.db')
    
    // Listar todas as tabelas
    db.all("SELECT name FROM sqlite_master WHERE type='table'", [], (err, rows) => {
      if (err) {
        console.error('❌ Erro:', err)
        return
      }
      
      console.log('\n📋 TABELAS ENCONTRADAS:')
      rows.forEach(row => {
        console.log(`📊 ${row.name}`)
      })
      
      // Verificar se existe tabela de produtos
      if (rows.some(row => row.name.toLowerCase().includes('produto'))) {
        console.log('\n🔍 Verificando dados na tabela de produtos...')
        db.all("SELECT * FROM produtos LIMIT 5", [], (err, produtos) => {
          if (!err && produtos) {
            console.log(`📦 Encontrados ${produtos.length} produtos:`)
            produtos.forEach(produto => {
              console.log(`   - ${produto.nome || produto.name || 'Nome não encontrado'}`)
            })
          }
        })
      }
      
      db.close()
    })

  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

checkRealTables()