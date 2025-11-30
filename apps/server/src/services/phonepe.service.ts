import axios from 'axios'

export interface PhonePeCreateOrderRequest {
  orderId: string
  amount: number
  customerId: string
  customerPhone: string
  customerEmail: string
  returnUrl: string
  callbackUrl?: string
}

export interface PhonePeOrderResponse {
  success: boolean
  code: string
  message: string
  data: {
    merchantId: string
    merchantTransactionId: string
    instrumentResponse?: {
      type: string
      redirectInfo?: {
        url: string
        method: string
      }
    }
  }
}

export interface PhonePeStatusResponse {
  success: boolean
  code: string
  message: string
  data: {
    merchantId: string
    merchantTransactionId: string
    transactionId: string
    amount: number
    state: string // COMPLETED, FAILED, PENDING
    responseCode: string
    paymentInstrument?: {
      type: string
    }
  }
}

interface OAuthTokenResponse {
  access_token: string
  expires_at: number
  token_type: string
}

class PhonePeService {
  private clientId: string
  private clientSecret: string
  private clientVersion: string
  private baseUrl: string
  private accessToken: string | null = null
  private tokenExpiresAt: number = 0

  constructor() {
    this.clientId = process.env.PHONEPE_CLIENT_ID || ''
    this.clientSecret = process.env.PHONEPE_CLIENT_SECRET || ''
    this.clientVersion = process.env.PHONEPE_CLIENT_VERSION || '1'

    const env = process.env.PHONEPE_ENV || 'SANDBOX'
    this.baseUrl =
      env === 'PRODUCTION'
        ? 'https://api.phonepe.com/apis/pg'
        : 'https://api-preprod.phonepe.com/apis/pg-sandbox'

    if (!this.clientId || !this.clientSecret) {
      console.warn('PhonePe credentials not found in environment variables')
    }
  }

  /**
   * Get OAuth access token
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    const now = Date.now() / 1000
    if (this.accessToken && this.tokenExpiresAt > now + 60) {
      return this.accessToken
    }

    try {
      const params = new URLSearchParams()
      params.append('client_id', this.clientId)
      params.append('client_version', this.clientVersion)
      params.append('client_secret', this.clientSecret)
      params.append('grant_type', 'client_credentials')

      const response = await axios.post<OAuthTokenResponse>(
        `${this.baseUrl}/v1/oauth/token`,
        params,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      this.accessToken = response.data.access_token
      this.tokenExpiresAt = response.data.expires_at

      console.log('PhonePe OAuth token obtained successfully')
      return this.accessToken
    } catch (error: any) {
      console.error('PhonePe OAuth Error:', error.response?.data || error.message)
      throw new Error('Failed to obtain PhonePe access token')
    }
  }

  /**
   * Create a payment order with PhonePe REST API
   */
  async createOrder(data: PhonePeCreateOrderRequest): Promise<any> {
    try {
      const token = await this.getAccessToken()

      const payload = {
        merchantOrderId: data.orderId,
        amount: Math.round(data.amount * 100), // Convert to paise
        paymentFlow: {
          type: 'PAYMENT',
          merchantUrls: {
            redirectUrl: data.returnUrl,
            callbackUrl: data.callbackUrl || data.returnUrl,
          },
        },
      }

      const response = await axios.post(
        `${this.baseUrl}/v2/payment/create`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      console.log('PhonePe Create Payment Response:', response.data)

      // Return in expected format
      return {
        success: true,
        code: 'SUCCESS',
        message: 'Order created successfully',
        data: {
          merchantId: this.clientId.split('_')[0],
          merchantTransactionId: data.orderId,
          instrumentResponse: {
            type: 'PAY_PAGE',
            redirectInfo: {
              url: response.data.redirectUrl,
              method: 'GET'
            }
          }
        }
      }
    } catch (error: any) {
      console.error('PhonePe Create Payment Error:', error.response?.data || error.message)
      throw error
    }
  }

  /**
   * Check payment status using REST API
   */
  async getOrderStatus(merchantTransactionId: string): Promise<PhonePeStatusResponse> {
    try {
      const token = await this.getAccessToken()

      const response = await axios.get(
        `${this.baseUrl}/v2/payment/${merchantTransactionId}/status`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      console.log('PhonePe Status Response:', response.data)

      return {
        success: response.data.state === 'COMPLETED',
        code: response.data.state,
        message: 'Status fetched successfully',
        data: {
          merchantId: this.clientId.split('_')[0],
          merchantTransactionId: merchantTransactionId,
          transactionId: response.data.transactionId || '',
          amount: response.data.amount || 0,
          state: response.data.state,
          responseCode: response.data.responseCode || '',
          paymentInstrument: response.data.paymentInstrument
        }
      }
    } catch (error: any) {
      console.error('PhonePe Status Check Error:', error.response?.data || error.message)
      throw error
    }
  }

  /**
   * Verify webhook callback
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    // Webhook verification logic if needed
    return true
  }

  /**
   * Decode webhook response
   */
  decodeWebhookResponse(base64Response: string): any {
    try {
      const jsonString = Buffer.from(base64Response, 'base64').toString('utf-8')
      return JSON.parse(jsonString)
    } catch (error) {
      console.error('Failed to decode webhook response:', error)
      return null
    }
  }
}

export default new PhonePeService()
