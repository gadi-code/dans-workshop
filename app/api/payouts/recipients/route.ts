import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { paystackProvider } from '@/lib/payments/paystack'

export async function POST(request: Request) {
  const formData = await request.formData()
  const providerId = String(formData.get('providerId') ?? '')
  const accountNumber = String(formData.get('accountNumber') ?? '')
  const bankCode = String(formData.get('bankCode') ?? '')
  const accountName = String(formData.get('accountName') ?? '')
  const origin = new URL(request.url).origin

  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', origin), { status: 303 })
  }

  const { data: provider } = await supabase
    .from('providers')
    .select('id, owner_profile_id')
    .eq('id', providerId)
    .single()

  if (!provider || provider.owner_profile_id !== user.id) {
    return NextResponse.redirect(
      new URL(`/profile?error=${encodeURIComponent('Provider not found.')}`, origin),
      { status: 303 },
    )
  }

  try {
    const { recipientCode } = await paystackProvider.createRecipient({
      accountNumber,
      bankCode,
      accountName,
    })
    await supabase.from('providers').update({ paystack_recipient_code: recipientCode }).eq('id', providerId)
  } catch (err) {
    return NextResponse.redirect(
      new URL(
        `/profile?error=${encodeURIComponent(err instanceof Error ? err.message : 'Could not save bank details.')}`,
        origin,
      ),
      { status: 303 },
    )
  }

  return NextResponse.redirect(
    new URL(`/profile?message=${encodeURIComponent('Bank details saved.')}`, origin),
    { status: 303 },
  )
}
