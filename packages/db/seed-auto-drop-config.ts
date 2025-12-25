import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from server .env
config({ path: resolve(__dirname, '../../apps/server/.env') })

import db from '@super-invite/db'

async function seedAutoDropConfig() {
    console.log('Seeding AutomationCostConfig for AUTO_DROP...')

    // Check if it already exists
    const existing = await db.automationCostConfig.findFirst({
        where: { featureType: 2 }, // AUTO_DROP
    })

    if (existing) {
        console.log('AutomationCostConfig for AUTO_DROP already exists:', existing)
        return
    }

    // Create the config
    const config = await db.automationCostConfig.create({
        data: {
            featureType: 2, // AUTO_DROP
            costPerRule: 0, // Free for now
            freeRulesAllowed: 999, // Allow many free rules
            description: 'Auto-drop feature - send posts to users on demand',
            isActive: true,
        },
    })

    console.log('Created AutomationCostConfig:', config)
}

seedAutoDropConfig()
    .then(() => {
        console.log('✅ Seed completed successfully')
        process.exit(0)
    })
    .catch((error) => {
        console.error('❌ Seed failed:', error)
        process.exit(1)
    })
