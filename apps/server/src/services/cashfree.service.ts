import axios from 'axios'
import crypto from 'crypto'
import { BadRequestError } from '../errors/http-exception'

const CASHFREE_API_VERSION = '2022-09-01'

export interface CreateOrderRequest {
  orderId: string
  amount: number
  currency: string
  customerId: string
  customerPhone: string
  customerEmail: string
  returnUrl: string
  notifyUrl?: string
}

export interface CashfreeOrderResponse {
  cf_order_id: number
  order_id: string
  entity: string
  order_currency: string
  order_amount: number
  order_status: string
  payment_session_id: string
  order_expiry_time: string
  order_note: string
}

class CashfreeService {
  private appId: string
  private secretKey: string
  private baseUrl: string

  constructor() {
    this.appId = process.env.CASHFREE_APP_ID || ''
    this.secretKey = process.env.CASHFREE_SECRET_KEY || ''
    const env = process.env.CASHFREE_ENV || 'SANDBOX'
    this.baseUrl =
      env === 'PRODUCTION'
        ? 'https://api.cashfree.com/pg'
        : 'https://sandbox.cashfree.com/pg'

    // Startup logging
    console.log('[Cashfree] ========== Configuration ==========')
    console.log('[Cashfree] Environment:', env)
    console.log('[Cashfree] Base URL:', this.baseUrl)
    console.log('[Cashfree] App ID present:', !!this.appId)
    console.log('[Cashfree] App ID (first 10 chars):', this.appId ? this.appId.substring(0, 10) + '...' : 'NOT SET')
    console.log('[Cashfree] Secret Key present:', !!this.secretKey)
    console.log('[Cashfree] Secret Key (first 10 chars):', this.secretKey ? this.secretKey.substring(0, 10) + '...' : 'NOT SET')
    console.log('[Cashfree] ====================================')

    if (!this.appId || !this.secretKey) {
      console.error('[Cashfree] ❌ CRITICAL: Cashfree credentials not found in environment variables!')
      console.error('[Cashfree] Make sure CASHFREE_APP_ID and CASHFREE_SECRET_KEY are set')
    }
  }

  private getHeaders() {
    return {
      'x-client-id': this.appId,
      'x-client-secret': this.secretKey,
      'x-api-version': CASHFREE_API_VERSION,
      'Content-Type': 'application/json',
    }
  }

  async createOrder(data: CreateOrderRequest): Promise<CashfreeOrderResponse> {
    const payload = {
      order_id: data.orderId,
      order_amount: data.amount,
      order_currency: data.currency,
      customer_details: {
        customer_id: data.customerId,
        customer_email: data.customerEmail,
        customer_phone: data.customerPhone,
      },
      order_meta: {
        return_url: data.returnUrl,
        notify_url: data.notifyUrl,
      },
    }

    try {
      console.log('[Cashfree] Creating order with payload:', JSON.stringify(payload, null, 2))
      console.log('[Cashfree] Using environment:', this.baseUrl)
      console.log('[Cashfree] App ID:', this.appId.substring(0, 10) + '...')

      const response = await axios.post(
        `${this.baseUrl}/orders`,
        payload,
        { headers: this.getHeaders() }
      )

      console.log('[Cashfree] Order created successfully:', response.data)
      return response.data
    } catch (error: any) {
      console.error('[Cashfree] Order creation failed')
      console.error('[Cashfree] Error status:', error.response?.status)
      console.error('[Cashfree] Error data:', JSON.stringify(error.response?.data, null, 2))
      console.error('[Cashfree] Error message:', error.message)

      // Re-throw with more context
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message
      throw new BadRequestError(`Cashfree order creation failed: ${errorMessage}`)
    }
  }

  async getOrder(orderId: string): Promise<CashfreeOrderResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/orders/${orderId}`,
        { headers: this.getHeaders() }
      )
      return response.data
    } catch (error: any) {
      console.error('[Cashfree] Get order failed for:', orderId)
      console.error('[Cashfree] Error:', error.response?.data || error.message)
      throw new BadRequestError(`Cashfree get order failed: ${error.response?.data?.message || error.message}`)
    }
  }

  verifySignature(
    orderId: string,
    orderAmount: number,
    referenceId: string,
    txStatus: string,
    paymentMode: string,
    msg: string,
    txtTime: string,
    signature: string
  ): boolean {
    const data = `${orderId}${orderAmount}${referenceId}${txStatus}${paymentMode}${msg}${txtTime}`
    const generatedSignature = crypto
      .createHmac('sha256', this.secretKey)
      .update(data)
      .digest('base64')
    return generatedSignature === signature
  }

  verifyWebhookSignature(timestamp: string, payload: string, signature: string): boolean {
    const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET || ''

    if (!webhookSecret) {
      console.warn('CASHFREE_WEBHOOK_SECRET not configured')
      return false
    }

    // Cashfree concatenates timestamp + rawBody for signature
    const signatureData = timestamp + payload

    // Cashfree uses HMAC SHA256 for webhook signature
    const computedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(signatureData)
      .digest('base64')

    console.log('Signature Data:', signatureData.substring(0, 100) + '...')
    console.log('Computed Signature:', computedSignature)
    console.log('Received Signature:', signature)
    return computedSignature === signature
  }
}

export default new CashfreeService()
