# Implementation Plan: Promoter 2.0

## Overview

This implementation plan breaks down the Promoter 2.0 feature into discrete coding tasks. The approach follows an incremental pattern: database schema → service layer → handlers → API endpoints → testing. Each task builds on previous work and includes validation through tests.

## Tasks

- [x] 1. Create database schema and migrations
  - Create Prisma schema models for PromoterConfig, PromoterPost, and PromoterDelivery
  - Add relations to existing Bot and TelegramEntity models
  - Create database migration files
  - Run migrations to create tables and indexes
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

- [ ]* 1.1 Write unit tests for database schema
  - Test that all tables are created correctly
  - Test that foreign key constraints work
  - Test that unique constraints prevent duplicates
  - _Requirements: 10.1, 10.2, 10.3_

- [x] 2. Implement token generation and validation
  - [x] 2.1 Create token generation utility
    - Implement cryptographically secure random token generation
    - Ensure tokens are URL-safe and at least 16 characters
    - Add uniqueness check against database
    - _Requirements: 4.1, 4.2, 4.3, 4.4_
  
  - [ ]* 2.2 Write property test for token generation
    - **Property 11: Token Format Compliance**
    - **Validates: Requirements 4.2, 4.3**
  
  - [ ]* 2.3 Write property test for token uniqueness
    - **Property 2: Token Uniqueness**
    - **Validates: Requirements 1.6, 4.4**
  
  - [x] 2.4 Create token validation utility
    - Implement token lookup in database
    - Check expiration status
    - Return validation result with post data
    - _Requirements: 3.3, 4.6, 4.7_
  
  - [ ]* 2.5 Write property test for token validation
    - **Property 7: Token Validation**
    - **Validates: Requirements 3.3**
  
  - [ ]* 2.6 Write property test for token expiration
    - **Property 12: Token Expiration**
    - **Validates: Requirements 4.6, 4.7**

- [x] 3. Implement PromoterService core methods
  - [x] 3.1 Implement configuration CRUD operations
    - Create create(), update(), delete(), list(), getById() methods
    - Add validation for bot ownership and admin permissions
    - Add uniqueness check for bot + vault combination
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [ ]* 3.2 Write property test for bot admin validation
    - **Property 13: Bot Admin Validation**
    - **Validates: Requirements 5.5**
  
  - [ ]* 3.3 Write property test for configuration uniqueness
    - **Property 14: Configuration Uniqueness**
    - **Validates: Requirements 5.6**
  
  - [x] 3.4 Implement toggleActive() method
    - Toggle isActive flag without deleting configuration
    - _Requirements: 7.7_
  
  - [ ]* 3.5 Write property test for configuration toggle
    - **Property 23: Configuration Toggle**
    - **Validates: Requirements 7.7**

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement post capture functionality
  - [x] 5.1 Implement capturePost() method
    - Extract file_id, media type, and caption from Telegram message
    - Generate unique promotion token
    - Store post in database with all metadata
    - Increment totalCaptures counter
    - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 8.1_
  
  - [ ]* 5.2 Write property test for post capture round trip
    - **Property 1: Post Capture Round Trip**
    - **Validates: Requirements 1.2, 1.3, 1.4, 1.5, 1.7**
  
  - [ ]* 5.3 Write property test for capture counter increment
    - **Property 24: Analytics Counter Increments** (capture portion)
    - **Validates: Requirements 8.1**
  
  - [x] 5.4 Implement getActiveConfigForVault() helper
    - Query for active config by bot ID and vault chat ID
    - Used by channel post handler to detect promoter vaults
    - _Requirements: 5.7_
  
  - [ ]* 5.5 Write property test for message routing
    - **Property 15: Message Routing**
    - **Validates: Requirements 5.7**

- [x] 6. Implement marketing post creation
  - [x] 6.1 Implement createMarketingPost() method
    - Generate deep link from token and bot username
    - Format CTA message using template with {link} variable
    - Send text-only message to marketing group (no media)
    - Store marketing message ID and timestamp
    - Increment totalMarketingPosts counter
    - Apply rate limiting (3 second delay)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 6.1, 8.2_
  
  - [ ]* 6.2 Write property test for marketing post creation
    - **Property 3: Marketing Post Creation**
    - **Validates: Requirements 2.1, 2.5**
  
  - [ ]* 6.3 Write property test for marketing post content
    - **Property 4: Marketing Post Content**
    - **Validates: Requirements 2.3, 2.4, 2.6, 2.7**
  
  - [ ]* 6.4 Write property test for caption handling
    - **Property 5: Caption Handling in Marketing Posts**
    - **Validates: Requirements 2.2**
  
  - [ ]* 6.5 Write property test for marketing rate limiting
    - **Property 16: Marketing Post Rate Limiting**
    - **Validates: Requirements 6.1**
  
  - [ ]* 6.6 Write property test for marketing counter increment
    - **Property 24: Analytics Counter Increments** (marketing portion)
    - **Validates: Requirements 8.2**

