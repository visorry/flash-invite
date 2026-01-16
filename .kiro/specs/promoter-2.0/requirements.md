# Requirements Document: Promoter 2.0

## Introduction

Promoter 2.0 is a content promotion and delivery system that enables users to create a two-tier marketing funnel using Telegram. The system consists of a private Content Vault group where original media is stored, a public Marketing group where promotional content with deep links is posted, and a bot that handles deep link delivery to end users. This creates a seamless flow from content storage → marketing → user delivery without exposing the original media publicly.

## Glossary

- **Content_Vault_Group**: A private Telegram group where the bot is admin and original media content is uploaded
- **Marketing_Group**: A public Telegram group where the bot posts promotional content with deep links
- **Promoter_Bot**: The Telegram bot that captures content, generates deep links, and delivers media to users
- **Deep_Link**: A Telegram bot start link in the format `https://t.me/BotUsername?start={token}`
- **Promotion_Token**: A unique identifier that maps a deep link to stored media content
- **Media_Post**: A Telegram message containing photo, video, or document with optional caption
- **Marketing_Post**: A promotional message in the Marketing_Group containing a caption and deep link CTA
- **File_ID**: Telegram's unique identifier for uploaded media files that enables re-sending without re-upload
- **CTA**: Call-to-action text that encourages users to click the deep link

## Requirements

### Requirement 1: Content Vault Management

**User Story:** As a content creator, I want to upload media to a private vault group, so that my original content is stored securely and can be promoted without public exposure.

#### Acceptance Criteria

1. WHEN a user adds the Promoter_Bot to a Telegram group as admin, THE System SHALL register it as a Content_Vault_Group
2. WHEN a Media_Post is sent to the Content_Vault_Group, THE Promoter_Bot SHALL capture the message immediately
3. WHEN capturing a Media_Post, THE Promoter_Bot SHALL extract the File_ID for the media
4. WHEN capturing a Media_Post, THE Promoter_Bot SHALL extract the caption text if present
5. WHEN capturing a Media_Post, THE Promoter_Bot SHALL determine the media type (photo, video, or document)
6. WHEN a Media_Post is captured, THE Promoter_Bot SHALL generate a unique Promotion_Token
7. WHEN storing a Media_Post, THE System SHALL persist the Promotion_Token, File_ID, media type, caption, and timestamp
8. THE System SHALL support storing at least 1000 Media_Posts per Content_Vault_Group

### Requirement 2: Marketing Post Generation

**User Story:** As a content creator, I want promotional posts automatically created in my marketing group, so that I can drive traffic through deep links without manual work.

#### Acceptance Criteria

1. WHEN a Media_Post is captured from the Content_Vault_Group, THE Promoter_Bot SHALL automatically create a Marketing_Post
2. WHEN creating a Marketing_Post, THE Promoter_Bot SHALL use the original caption or a configured default caption
3. WHEN creating a Marketing_Post, THE Promoter_Bot SHALL generate a Deep_Link using the Promotion_Token
4. WHEN creating a Marketing_Post, THE Promoter_Bot SHALL include the Deep_Link as a CTA in the message
5. WHEN creating a Marketing_Post, THE Promoter_Bot SHALL send it to the configured Marketing_Group
6. THE Marketing_Post SHALL NOT contain the original media (photo, video, or document)
7. THE Marketing_Post SHALL be text-only with the Deep_Link

### Requirement 3: Deep Link Delivery

**User Story:** As an end user, I want to click a deep link and receive the original content, so that I can access the promoted media easily.

#### Acceptance Criteria

1. WHEN a user clicks a Deep_Link, THE Telegram app SHALL open the Promoter_Bot
2. WHEN the Promoter_Bot receives a `/start {token}` command, THE System SHALL extract the Promotion_Token
3. WHEN a Promotion_Token is received, THE System SHALL validate it exists in the database
4. WHEN a valid Promotion_Token is received, THE System SHALL retrieve the associated File_ID, media type, and caption
5. WHEN delivering content, THE Promoter_Bot SHALL send the media to the user using the stored File_ID
6. WHEN delivering content, THE Promoter_Bot SHALL include the original caption if present
7. WHEN an invalid Promotion_Token is received, THE Promoter_Bot SHALL send an error message to the user
8. WHEN an expired Promotion_Token is received, THE Promoter_Bot SHALL send an error message to the user

### Requirement 4: Token Management

**User Story:** As a system administrator, I want tokens to be unique and secure, so that content delivery is reliable and cannot be guessed.

#### Acceptance Criteria

1. WHEN generating a Promotion_Token, THE System SHALL create a cryptographically random string
2. THE Promotion_Token SHALL be at least 16 characters long
3. THE Promotion_Token SHALL be URL-safe (alphanumeric and hyphens only)
4. WHEN generating a Promotion_Token, THE System SHALL verify it does not already exist in the database
5. THE System SHALL support at least 1 million unique Promotion_Tokens per bot
6. WHERE token expiration is configured, THE System SHALL mark tokens as expired after the configured duration
7. WHEN a token is marked as expired, THE System SHALL reject delivery requests for that token

