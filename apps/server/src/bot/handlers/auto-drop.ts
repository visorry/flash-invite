import type { Telegraf, Context } from 'telegraf'
import autoDropService from '../../services/auto-drop.service'
import db from '@super-invite/db'

/**
 * Handler for /post and /start commands for on-demand auto-drop
 * This allows users to request posts on-demand from configured auto-drop rules
 */
export function setupAutoDropHandler(bot: Telegraf<Context>, botId: string) {
    // Handle /post command
    bot.command('post', async (ctx) => {
        try {
            const userId = ctx.from.id.toString()
            const chatId = ctx.chat.id.toString()

            console.log(`[AUTO_DROP_HANDLER] /post command from user ${userId}`)

            // Find an active on-demand rule for this bot
            const rule = await db.autoDropRule.findFirst({
                where: {
                    botId,
                    isActive: true,
                    deliveryMode: 1, // on-demand mode
                },
            })

            if (!rule) {
                await ctx.reply('No active on-demand auto-drop rules configured.')
                return
            }

            // Create pseudo request context
            const pseudoCtx = {
                user: {
                    id: rule.userId,
                },
            } as any

            // Trigger on-demand delivery
            const result = await autoDropService.handleOnDemandRequest(
                pseudoCtx,
                rule.id,
                userId
            )

            if (result.success) {
                console.log(`[AUTO_DROP_HANDLER] Successfully delivered ${result.messagesSent} posts to user ${userId}`)
            } else if (result.cooldownRemaining) {
                await ctx.reply(
                    `⏳ Please wait ${result.cooldownRemaining} seconds before requesting again.`
                )
            } else {
                await ctx.reply(result.error || 'Failed to deliver posts')
            }
        } catch (error) {
            console.error('[AUTO_DROP_HANDLER] Error handling /post command:', error)
            await ctx.reply('An error occurred while processing your request.')
        }
    })

    // Handle /start command (same behavior as /post)
    bot.command('start', async (ctx) => {
        try {
            const userId = ctx.from.id.toString()
            const chatId = ctx.chat.id.toString()

            console.log(`[AUTO_DROP_HANDLER] /start command from user ${userId}`)

            // Find an active on-demand rule for this bot
            const rule = await db.autoDropRule.findFirst({
                where: {
                    botId,
                    isActive: true,
                    deliveryMode: 1, // on-demand mode
                },
            })

            if (!rule) {
                await ctx.reply('Welcome! Currently, there are no active content delivery rules configured.')
                return
            }

            // Create pseudo request context
            const pseudoCtx = {
                user: {
                    id: rule.userId,
                },
            } as any

            // Trigger on-demand delivery
            const result = await autoDropService.handleOnDemandRequest(
                pseudoCtx,
                rule.id,
                userId
            )

            if (result.success) {
                console.log(`[AUTO_DROP_HANDLER] Successfully delivered ${result.messagesSent} posts to user ${userId}`)
            } else if (result.cooldownRemaining) {
                await ctx.reply(
                    `⏳ Please wait ${result.cooldownRemaining} seconds before requesting again.`
                )
            } else {
                await ctx.reply(result.error || 'Failed to deliver posts')
            }
        } catch (error) {
            console.error('[AUTO_DROP_HANDLER] Error handling /start command:', error)
            await ctx.reply('An error occurred. Please try again later.')
        }
    })
}
