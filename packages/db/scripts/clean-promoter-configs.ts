import 'dotenv/config'
import db from '../src/index'

async function cleanPromoterConfigs() {
  try {
    console.log('Deleting all promoter configurations...')
    
    // Delete all promoter configs (cascade will delete posts and deliveries)
    const result = await db.promoterConfig.deleteMany({})
    
    console.log(`✅ Deleted ${result.count} promoter configuration(s)`)
    console.log('You can now create new promoter configurations')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await db.$disconnect()
  }
}

cleanPromoterConfigs()
