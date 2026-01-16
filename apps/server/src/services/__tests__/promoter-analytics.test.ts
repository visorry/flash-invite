/**
 * Unit tests for analytics methods
 * Task 12.1: Implement getStats() method
 * Task 12.3: Implement getPostStats() method
 * Requirements: 8.6, 8.7
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import db from '@super-invite/db'
import * as promoterService from '../promoter.service'
import type { RequestContext } from '../../types/app'

describe('Analytics Methods', () => {
  let testUserId: string
  let testBotId: string
  let testConfig: any
  let testVaultEntity: any
  let testMarketingEntity: any
  let ctx: RequestContext

  beforeEach(async () => {
    // Create test user
    const user = await db.user.create({
      data: {
        id: `user-${Date.now()}`,
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })
    testUserId = user.id

    // Create request context
    ctx = {
      user: {
        id: testUserId,
        email: user.email,
        name: user.name || '',
      },
    } as RequestContext

    // Create test bot
    const bot = await db.bot.create({
      data: {
        userId: testUserId,
        token: 'test-token',
        username: 'test_bot',
        status: 0, // ACTIVE
      },
    })
    testBotId = bot.id

    // Create test vault entity
    testVaultEntity = await db.telegramEntity.create({
      data: {
        userId: testUserId,
        telegramId: '-1001234567890',
        type: 0, // channel
        title: 'Test Vault',
      },
    })

    // Create test marketing entity
    testMarketingEntity = await db.telegramEntity.create({
      data: {
        userId: testUserId,
        telegramId: '-1009876543210',
        type: 0, // channel
        title: 'Test Marketing',
      },
    })

    // Link bot to entities as admin
    await db.botTelegramEntity.create({
      data: {
        botId: testBotId,
        telegramEntityId: testVaultEntity.id,
        isAdmin: true,
      },
    })

    await db.botTelegramEntity.create({
      data: {
        botId: testBotId,
        telegramEntityId: testMarketingEntity.id,
        isAdmin: true,
      },
    })

    // Create test promoter config
    testConfig = await db.promoterConfig.create({
      data: {
        userId: testUserId,
        botId: testBotId,
        vaultEntityId: testVaultEntity.id,
        marketingEntityId: testMarketingEntity.id,
        name: 'Test Config',
        isActive: true,
        totalCaptures: 5,
        totalMarketingPosts: 5,
        totalDeliveries: 10,
      },
    })
  })

  afterEach(async () => {
    // Clean up test data
    await db.promoterDelivery.deleteMany({
      where: {
        post: {
          configId: testConfig.id,
        },
      },
    })
    await db.promoterPost.deleteMany({
      where: { configId: testConfig.id },
    })
    await db.promoterConfig.deleteMany({
      where: { id: testConfig.id },
    })
    await db.botTelegramEntity.deleteMany({
      where: { botId: testBotId },
    })
    await db.telegramEntity.deleteMany({
      where: { id: { in: [testVaultEntity.id, testMarketingEntity.id] } },
    })
    await db.bot.deleteMany({
      where: { id: testBotId },
    })
    await db.user.deleteMany({
      where: { id: testUserId },
    })
  })

  describe('getStats()', () => {
    it('should return basic stats from config', async () => {
      // Requirement 8.6
      const stats = await promoterService.getStats(ctx, testConfig.id)

      expect(stats.totalCaptures).toBe(5)
      expect(stats.totalMarketingPosts).toBe(5)
      expect(stats.totalDeliveries).toBe(10)
    })

    it('should calculate unique recipients count', async () => {
      // Requirement 8.6
      // Create test posts and deliveries
      const post1 = await db.promoterPost.create({
        data: {
          configId: testConfig.id,
          token: 'token-1',
          fileId: 'file-1',
          mediaType: 0,
          sourceMessageId: 1,
          sourceChatId: testVaultEntity.telegramId,
        },
      })

      const post2 = await db.promoterPost.create({
        data: {
          configId: testConfig.id,
          token: 'token-2',
          fileId: 'file-2',
          mediaType: 0,
          sourceMessageId: 2,
          sourceChatId: testVaultEntity.telegramId,
        },
      })

      // User 1 receives from both posts
      await db.promoterDelivery.create({
        data: {
          postId: post1.id,
          telegramUserId: 'user-1',
        },
      })

      await db.promoterDelivery.create({
        data: {
          postId: post2.id,
          telegramUserId: 'user-1',
        },
      })

      // User 2 receives from post 1 only
      await db.promoterDelivery.create({
        data: {
          postId: post1.id,
          telegramUserId: 'user-2',
        },
      })

      const stats = await promoterService.getStats(ctx, testConfig.id)

      // Should count 2 unique recipients (user-1 and user-2)
      expect(stats.uniqueRecipients).toBe(2)
    })

    it('should calculate average deliveries per post', async () => {
      // Requirement 8.6
      // Create 2 posts
      await db.promoterPost.create({
        data: {
          configId: testConfig.id,
          token: 'token-1',
          fileId: 'file-1',
          mediaType: 0,
          sourceMessageId: 1,
          sourceChatId: testVaultEntity.telegramId,
        },
      })

      await db.promoterPost.create({
        data: {
          configId: testConfig.id,
          token: 'token-2',
          fileId: 'file-2',
          mediaType: 0,
          sourceMessageId: 2,
          sourceChatId: testVaultEntity.telegramId,
        },
      })

      const stats = await promoterService.getStats(ctx, testConfig.id)

      // totalDeliveries = 10, postCount = 2, avg = 5
      expect(stats.avgDeliveriesPerPost).toBe(5)
    })

    it('should return recent posts', async () => {
      // Requirement 8.6
      // Create 3 posts
      const post1 = await db.promoterPost.create({
        data: {
          configId: testConfig.id,
          token: 'token-1',
          fileId: 'file-1',
          mediaType: 0,
          sourceMessageId: 1,
          sourceChatId: testVaultEntity.telegramId,
        },
      })

      await new Promise(resolve => setTimeout(resolve, 10))

      const post2 = await db.promoterPost.create({
        data: {
          configId: testConfig.id,
          token: 'token-2',
          fileId: 'file-2',
          mediaType: 0,
          sourceMessageId: 2,
          sourceChatId: testVaultEntity.telegramId,
        },
      })

      await new Promise(resolve => setTimeout(resolve, 10))

      const post3 = await db.promoterPost.create({
        data: {
          configId: testConfig.id,
          token: 'token-3',
          fileId: 'file-3',
          mediaType: 0,
          sourceMessageId: 3,
          sourceChatId: testVaultEntity.telegramId,
        },
      })

      const stats = await promoterService.getStats(ctx, testConfig.id)

      expect(stats.recentPosts).toHaveLength(3)
      // Should be ordered by createdAt desc (most recent first)
      expect(stats.recentPosts[0].id).toBe(post3.id)
      expect(stats.recentPosts[1].id).toBe(post2.id)
      expect(stats.recentPosts[2].id).toBe(post1.id)
    })

    it('should handle config with no posts', async () => {
      // Requirement 8.6
      const stats = await promoterService.getStats(ctx, testConfig.id)

      expect(stats.totalCaptures).toBe(5)
      expect(stats.totalMarketingPosts).toBe(5)
      expect(stats.totalDeliveries).toBe(10)
      expect(stats.uniqueRecipients).toBe(0)
      expect(stats.avgDeliveriesPerPost).toBe(0)
      expect(stats.recentPosts).toHaveLength(0)
    })

    it('should throw error for non-existent config', async () => {
      // Requirement 8.6
      await expect(
        promoterService.getStats(ctx, 'non-existent-id')
      ).rejects.toThrow('Configuration not found')
    })

    it('should throw error for unauthenticated user', async () => {
      // Requirement 8.6
      const unauthCtx = { user: null } as any
      await expect(
        promoterService.getStats(unauthCtx, testConfig.id)
      ).rejects.toThrow('User not authenticated')
    })
  })

  describe('getPostStats()', () => {
    let testPost: any

    beforeEach(async () => {
      // Create a test post
      testPost = await db.promoterPost.create({
        data: {
          configId: testConfig.id,
          token: 'test-token',
          fileId: 'test-file',
          mediaType: 0,
          sourceMessageId: 1,
          sourceChatId: testVaultEntity.telegramId,
          deliveryCount: 3,
        },
      })
    })

    it('should return post with delivery count', async () => {
      // Requirement 8.7
      const stats = await promoterService.getPostStats(ctx, testPost.id)

      expect(stats.post).toBeDefined()
      expect(stats.post.id).toBe(testPost.id)
      expect(stats.deliveryCount).toBe(3)
    })

    it('should calculate unique recipients for post', async () => {
      // Requirement 8.7
      // Create deliveries with 2 unique users
      await db.promoterDelivery.create({
        data: {
          postId: testPost.id,
          telegramUserId: 'user-1',
        },
      })

      await db.promoterDelivery.create({
        data: {
          postId: testPost.id,
          telegramUserId: 'user-1', // Same user again
        },
      })

      await db.promoterDelivery.create({
        data: {
          postId: testPost.id,
          telegramUserId: 'user-2', // Different user
        },
      })

      const stats = await promoterService.getPostStats(ctx, testPost.id)

      // Should count 2 unique recipients
      expect(stats.uniqueRecipients).toBe(2)
    })

    it('should return recent deliveries', async () => {
      // Requirement 8.7
      // Create 3 deliveries
      const delivery1 = await db.promoterDelivery.create({
        data: {
          postId: testPost.id,
          telegramUserId: 'user-1',
          username: 'user1',
        },
      })

      await new Promise(resolve => setTimeout(resolve, 10))

      const delivery2 = await db.promoterDelivery.create({
        data: {
          postId: testPost.id,
          telegramUserId: 'user-2',
          username: 'user2',
        },
      })

      await new Promise(resolve => setTimeout(resolve, 10))

      const delivery3 = await db.promoterDelivery.create({
        data: {
          postId: testPost.id,
          telegramUserId: 'user-3',
          username: 'user3',
        },
      })

      const stats = await promoterService.getPostStats(ctx, testPost.id)

      expect(stats.recentDeliveries).toHaveLength(3)
      // Should be ordered by deliveredAt desc (most recent first)
      expect(stats.recentDeliveries[0].id).toBe(delivery3.id)
      expect(stats.recentDeliveries[1].id).toBe(delivery2.id)
      expect(stats.recentDeliveries[2].id).toBe(delivery1.id)
    })

    it('should handle post with no deliveries', async () => {
      // Requirement 8.7
      const stats = await promoterService.getPostStats(ctx, testPost.id)

      expect(stats.deliveryCount).toBe(3) // From post.deliveryCount
      expect(stats.uniqueRecipients).toBe(0)
      expect(stats.recentDeliveries).toHaveLength(0)
    })

    it('should throw error for non-existent post', async () => {
      // Requirement 8.7
      await expect(
        promoterService.getPostStats(ctx, 'non-existent-id')
      ).rejects.toThrow('Post not found')
    })

    it('should throw error for unauthenticated user', async () => {
      // Requirement 8.7
      const unauthCtx = { user: null } as any
      await expect(
        promoterService.getPostStats(unauthCtx, testPost.id)
      ).rejects.toThrow('User not authenticated')
    })

    it('should not allow access to posts from other users', async () => {
      // Requirement 8.7
      // Create another user
      const otherUser = await db.user.create({
        data: {
          id: `other-user-${Date.now()}`,
          email: `other-${Date.now()}@example.com`,
          name: 'Other User',
          emailVerified: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      const otherCtx = {
        user: {
          id: otherUser.id,
          email: otherUser.email,
          name: otherUser.name || '',
        },
      } as RequestContext

      await expect(
        promoterService.getPostStats(otherCtx, testPost.id)
      ).rejects.toThrow('Post not found')

      // Clean up
      await db.user.delete({ where: { id: otherUser.id } })
    })
  })
})
