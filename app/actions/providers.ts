'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function createProvider(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const providerType = String(formData.get('providerType') ?? '')
  const displayName = String(formData.get('displayName') ?? '')
  const description = String(formData.get('description') ?? '') || null
  const phone = String(formData.get('phone') ?? '') || null
  const suburb = String(formData.get('suburb') ?? '') || null
  const city = String(formData.get('city') ?? '') || null
  const province = String(formData.get('province') ?? '') || null
  const categoryIds = formData.getAll('categoryIds').map(String).filter(Boolean)

  if (!displayName || (providerType !== 'individual' && providerType !== 'company')) {
    redirect('/providers/new?error=' + encodeURIComponent('Please fill in all required fields.'))
  }
  if (categoryIds.length === 0) {
    redirect('/providers/new?error=' + encodeURIComponent('Select at least one service category.'))
  }

  const { data: provider, error } = await supabase
    .from('providers')
    .insert({
      owner_profile_id: user.id,
      provider_type: providerType,
      display_name: displayName,
      description,
      phone,
      suburb,
      city,
      province,
    })
    .select('id')
    .single()

  if (error || !provider) {
    redirect('/providers/new?error=' + encodeURIComponent(error?.message ?? 'Could not create provider.'))
  }

  const { error: categoryError } = await supabase
    .from('provider_categories')
    .insert(categoryIds.map((categoryId) => ({ provider_id: provider.id, category_id: categoryId })))

  if (categoryError) {
    redirect('/providers/new?error=' + encodeURIComponent(categoryError.message))
  }

  redirect('/profile?message=' + encodeURIComponent('Provider listing created.'))
}
