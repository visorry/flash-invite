/**
 * Default subscription plans configuration
 * This file defines the default plans that should be created in the system
 */

export const DEFAULT_PLANS = [
    {
        name: 'Free',
        description: 'Perfect for getting started',
        type: 0, // SUBSCRIPTION
        interval: 2, // LIFETIME
        price: 0,
        tokensIncluded: 100,
        maxGroups: 2,
        maxInvitesPerDay: 50,
        isActive: true,
        features: [
            'Up to 2 groups',
            '50 invites per day',
            '100 tokens included',
            'Basic analytics',
        ],
    },
    {
        name: 'Starter',
        description: 'Great for small teams',
        type: 0, // SUBSCRIPTION
        interval: 0, // MONTHLY
        price: 499,
        tokensIncluded: 500,
        maxGroups: 5,
        maxInvitesPerDay: 200,
        isActive: true,
        features: [
            'Up to 5 groups',
            '200 invites per day',
            '500 tokens included',
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
        maxGroups: 15,
        maxInvitesPerDay: 500,
        isActive: true,
        features: [
            'Up to 15 groups',
            '500 invites per day',
            '1500 tokens included',
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
        maxGroups: null, // Unlimited
        maxInvitesPerDay: null, // Unlimited
        isActive: true,
        features: [
            'Unlimited groups',
            'Unlimited invites',
            '5000 tokens included',
            'Advanced analytics',
            'Priority support',
            'Custom branding',
            'Dedicated account manager',
            'API access',
        ],
    },
    {
        name: 'Pro Yearly',
        description: 'Save 20% with annual billing',
        type: 0, // SUBSCRIPTION
        interval: 1, // YEARLY
        price: 9590, // ~799/month (20% discount)
        tokensIncluded: 18000,
        maxGroups: 15,
        maxInvitesPerDay: 500,
        isActive: true,
        features: [
            'Up to 15 groups',
            '500 invites per day',
            '18000 tokens included',
            'Advanced analytics',
            'Priority support',
            'Custom branding',
            'Save 20% vs monthly',
        ],
    },
]
