export enum DeliveryMode {
    SCHEDULED = 0,
    ON_DEMAND = 1,
}

export interface OnDemandConfig {
    randomSelection: boolean
    totalPostsInSource?: number
    deleteAfterEnabled: boolean
    deleteTimeout: number
    vipMessage?: string
    vipMessageEnabled: boolean
    cooldownEnabled: boolean
    cooldownSeconds: number
    welcomeMessage?: string
}

export interface AutoDropRequestResult {
    success: boolean
    messagesSent: number
    cooldownRemaining?: number
    error?: string
    vipMessageSent?: boolean
}

export interface RandomPostSelection {
    postIds: number[]
    sourceId: string
    count: number
}
