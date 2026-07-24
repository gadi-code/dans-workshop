'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function sendFriendRequest(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const email = String(formData.get('email') ?? '').trim()
  if (!email) {
    redirect('/friends?error=' + encodeURIComponent('Enter an email address.'))
  }

  const { data: match, error: lookupError } = await supabase
    .rpc('find_profile_by_email', { p_email: email })
    .single()

  if (lookupError || !match) {
    redirect('/friends?error=' + encodeURIComponent('No user found with that email.'))
  }

  const target = match as unknown as { id: string }

  if (target.id === user.id) {
    redirect('/friends?error=' + encodeURIComponent('You can\'t add yourself as a friend.'))
  }

  const { error } = await supabase
    .from('friendships')
    .insert({ requester_id: user.id, addressee_id: target.id })

  if (error) {
    redirect('/friends?error=' + encodeURIComponent(
      error.code === '23505' ? 'You already have a friendship (pending or accepted) with this person.' : error.message,
    ))
  }

  revalidatePath('/friends')
  redirect('/friends?message=' + encodeURIComponent('Friend request sent.'))
}

export async function respondToFriendRequest(formData: FormData) {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const friendshipId = String(formData.get('friendshipId') ?? '')
  const action = String(formData.get('action') ?? '')

  if (action === 'accept') {
    await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId)
  } else if (action === 'decline') {
    await supabase.from('friendships').update({ status: 'declined' }).eq('id', friendshipId)
  } else if (action === 'remove') {
    await supabase.from('friendships').delete().eq('id', friendshipId)
  }

  revalidatePath('/friends')
  redirect('/friends')
}
