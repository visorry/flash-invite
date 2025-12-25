import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../../apps/server/.env') })

import db from '@super-invite/db'

async function updateRules() {
    console.log('Setting hideAuthorSignature=false for all auto-drop rules...')

    const result = await db.autoDropRule.updateMany({
        data: { hideAuthorSignature: false }
    })

    console.log(`✅ Updated ${result.count} rules`)
    process.exit(0)
}

updateRules().catch(e => { console.error(e); process.exit(1) })