- [x] 7. Implement content delivery functionality
  - [x] 7.1 Implement deliverContent() method
    - Validate token and check expiration
    - Retrieve post data from database
    - Send media to user using stored file_id
    - Include original caption if present
    - Create PromoterDelivery record
    - Increment deliveryCount and totalDeliveries counters
    - Apply rate limiting (1 second delay)
    - Handle invalid and expired tokens with custom error messages
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 6.2, 8.3, 8.4, 8.5_
  
  - [ ]* 7.2 Write property test for token extraction
    - **Property 6: Token Extraction from Start Command**
    - **Validates: Requirements 3.2**
  
  - [ ]* 7.3 Write property test for content delivery round trip
    - **Property 8: Content Delivery Round Trip**
    - **Validates: Requirements 3.4, 3.5, 3.6**
  
  - [ ]* 7.4 Write property test for invalid token error handling
    - **Property 9: Invalid Token Error Handling**
    - **Validates: Requirements 3.7**
  
  - [ ]* 7.5 Write property test for expired token error handling
    - **Property 10: Expired Token Error Handling**
    - **Validates: Requirements 3.8, 4.7**
  
  - [ ]* 7.6 Write property test for delivery rate limiting
    - **Property 17: Delivery Rate Limiting**
    - **Validates: Requirements 6.2**
  
  - [ ]* 7.7 Write property test for delivery tracking
    - **Property 25: Delivery Tracking**
    - **Validates: Requirements 8.3, 8.4, 8.5**
  
  - [ ]* 7.8 Write property test for delivery counter increment
    - **Property 24: Analytics Counter Increments** (delivery portion)
    - **Validates: Requirements 8.3**
  
  - [ ]* 7.9 Write property test for custom error messages
    - **Property 21: Custom Error Messages**
    - **Validates: Requirements 7.3, 7.4**

- [x] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Implement rate limiting and retry logic
  - [x] 9.1 Create rate limiter utility
    - Track last send time per bot
    - Enforce minimum delays (3s for marketing, 1s for delivery)
    - _Requirements: 6.1, 6.2, 6.7_
  
  - [ ]* 9.2 Write property test for rate limit timestamp tracking
    - **Property 19: Rate Limit Timestamp Tracking**
    - **Validates: Requirements 6.7**
  
  - [x] 9.3 Implement retry with exponential backoff
    - Detect Telegram 429 errors
    - Respect retry_after parameter
    - Retry up to 3 times with exponential backoff
    - Log rate limit events
    - _Requirements: 6.3, 6.4, 6.5, 6.6_
  
  - [ ]* 9.4 Write property test for rate limit retry
    - **Property 18: Rate Limit Retry with Backoff**
    - **Validates: Requirements 6.3, 6.4, 6.5**

- [x] 10. Extend channel post handler
  - [x] 10.1 Add promoter capture logic to channel post handler
    - Check if message is from a promoter vault
    - Call capturePost() if vault is found
    - Call createMarketingPost() if auto-posting enabled
    - Handle errors gracefully without breaking existing forward rules
    - _Requirements: 1.2, 2.1, 9.7_
  
  - [ ]* 10.2 Write property test for auto-posting configuration
    - **Property 20: Auto-Posting Configuration**
    - **Validates: Requirements 7.2**
  
  - [ ]* 10.3 Write property test for error isolation
    - **Property 31: Error Isolation**
    - **Validates: Requirements 9.7**

- [x] 11. Extend start command handler
  - [x] 11.1 Add deep link token handling to start command
    - Extract token from /start command
    - Call deliverContent() if token is present
    - Fall back to regular start behavior if no token
    - _Requirements: 3.1, 3.2_
  
  - [ ]* 11.2 Write unit tests for start command routing
    - Test /start with token routes to delivery
    - Test /start without token routes to regular handler
    - _Requirements: 3.1, 3.2_

- [x] 12. Implement analytics methods
  - [x] 12.1 Implement getStats() method
    - Aggregate totalCaptures, totalMarketingPosts, totalDeliveries
    - Calculate unique recipients count
    - Calculate average deliveries per post
    - Fetch recent posts
    - _Requirements: 8.6_
  
  - [ ]* 12.2 Write property test for stats aggregation
    - **Property 27: Stats Aggregation**
    - **Validates: Requirements 8.6**
  
  - [x] 12.3 Implement getPostStats() method
    - Get delivery count for specific post
    - Get unique recipients count
    - Fetch recent deliveries
    - _Requirements: 8.7_
  
  - [ ]* 12.4 Write property test for per-post delivery count
    - **Property 26: Per-Post Delivery Count**
    - **Validates: Requirements 8.7**

