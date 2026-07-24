import { createHmac, timingSafeEqual } from 'node:crypto'
import type {
  CreateRecipientParams,
  CreateRecipientResult,
  InitializeTransactionParams,
  InitializeTransactionResult,
  InitiateTransferParams,
  InitiateTransferResult,
  PaymentProvider,
  VerifyTransactionResult,
} from './provider'

const PAYSTACK_BASE_URL = 'https://api.paystack.co'

function secretKey(): string {
  const key = process.env.PAYSTACK_SECRET_KEY
  if (!key) throw new Error('PAYSTACK_SECRET_KEY is not set')
  return key
}

async function paystackFetch(path: string, init?: RequestInit) {
  const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  const body = await response.json()
  if (!response.ok || body.status === false) {
    throw new Error(body.message ?? `Paystack request to ${path} failed`)
  }
  return body
}

export const paystackProvider: PaymentProvider = {
  async initializeTransaction(params: InitializeTransactionParams): Promise<InitializeTransactionResult> {
    const body = await paystackFetch('/transaction/initialize', {
      method: 'POST',
      body: JSON.stringify({
        amount: params.amountCents,
        email: params.email,
        reference: params.reference,
        callback_url: params.callbackUrl,
        currency: 'ZAR',
        metadata: params.metadata,
      }),
    })
    return {
      authorizationUrl: body.data.authorization_url,
      providerReference: body.data.reference,
    }
  },

  async verifyTransaction(reference: string): Promise<VerifyTransactionResult> {
    const body = await paystackFetch(`/transaction/verify/${encodeURIComponent(reference)}`)
    return {
      success: body.data.status === 'success',
      amountCents: body.data.amount,
      reference: body.data.reference,
      channel: body.data.channel ?? null,
    }
  },

  async createRecipient(params: CreateRecipientParams): Promise<CreateRecipientResult> {
    const body = await paystackFetch('/transferrecipient', {
      method: 'POST',
      body: JSON.stringify({
        type: 'basa',
        name: params.accountName,
        account_number: params.accountNumber,
        bank_code: params.bankCode,
        currency: 'ZAR',
      }),
    })
    return { recipientCode: body.data.recipient_code }
  },

  async initiateTransfer(params: InitiateTransferParams): Promise<InitiateTransferResult> {
    const body = await paystackFetch('/transfer', {
      method: 'POST',
      body: JSON.stringify({
        source: 'balance',
        amount: params.amountCents,
        recipient: params.recipientCode,
        reference: params.reference,
        reason: params.reason,
      }),
    })
    return { transferCode: body.data.transfer_code }
  },

  verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
    if (!signature) return false
    const expected = createHmac('sha512', secretKey()).update(rawBody).digest('hex')
    const expectedBuffer = Buffer.from(expected, 'utf8')
    const signatureBuffer = Buffer.from(signature, 'utf8')
    if (expectedBuffer.length !== signatureBuffer.length) return false
    return timingSafeEqual(expectedBuffer, signatureBuffer)
  },
}
