import { Telegraf } from 'telegraf'
import db from '@super-invite/db'

export function registerPostCommand(bot: Telegraf) {
  bot.command('post', async (ctx) => {
    try {
      const userId = ctx.from.id.toString()
      const username = ctx.from.username ?? null
      const fullName = [ctx.from.first_name, ctx.from.last_name]
        .filter(Boolean)
        .join(' ')

      // Get botId from context (set by middleware in bot.ts)
      const dbBotId = (ctx as any).dbBotId as string

      if (!dbBotId) {
        return ctx.reply('❌ Bot configuration error. Please contact support.')
      }

      // Track bot member interaction
      await db.botMember.upsert({
        where: {
          botId_telegramUserId: {
            botId: dbBotId,
            telegramUserId: userId,
          },
        },
        update: {
          username,
          firstName: ctx.from.first_name,
          lastName: ctx.from.last_name ?? null,
          languageCode: ctx.from.language_code ?? null,
          isPremium: ctx.from.is_premium ?? false,
          isBot: ctx.from.is_bot ?? false,
          lastActiveAt: new Date(),
        },
        create: {
          botId: dbBotId,
          telegramUserId: userId,
          username,
          firstName: ctx.from.first_name,
          lastName: ctx.from.last_name ?? null,
          languageCode: ctx.from.language_code ?? null,
          isPremium: ctx.from.is_premium ?? false,
          isBot: ctx.from.is_bot ?? false,
          isActive: true,
        },
      }).catch((botMemberError) => {
        console.error('Failed to track bot member for /post command:', botMemberError)
      })

      // Find active auto drop rules for this bot
      const activeRules = await db.autoDropRule.findMany({
        where: {
          botId: dbBotId,
          isActive: true,
          status: { in: ['running', 'stopped'] }, // Include stopped rules that can be manually triggered
        },
        include: {
          telegramEntity: {
            select: {
              telegramId: true,
              title: true,
              username: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' }, // Process rules in order
      })

      if (activeRules.length === 0) {
        return ctx.reply(
          '📭 *No Auto Drop Rules Available*\n\n' +
          'There are currently no active auto drop rules for this bot.\n\n' +
          'Contact the bot administrator to set up auto drop rules.',
          { parse_mode: 'Markdown' }
        )
      }

      let totalPostsSent = 0
      let rulesProcessed = 0

      // Process each rule and send the next batch of posts
      for (const rule of activeRules) {
        try {
          const currentPostId = rule.currentPostId || rule.startPostId
          if (!currentPostId) {
            console.log(`[POST_COMMAND] Rule ${rule.id} has no current post ID`)
            continue
          }

          // Check if we've reached the end
          if (rule.endPostId && currentPostId > rule.endPostId) {
            console.log(`[POST_COMMAND] Rule ${rule.id} has reached the end`)
            continue
          }

          // Send batch of posts from this rule
          let postsFromThisRule = 0
          let nextPostId = currentPostId

          for (let i = 0; i < rule.batchSize && (!rule.endPostId || nextPostId <= rule.endPostId); i++) {
            try {
              // Choose between forward (shows "Forwarded from") or copy (hides attribution)
              if (rule.hideAuthorSignature) {
                // Copy message - hides "Forwarded from" attribution
                await ctx.telegram.copyMessage(
                  userId,
                  rule.telegramEntity.telegramId,
                  nextPostId
                )
              } else {
                // Forward message - shows "Forwarded from" attribution  
                await ctx.telegram.forwardMessage(
                  userId,
                  rule.telegramEntity.telegramId,
                  nextPostId
                )
              }

              postsFromThisRule++
              totalPostsSent++
              nextPostId++
            } catch (error) {
              console.error(`[POST_COMMAND] Failed to send post ${nextPostId} from rule ${rule.id}:`, error)
              // Try next post ID
              nextPostId++
            }
          }

          // Update rule's current position
          if (postsFromThisRule > 0) {
            await db.autoDropRule.update({
              where: { id: rule.id },
              data: {
                currentPostId: nextPostId,
                droppedCount: rule.droppedCount + postsFromThisRule,
                lastDroppedAt: new Date(),
              },
            })
            rulesProcessed++
          }

        } catch (ruleError) {
          console.error(`[POST_COMMAND] Error processing rule ${rule.id}:`, ruleError)
        }
      }

      // Send response to user
      if (totalPostsSent > 0) {
        let message = `📮 *Posts Delivered!*\n\n`
        message += `✅ Sent ${totalPostsSent} post${totalPostsSent !== 1 ? 's' : ''} from ${rulesProcessed} source${rulesProcessed !== 1 ? 's' : ''}\n\n`
        message += `💡 Type /post again to get the next batch of posts.`

        await ctx.reply(message, { parse_mode: 'Markdown' })
      } else {
        let message = `📭 *No New Posts Available*\n\n`

        if (activeRules.length > 0) {
          message += `All auto drop rules have reached their end or no posts are available at the moment.\n\n`
          message += `Try again later or contact the administrator to reset the rules.`
        } else {
          message += `No active auto drop rules found.`
        }

        await ctx.reply(message, { parse_mode: 'Markdown' })
      }

      console.log(`[POST_COMMAND] User ${userId} (${fullName}) requested posts: ${totalPostsSent} sent from ${rulesProcessed} rules`)

    } catch (error) {
      console.error('Error in /post command:', error)
      await ctx.reply('❌ Something went wrong while fetching posts. Please try again later.')
    }
  })
}