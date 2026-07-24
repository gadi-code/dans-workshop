import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { paystackProvider } from '@/lib/payments/paystack'

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-paystack-signature')

  if (!paystackProvider.verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const event = JSON.parse(rawBody)
  const supabase = createAdminClient()

  switch (event.event) {
    case 'charge.success': {
      const reference = event.data.reference as string
      const { data: payment } = await supabase
        .from('payments')
        .select('id, status, amount_cents')
        .eq('provider_reference', reference)
        .maybeSingle()

      // Idempotency: a webhook retry for an already-captured payment is a no-op.
      if (payment && payment.status !== 'captured') {
        const verification = await paystackProvider.verifyTransaction(reference)
        if (verification.success && verification.amountCents === payment.amount_cents) {
          await supabase.from('payments').update({ status: 'captured' }).eq('id', payment.id)
        }
      }
      break
    }
    case 'charge.failed': {
      const reference = event.data.reference as string
      await supabase.from('payments').update({ status: 'failed' }).eq('provider_reference', reference)
      break
    }
    case 'transfer.success': {
      const reference = event.data.reference as string
      await supabase.from('payouts').update({ status: 'paid' }).eq('payout_reference', reference)
      break
    }
    case 'transfer.failed':
    case 'transfer.reversed': {
      const reference = event.data.reference as string
      await supabase.from('payouts').update({ status: 'failed' }).eq('payout_reference', reference)
      break
    }
  }

  return NextResponse.json({ received: true })
}
