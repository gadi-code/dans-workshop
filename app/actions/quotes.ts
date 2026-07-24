'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function createQuoteRequest(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const categoryId = String(formData.get('categoryId') ?? '')
  const description = String(formData.get('description') ?? '')
  const addressLine = String(formData.get('addressLine') ?? '') || null
  const suburb = String(formData.get('suburb') ?? '') || null
  const city = String(formData.get('city') ?? '') || null
  const province = String(formData.get('province') ?? '') || null
  const preselectedProvider = String(formData.get('provider') ?? '') || null

  if (!categoryId || !description) {
    redirect('/quotes/new?error=' + encodeURIComponent('Please select a category and describe the job.'))
  }

  const { data: request, error } = await supabase
    .from('quote_requests')
    .insert({
      customer_profile_id: user.id,
      category_id: categoryId,
      description,
      address_line: addressLine,
      suburb,
      city,
      province,
    })
    .select('id')
    .single()

  if (error || !request) {
    redirect('/quotes/new?error=' + encodeURIComponent(error?.message ?? 'Could not create request.'))
  }

  const next = preselectedProvider
    ? `/quotes/${request.id}/providers?provider=${preselectedProvider}`
    : `/quotes/${request.id}/providers`
  redirect(next)
}

export async function selectProviders(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const quoteRequestId = String(formData.get('quoteRequestId') ?? '')
  const providerIds = formData.getAll('providerIds').map(String).filter(Boolean)

  if (!quoteRequestId || providerIds.length === 0) {
    redirect(`/quotes/${quoteRequestId}/providers?error=` + encodeURIComponent('Select at least one provider.'))
  }

  const { error } = await supabase
    .from('quote_request_providers')
    .insert(providerIds.map((providerId) => ({ quote_request_id: quoteRequestId, provider_id: providerId })))

  if (error) {
    redirect(`/quotes/${quoteRequestId}/providers?error=` + encodeURIComponent(error.message))
  }

  redirect(`/quotes/${quoteRequestId}`)
}

export async function submitQuote(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const quoteRequestId = String(formData.get('quoteRequestId') ?? '')
  const providerId = String(formData.get('providerId') ?? '')
  const priceRand = Number(formData.get('price') ?? 0)
  const message = String(formData.get('message') ?? '') || null

  if (!quoteRequestId || !providerId || !priceRand || priceRand <= 0) {
    redirect('/provider/requests?error=' + encodeURIComponent('Enter a valid price.'))
  }

  const { error } = await supabase.from('quotes').insert({
    quote_request_id: quoteRequestId,
    provider_id: providerId,
    price_cents: Math.round(priceRand * 100),
    message,
  })

  if (error) {
    redirect('/provider/requests?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/provider/requests')
  redirect('/provider/requests?message=' + encodeURIComponent('Quote submitted.'))
}

export async function acceptQuote(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const quoteId = String(formData.get('quoteId') ?? '')
  const quoteRequestId = String(formData.get('quoteRequestId') ?? '')

  const { data, error } = await supabase.rpc('accept_quote', { p_quote_id: quoteId }).single()
  const job = data as unknown as { id: string } | null

  if (error || !job) {
    redirect(`/quotes/${quoteRequestId}?error=` + encodeURIComponent(error?.message ?? 'Could not accept quote.'))
  }

  redirect(`/jobs/${job.id}`)
}
