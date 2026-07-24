import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { selectProviders } from '@/app/actions/quotes'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ErrorAlert } from '@/components/ui/Alert'

export default async function SelectProvidersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string; provider?: string }>
}) {
  const { id } = await params
  const { error, provider: preselected } = await searchParams
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: request } = await supabase
    .from('quote_requests')
    .select('id, category_id, description, customer_profile_id')
    .eq('id', id)
    .single()

  if (!request || request.customer_profile_id !== user.id) {
    notFound()
  }

  const { data: providers } = await supabase
    .from('providers')
    .select('id, display_name, city, provider_type, provider_categories!inner(category_id)')
    .eq('is_active', true)
    .eq('provider_categories.category_id', request.category_id)

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-navy">Choose providers</h1>
      <p className="text-sm text-slate">{request.description}</p>

      {error && <ErrorAlert>{error}</ErrorAlert>}

      <Card>
        <form action={selectProviders} className="flex flex-col gap-4">
          <input type="hidden" name="quoteRequestId" value={request.id} />

          {providers && providers.length > 0 ? (
            <fieldset className="flex flex-col gap-2 text-sm">
              {providers.map((p) => (
                <label key={p.id} className="flex items-center gap-2 text-navy">
                  <input
                    type="checkbox"
                    name="providerIds"
                    value={p.id}
                    defaultChecked={p.id === preselected}
                  />
                  {p.display_name}
                  {p.city ? ` · ${p.city}` : ''}
                </label>
              ))}
            </fieldset>
          ) : (
            <p className="text-sm text-slate">No providers found for this category yet.</p>
          )}

          <Button type="submit">Send request</Button>
        </form>
      </Card>
    </div>
  )
}