- [x] 13. Implement error handling and resilience
  - [x] 13.1 Add vault access error handling
    - Detect when bot cannot access vault group
    - Mark configuration as inactive
    - Log error for monitoring
    - _Requirements: 9.1_
  
  - [ ]* 13.2 Write property test for vault access error handling
    - **Property 28: Vault Access Error Handling**
    - **Validates: Requirements 9.1**
  
  - [x] 13.3 Add marketing group access error handling
    - Detect when bot cannot access marketing group
    - Queue marketing post for retry
    - Log error for monitoring
    - _Requirements: 9.2_
  
  - [ ]* 13.4 Write property test for marketing group error handling
    - **Property 29: Marketing Group Access Error Handling**
    - **Validates: Requirements 9.2**
  
  - [x] 13.5 Add delivery retry on network errors
    - Retry up to 3 times with exponential backoff
    - Log errors for monitoring
    - _Requirements: 9.3_
  
  - [ ]* 13.6 Write property test for delivery retry
    - **Property 30: Delivery Retry on Network Error**
    - **Validates: Requirements 9.3**
  
  - [x] 13.7 Add admin permission detection
    - Check bot admin status periodically
    - Notify user when permissions are lost
    - _Requirements: 9.5_
  
  - [ ]* 13.8 Write property test for admin permission detection
    - **Property 32: Admin Permission Detection**
    - **Validates: Requirements 9.5**

- [x] 14. Create API endpoints
  - [x] 14.1 Create POST /api/promoter/config endpoint
    - Accept configuration data
    - Validate inputs
    - Call promoterService.create()
    - Return created configuration
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  
  - [x] 14.2 Create GET /api/promoter/config endpoint
    - Accept optional botId filter
    - Call promoterService.list()
    - Return configurations
    - _Requirements: 5.1_
  
  - [x] 14.3 Create GET /api/promoter/config/:id endpoint
    - Call promoterService.getById()
    - Return configuration details
    - _Requirements: 5.1_
  
  - [x] 14.4 Create PATCH /api/promoter/config/:id endpoint
    - Accept configuration updates
    - Call promoterService.update()
    - Return updated configuration
    - _Requirements: 7.1, 7.6_
  
  - [x] 14.5 Create DELETE /api/promoter/config/:id endpoint
    - Call promoterService.delete()
    - Return success response
    - _Requirements: 5.1_
  
  - [x] 14.6 Create POST /api/promoter/config/:id/toggle endpoint
    - Call promoterService.toggleActive()
    - Return updated configuration
    - _Requirements: 7.7_
  
  - [x] 14.7 Create GET /api/promoter/config/:id/stats endpoint
    - Call promoterService.getStats()
    - Return analytics data
    - _Requirements: 8.6_
  
  - [x] 14.8 Create GET /api/promoter/post/:id/stats endpoint
    - Call promoterService.getPostStats()
    - Return post-specific analytics
    - _Requirements: 8.7_

- [ ]* 14.9 Write integration tests for API endpoints
  - Test all CRUD operations
  - Test validation errors
  - Test authentication and authorization
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 7.1, 7.6, 7.7, 8.6, 8.7_

- [x] 15. Create frontend UI components
  - [x] 15.1 Create PromoterConfigList component
    - Display list of promoter configurations
    - Show stats (captures, posts, deliveries)
    - Add create, edit, delete, toggle actions
    - _Requirements: 5.1, 7.7, 8.6_
  
  - [x] 15.2 Create PromoterConfigForm component
    - Form for creating/editing configurations
    - Bot, vault, and marketing group selectors
    - CTA template editor
    - Token expiration settings
    - Custom error message editors
    - _Requirements: 5.2, 5.3, 5.4, 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 15.3 Create PromoterStats component
    - Display configuration-level stats
    - Display per-post stats
    - Show recent deliveries
    - _Requirements: 8.6, 8.7_
  
  - [x] 15.4 Create PromoterPostList component
    - Display captured posts with tokens
    - Show delivery counts
    - Copy deep link button
    - _Requirements: 8.7_

- [x] 16. Add token expiration background job
  - [x] 16.1 Create expireOldTokens() method
    - Query for posts past expiration date
    - Mark as expired
    - Return count of expired tokens
    - _Requirements: 4.6_
  
  - [x] 16.2 Create scheduled job to run expiration
    - Run every hour
    - Call expireOldTokens()
    - Log results
    - _Requirements: 4.6_
  
  - [ ]* 16.3 Write property test for token expiration configuration
    - **Property 22: Token Expiration Configuration**
    - **Validates: Requirements 7.5**

- [x] 17. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 18. Integration and documentation
  - [x] 18.1 Update API documentation
    - Document all new endpoints
    - Add request/response examples
    - Document error codes
  
  - [x] 18.2 Update user documentation
    - Write setup guide for Promoter 2.0
    - Document configuration options
    - Add troubleshooting section
  
  - [x] 18.3 Add monitoring and logging
    - Log all captures, posts, and deliveries
    - Add metrics for rate limiting events
    - Add alerts for permission errors

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- The implementation follows the existing codebase patterns (ForwardRule, AutoDropRule)
- All database operations use Prisma transactions for consistency
- Rate limiting follows the established pattern from channel-post handler
