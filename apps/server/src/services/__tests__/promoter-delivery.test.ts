/**
 * Unit tests for deliverContent() method
 * Task 7.1: Implement deliverContent() method
 * Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 6.2, 8.3, 8.4, 8.5
 */

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test'
import db from '@super-invite/db'
import * as promoterService from '../promoter.service'

// Mock bot manager
const mockBotInstance = {
  bot: {
    telegram: {
      sendPhoto: mock(async () => ({ message_id: 123 })),
      sendVideo: mock(async () => ({ message_id: 124 })),
      sendDocument: mock(async () => ({ message_id: 125 })),
    },
  },
  username: 'test_bot',
}

mock.module('../../bot/bot-manager', () => ({
  getBotInstance: mock(() => mockBotInstance),
}))

describe('deliverContent()', () => {
  let testUserId: string
  let testBotId: string
  let testConfig: any
  let testPost: any
  let testVaultEntity: any
  let testMarketingEntity: any

  beforeEach(async () => {
    // Create test user
    const user = await db.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: 'Test User',
      },
    })
    testUserId = user.id

    // Create test bot
    const bot = await db.bot.create({
      data: {
        userId: testUserId,
        token: 'test-token',
        telegramBotId: '123456789',
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
        type: 'channel',
        title: 'Test Vault',
      },
    })

    // Create test marketing entity
    testMarketingEntity = await db.telegramEntity.create({
      data: {
        userId: testUserId,
        telegramId: '-1009876543210',
        type: 'channel',
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
        invalidTokenMessage: 'Custom invalid message',
        expiredTokenMessage: 'Custom expired message',
      },
    })

    // Create test post
    testPost = await db.promoterPost.create({
      data: {
        configId: testConfig.id,
        token: 'test-token-123',
        fileId: 'test-file-id-456',
        mediaType: 0, // PHOTO
        caption: 'Test caption',
        sourceMessageId: 1,
        sourceChatId: testVaultEntity.telegramId,
      },
    })
  })

  afterEach(async () => {
    // Clean up test data
    await db.promoterDelivery.deleteMany({
      where: { postId: testPost.id },
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

    // Clear mocks
    mockBotInstance.bot.telegram.sendPhoto.mockClear()
    mockBotInstance.bot.telegram.sendVideo.mockClear()
    mockBotInstance.bot.telegram.sendDocument.mockClear()
  })

  it('should successfully deliver photo content with valid token', async () => {
    // Requirement 3.4, 3.5, 3.6
    const result = await promoterService.deliverContent(
      testBotId,
      'test-token-123',
      '987654321',
      {
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
      }
    )

    expect(result.success).toBe(true)
    expect(result.post).toBeDefined()
    expect(mockBotInstance.bot.telegram.sendPhoto).toHaveBeenCalledWith(
      '987654321',
      'test-file-id-456',
      { caption: 'Test caption' }
    )
  })

  it('should create PromoterDelivery record', async () => {
    // Requirement 8.4, 8.5
    await promoterService.deliverContent(
      testBotId,
      'test-token-123',
      '987654321',
      {
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
      }
    )

    const delivery = await db.promoterDelivery.findFirst({
      where: {
        postId: testPost.id,
        telegramUserId: '987654321',
      },
    })

    expect(delivery).toBeDefined()
    expect(delivery?.username).toBe('testuser')
    expect(delivery?.firstName).toBe('Test')
    expect(delivery?.lastName).toBe('User')
  })

  it('should increment deliveryCount and totalDeliveries counters', async () => {
    // Requirement 8.3
    const initialPost = await db.promoterPost.findUnique({
      where: { id: testPost.id },
    })
    const initialConfig = await db.promoterConfig.findUnique({
      where: { id: testConfig.id },
    })

    await promoterService.deliverContent(
      testBotId,
      'test-token-123',
      '987654321',
      {
        username: 'testuser',
        firstName: 'Test',
      }
    )

    const updatedPost = await db.promoterPost.findUnique({
      where: { id: testPost.id },
    })
    const updatedConfig = await db.promoterConfig.findUnique({
      where: { id: testConfig.id },
    })

    expect(updatedPost?.deliveryCount).toBe(initialPost!.deliveryCount + 1)
    expect(updatedConfig?.totalDeliveries).toBe(initialConfig!.totalDeliveries + 1)
    expect(updatedPost?.lastDeliveredAt).toBeDefined()
  })

  it('should handle invalid token with custom error message', async () => {
    // Requirement 3.7
    const result = await promoterService.deliverContent(
      testBotId,
      'invalid-token-xyz',
      '987654321',
      {
        username: 'testuser',
      }
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('Custom invalid message')
  })

  it('should handle expired token with custom error message', async () => {
    // Requirement 3.8
    // Create an expired post
    const expiredPost = await db.promoterPost.create({
      data: {
        configId: testConfig.id,
        token: 'expired-token-456',
        fileId: 'test-file-id-789',
        mediaType: 0,
        sourceMessageId: 2,
        sourceChatId: testVaultEntity.telegramId,
        isExpired: true,
      },
    })

    const result = await promoterService.deliverContent(
      testBotId,
      'expired-token-456',
      '987654321',
      {
        username: 'testuser',
      }
    )

    expect(result.success).toBe(false)
    expect(result.error).toBe('Custom expired message')

    // Clean up
    await db.promoterPost.delete({ where: { id: expiredPost.id } })
  })

  it('should deliver video content correctly', async () => {
    // Requirement 3.5
    const videoPost = await db.promoterPost.create({
      data: {
        configId: testConfig.id,
        token: 'video-token-789',
        fileId: 'video-file-id-123',
        mediaType: 1, // VIDEO
        caption: 'Video caption',
        sourceMessageId: 3,
        sourceChatId: testVaultEntity.telegramId,
      },
    })

    const result = await promoterService.deliverContent(
      testBotId,
      'video-token-789',
      '987654321',
      {
        username: 'testuser',
      }
    )

    expect(result.success).toBe(true)
    expect(mockBotInstance.bot.telegram.sendVideo).toHaveBeenCalledWith(
      '987654321',
      'video-file-id-123',
      { caption: 'Video caption' }
    )

    // Clean up
    await db.promoterDelivery.deleteMany({ where: { postId: videoPost.id } })
    await db.promoterPost.delete({ where: { id: videoPost.id } })
  })

  it('should deliver document content correctly', async () => {
    // Requirement 3.5
    const docPost = await db.promoterPost.create({
      data: {
        configId: testConfig.id,
        token: 'doc-token-101',
        fileId: 'doc-file-id-456',
        mediaType: 2, // DOCUMENT
        sourceMessageId: 4,
        sourceChatId: testVaultEntity.telegramId,
      },
    })

    const result = await promoterService.deliverContent(
      testBotId,
      'doc-token-101',
      '987654321',
      {
        username: 'testuser',
      }
    )

    expect(result.success).toBe(true)
    expect(mockBotInstance.bot.telegram.sendDocument).toHaveBeenCalledWith(
      '987654321',
      'doc-file-id-456',
      { caption: undefined }
    )

    // Clean up
    await db.promoterDelivery.deleteMany({ where: { postId: docPost.id } })
    await db.promoterPost.delete({ where: { id: docPost.id } })
  })

  it('should include original caption if present', async () => {
    // Requirement 3.6
    const result = await promoterService.deliverContent(
      testBotId,
      'test-token-123',
      '987654321',
      {
        username: 'testuser',
      }
    )

    expect(result.success).toBe(true)
    expect(mockBotInstance.bot.telegram.sendPhoto).toHaveBeenCalledWith(
      '987654321',
      'test-file-id-456',
      { caption: 'Test caption' }
    )
  })

  it('should apply rate limiting between deliveries', async () => {
    // Requirement 6.2
    const startTime = Date.now()

    // First delivery
    await promoterService.deliverContent(
      testBotId,
      'test-token-123',
      '111111111',
      { username: 'user1' }
    )

    // Second delivery (should wait at least 1 second)
    await promoterService.deliverContent(
      testBotId,
      'test-token-123',
      '222222222',
      { username: 'user2' }
    )

    const endTime = Date.now()
    const elapsed = endTime - startTime

    // Should take at least 1000ms due to rate limiting
    expect(elapsed).toBeGreaterThanOrEqual(1000)
  })
})