### Requirement 5: Multi-Bot Support

**User Story:** As a platform user, I want to create multiple promoter configurations with different bots, so that I can manage separate content campaigns.

#### Acceptance Criteria

1. THE System SHALL allow a user to create multiple Promoter configurations
2. WHEN creating a Promoter configuration, THE System SHALL require a Bot selection
3. WHEN creating a Promoter configuration, THE System SHALL require a Content_Vault_Group selection
4. WHEN creating a Promoter configuration, THE System SHALL require a Marketing_Group selection
5. THE System SHALL validate that the selected Bot is admin in both groups
6. THE System SHALL prevent duplicate configurations for the same Bot and Content_Vault_Group combination
7. WHEN a Bot receives a message, THE System SHALL route it to the correct Promoter configuration

### Requirement 6: Rate Limiting and Safety

**User Story:** As a system operator, I want the system to respect Telegram rate limits, so that bots are not banned or throttled.

#### Acceptance Criteria

1. WHEN sending Marketing_Posts, THE System SHALL enforce a minimum 3-second delay between posts
2. WHEN delivering content to users, THE System SHALL enforce a minimum 1-second delay between deliveries
3. WHEN a Telegram rate limit error (429) is received, THE System SHALL retry with exponential backoff
4. THE System SHALL wait for the `retry_after` value provided by Telegram before retrying
5. WHEN retrying after rate limit, THE System SHALL attempt up to 3 retries before failing
6. WHEN a Bot is rate limited, THE System SHALL log the event for monitoring
7. THE System SHALL track the last send time per Bot to prevent concurrent rate limit violations

### Requirement 7: Configuration Management

**User Story:** As a content creator, I want to configure my promoter settings, so that I can customize captions, CTAs, and behavior.

#### Acceptance Criteria

1. WHEN creating a Promoter configuration, THE System SHALL allow setting a custom CTA template
2. WHEN creating a Promoter configuration, THE System SHALL allow enabling/disabling auto-posting to Marketing_Group
3. WHEN creating a Promoter configuration, THE System SHALL allow setting a custom error message for invalid tokens
4. WHEN creating a Promoter configuration, THE System SHALL allow setting a custom error message for expired tokens
5. WHERE token expiration is enabled, THE System SHALL allow configuring the expiration duration
6. THE System SHALL allow editing Promoter configuration settings after creation
7. THE System SHALL allow enabling/disabling a Promoter configuration without deleting it

### Requirement 8: Analytics and Tracking

**User Story:** As a content creator, I want to track how my promoted content performs, so that I can measure engagement and optimize my campaigns.

#### Acceptance Criteria

1. WHEN a Media_Post is captured, THE System SHALL increment a capture counter
2. WHEN a Marketing_Post is created, THE System SHALL increment a marketing post counter
3. WHEN content is delivered via Deep_Link, THE System SHALL increment a delivery counter for that Promotion_Token
4. WHEN content is delivered, THE System SHALL record the delivery timestamp
5. WHEN content is delivered, THE System SHALL record the recipient's Telegram user ID
6. THE System SHALL provide a view of total captures, marketing posts, and deliveries per Promoter configuration
7. THE System SHALL provide a view of delivery count per individual Media_Post

### Requirement 9: Error Handling and Resilience

**User Story:** As a system operator, I want the system to handle errors gracefully, so that temporary failures do not cause data loss or system crashes.

#### Acceptance Criteria

1. WHEN the Promoter_Bot cannot access the Content_Vault_Group, THE System SHALL log an error and mark the configuration as inactive
2. WHEN the Promoter_Bot cannot access the Marketing_Group, THE System SHALL log an error and queue the Marketing_Post for retry
3. WHEN media delivery fails due to network error, THE System SHALL retry up to 3 times with exponential backoff
4. WHEN a database write fails, THE System SHALL log the error and return a failure response
5. WHEN the Promoter_Bot loses admin permissions, THE System SHALL detect this and notify the user
6. WHEN an unexpected error occurs, THE System SHALL log the full error details for debugging
7. THE System SHALL continue processing other messages even if one message fails

### Requirement 10: Database Schema and Storage

**User Story:** As a developer, I want a well-structured database schema, so that the system is maintainable and scalable.

#### Acceptance Criteria

1. THE System SHALL create a `PromoterConfig` table to store promoter configurations
2. THE System SHALL create a `PromoterPost` table to store captured media posts
3. THE System SHALL create a `PromoterDelivery` table to track content deliveries
4. THE `PromoterConfig` table SHALL reference the Bot, Content_Vault_Group, and Marketing_Group
5. THE `PromoterPost` table SHALL store token, file_id, media_type, caption, and timestamps
6. THE `PromoterDelivery` table SHALL store token, recipient user ID, and delivery timestamp
7. THE System SHALL create appropriate indexes on token fields for fast lookups
8. THE System SHALL create appropriate indexes on foreign keys for efficient joins
