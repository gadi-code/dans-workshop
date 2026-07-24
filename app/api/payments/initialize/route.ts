import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { paystackProvider } from '@/lib/payments/paystack'

export async function POST(request: Request) {
  const formData = await request.formData()
  const jobId = String(formData.get('jobId') ?? '')
  const origin = new URL(request.url).origin

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', origin), { status: 303 })
  }

  const { data: job } = await supabase
    .from('jobs')
    .select('id, price_cents, customer_profile_id')
    .eq('id', jobId)
    .single()

  if (!job || job.customer_profile_id !== user.id) {
    return NextResponse.redirect(
      new URL(`/jobs/${jobId}?error=${encodeURIComponent('Job not found.')}`, origin),
      { status: 303 },
    )
  }

  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id, status')
    .eq('job_id', jobId)
    .maybeSingle()

  if (existingPayment?.status === 'captured') {
    return NextResponse.redirect(
      new URL(`/jobs/${jobId}?message=${encodeURIComponent('This job is already paid.')}`, origin),
      { status: 303 },
    )
  }

  const reference = `job_${jobId}_${Date.now()}`

  let authorizationUrl: string
  try {
    const result = await paystackProvider.initializeTransaction({
      amountCents: job.price_cents,
      email: user.email ?? '',
      reference,
      callbackUrl: `${origin}/jobs/${jobId}`,
      metadata: { jobId },
    })
    authorizationUrl = result.authorizationUrl
  } catch (err) {
    return NextResponse.redirect(
      new URL(
        `/jobs/${jobId}?error=${encodeURIComponent(err instanceof Error ? err.message : 'Could not start payment.')}`,
        origin,
      ),
      { status: 303 },
    )
  }

  if (existingPayment) {
    await supabase
      .from('payments')
      .update({ status: 'pending', provider_reference: reference })
      .eq('id', existingPayment.id)
  } else {
    await supabase.from('payments').insert({
      job_id: jobId,
      customer_profile_id: user.id,
      amount_cents: job.price_cents,
      status: 'pending',
      provider_reference: reference,
    })
  }

  return NextResponse.redirect(authorizationUrl, { status: 303 })
}
