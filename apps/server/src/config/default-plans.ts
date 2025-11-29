/**
 * Default subscription plans configuration
 * This file defines the default plans that should be created in the system
 */

export const DEFAULT_PLANS = [
    {
        name: 'Starter',
        description: 'Perfect for getting started',
        type: 0, // SUBSCRIPTION
        interval: 0, // MONTHLY
        price: 499,
        tokensIncluded: 500,
        dailyTokens: 10,
        maxGroups: 5,
        maxInvitesPerDay: 200,
        isActive: true,
        features: [
            'Up to 5 groups',
            '200 invites per day',
            '500 tokens included',
            '10 daily tokens on login',
            'Advanced analytics',
            'Priority support',
        ],
    },
    {
        name: 'Pro',
        description: 'For growing businesses',
        type: 0, // SUBSCRIPTION
        interval: 0, // MONTHLY
        price: 999,
        tokensIncluded: 1500,
        dailyTokens: 30,
        maxGroups: 15,
        maxInvitesPerDay: 500,
        isActive: true,
        features: [
            'Up to 15 groups',
            '500 invites per day',
            '1500 tokens included',
            '30 daily tokens on login',
            'Advanced analytics',
            'Priority support',
            'Custom branding',
        ],
    },
    {
        name: 'Business',
        description: 'For large organizations',
        type: 0, // SUBSCRIPTION
        interval: 0, // MONTHLY
        price: 2499,
        tokensIncluded: 5000,
        dailyTokens: 100,
        maxGroups: null, // Unlimited
        maxInvitesPerDay: null, // Unlimited
        isActive: true,
        features: [
            'Unlimited groups',
            'Unlimited invites',
            '5000 tokens included',
            '100 daily tokens on login',
            'Advanced analytics',
            'Priority support',
            'Custom branding',
            'Dedicated account manager',
            'API access',
        ],
    },
]
