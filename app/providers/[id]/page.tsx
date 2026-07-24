import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { one } from '@/utils/one'
import Badge from '@/components/ui/Badge'
import { SuccessAlert } from '@/components/ui/Alert'
import { buttonClasses } from '@/components/ui/Button'

export default async function ProviderProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: provider } = await supabase
    .from('providers')
    .select(
      'id, display_name, description, provider_type, phone, city, suburb, province, provider_categories(service_categories(name, slug))',
    )
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!provider) {
    notFound()
  }

  let friends: { friend_id: string; friend_name: string; completed_at: string }[] = []
  if (user) {
    const { data } = await supabase.rpc('friend_provider_history', { target_provider_id: provider.id })
    friends = data ?? []
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-bold text-navy">{provider.display_name}</h1>
        <p className="text-sm text-slate">
          {provider.provider_type === 'company' ? 'Company' : 'Individual'}
          {provider.city ? ` · ${provider.city}` : ''}
        </p>
      </div>

      {provider.description && <p className="text-slate">{provider.description}</p>}

      {provider.provider_categories && provider.provider_categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {provider.provider_categories.map((pc, i) => {
            const name = one(pc.service_categories as unknown as { name: string } | { name: string }[] | null)?.name
            return <Badge key={i}>{name}</Badge>
          })}
        </div>
      )}

      {friends.length > 0 && (
        <SuccessAlert>
          Used by {friends.length} of your friends, including {friends[0].friend_name}
        </SuccessAlert>
      )}

      <Link href={`/quotes/new?provider=${provider.id}`} className={buttonClasses('primary', 'w-fit px-8 py-3.5 text-base')}>
        Request a quote
      </Link>
    </div>
  )
}
