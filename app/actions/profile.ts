'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function updateProfile(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const fullName = String(formData.get('fullName') ?? '')
  const phone = String(formData.get('phone') ?? '') || null
  const suburb = String(formData.get('suburb') ?? '') || null
  const city = String(formData.get('city') ?? '') || null
  const province = String(formData.get('province') ?? '') || null

  if (!fullName) {
    redirect('/profile?error=' + encodeURIComponent('Full name is required.'))
  }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName, phone, suburb, city, province })
    .eq('id', user.id)

  if (error) {
    redirect('/profile?error=' + encodeURIComponent(error.message))
  }

  revalidatePath('/profile')
  redirect('/profile?message=' + encodeURIComponent('Profile updated.'))
}
