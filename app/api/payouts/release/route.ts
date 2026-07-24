import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { paystackProvider } from '@/lib/payments/paystack'

// Admin/internal only -- gated on a shared secret since there's no admin
// dashboard yet. Intentionally manual (not auto-triggered on job completion)
// until the payment-confirmation pipeline has a production track record.
const PLATFORM_FEE_PERCENT = 10

export async function POST(request: Request) {
  const adminSecret = process.env.INTERNAL_ADMIN_SECRET
  const providedSecret = request.headers.get('x-admin-secret')

  if (!adminSecret || providedSecret !== adminSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { jobId } = await request.json()
  const supabase = createAdminClient()

  const { data: job } = await supabase.from('jobs').select('id, provider_id').eq('id', jobId).single()
  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  const { data: payment } = await supabase
    .from('payments')
    .select('id, status, amount_cents')
    .eq('job_id', jobId)
    .single()

  if (!payment || payment.status !== 'captured') {
    return NextResponse.json({ error: 'Payment has not been captured yet' }, { status: 400 })
  }

  const { data: existingPayout } = await supabase
    .from('payouts')
    .select('id, status')
    .eq('job_id', jobId)
    .maybeSingle()

  if (existingPayout && existingPayout.status !== 'failed') {
    return NextResponse.json({ error: 'A payout already exists for this job' }, { status: 400 })
  }

  const { data: provider } = await supabase
    .from('providers')
    .select('id, paystack_recipient_code')
    .eq('id', job.provider_id)
    .single()

  if (!provider?.paystack_recipient_code) {
    return NextResponse.json({ error: 'Provider has no payout account on file' }, { status: 400 })
  }

  const grossAmountCents = payment.amount_cents
  const platformFeeCents = Math.round(grossAmountCents * (PLATFORM_FEE_PERCENT / 100))
  const reference = `payout_${jobId}_${Date.now()}`

  try {
    await paystackProvider.initiateTransfer({
      amountCents: grossAmountCents - platformFeeCents,
      recipientCode: provider.paystack_recipient_code,
      reference,
      reason: `Payout for job ${jobId}`,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Transfer failed' },
      { status: 500 },
    )
  }

  const payoutFields = {
    status: 'processing' as const,
    payout_reference: reference,
    gross_amount_cents: grossAmountCents,
    platform_fee_cents: platformFeeCents,
  }

  if (existingPayout) {
    await supabase.from('payouts').update(payoutFields).eq('id', existingPayout.id)
  } else {
    await supabase.from('payouts').insert({
      job_id: jobId,
      payment_id: payment.id,
      provider_id: job.provider_id,
      ...payoutFields,
    })
  }

  return NextResponse.json({ success: true })
}
