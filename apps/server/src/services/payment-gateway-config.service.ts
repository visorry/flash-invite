import db, { PaymentGateway } from '@super-invite/db'
import { BadRequestError, NotFoundError } from '../errors/http-exception'

export interface PaymentGatewayConfigData {
  gateway: PaymentGateway
  isActive?: boolean
  isDefault?: boolean
  merchantId?: string
  saltKey?: string
  saltIndex?: number
  environment?: string
  webhookSecret?: string
  metadata?: any
}

class PaymentGatewayConfigService {
  /**
   * Get the default/active payment gateway configuration
   */
  async getActiveGateway() {
    const config = await db.paymentGatewayConfig.findFirst({
      where: {
        isActive: true,
        isDefault: true,
      },
    })

    if (!config) {
      // Fallback to Cashfree using env vars if no config exists
      return {
        gateway: PaymentGateway.CASHFREE,
        merchantId: process.env.CASHFREE_APP_ID,
        saltKey: process.env.CASHFREE_SECRET_KEY,
        environment: process.env.CASHFREE_ENV || 'SANDBOX',
        webhookSecret: process.env.CASHFREE_WEBHOOK_SECRET,
      }
    }

    return config
  }

  /**
   * Get all payment gateway configurations
   */
  async getAllConfigs() {
    return db.paymentGatewayConfig.findMany({
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Get a specific gateway configuration
   */
  async getConfig(id: string) {
    const config = await db.paymentGatewayConfig.findUnique({
      where: { id },
    })

    if (!config) {
      throw new NotFoundError('Payment gateway configuration not found')
    }

    return config
  }

  /**
   * Create or update a payment gateway configuration
   */
  async upsertConfig(data: PaymentGatewayConfigData) {
    // If setting this as default, unset all other defaults
    if (data.isDefault) {
      await db.paymentGatewayConfig.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      })
    }

    // Check if config for this gateway already exists
    const existing = await db.paymentGatewayConfig.findFirst({
      where: { gateway: data.gateway },
    })

    if (existing) {
      return db.paymentGatewayConfig.update({
        where: { id: existing.id },
        data,
      })
    }

    return db.paymentGatewayConfig.create({
      data,
    })
  }

  /**
   * Set a gateway as the default
   */
  async setDefault(id: string) {
    const config = await this.getConfig(id)

    // Unset all other defaults
    await db.paymentGatewayConfig.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    })

    // Set this one as default and active
    return db.paymentGatewayConfig.update({
      where: { id },
      data: {
        isDefault: true,
        isActive: true,
      },
    })
  }

  /**
   * Toggle active status
   */
  async toggleActive(id: string) {
    const config = await this.getConfig(id)

    return db.paymentGatewayConfig.update({
      where: { id },
      data: {
        isActive: !config.isActive,
      },
    })
  }

  /**
   * Delete a configuration
   */
  async deleteConfig(id: string) {
    const config = await this.getConfig(id)

    if (config.isDefault) {
      throw new BadRequestError('Cannot delete the default payment gateway')
    }

    return db.paymentGatewayConfig.delete({
      where: { id },
    })
  }
}

export default new PaymentGatewayConfigService()
