export type InitializeTransactionParams = {
  amountCents: number
  email: string
  reference: string
  callbackUrl: string
  metadata: Record<string, string>
}

export type InitializeTransactionResult = {
  authorizationUrl: string
  providerReference: string
}

export type VerifyTransactionResult = {
  success: boolean
  amountCents: number
  reference: string
  channel: string | null
}

export type CreateRecipientParams = {
  accountNumber: string
  bankCode: string
  accountName: string
}

export type CreateRecipientResult = {
  recipientCode: string
}

export type InitiateTransferParams = {
  amountCents: number
  recipientCode: string
  reference: string
  reason: string
}

export type InitiateTransferResult = {
  transferCode: string
}

export interface PaymentProvider {
  initializeTransaction(params: InitializeTransactionParams): Promise<InitializeTransactionResult>
  verifyTransaction(reference: string): Promise<VerifyTransactionResult>
  createRecipient(params: CreateRecipientParams): Promise<CreateRecipientResult>
  initiateTransfer(params: InitiateTransferParams): Promise<InitiateTransferResult>
  verifyWebhookSignature(rawBody: string, signature: string | null): boolean
}
