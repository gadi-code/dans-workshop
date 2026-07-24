import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { acceptQuote } from '@/app/actions/quotes'
import { one } from '@/utils/one'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ErrorAlert } from '@/components/ui/Alert'

export default async function QuoteRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { id } = await params
  const { error } = await searchParams
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
    .select('id, description, status, customer_profile_id, service_categories(name)')
    .eq('id', id)
    .single()

  if (!request || request.customer_profile_id !== user.id) {
    notFound()
  }

  const { data: quotes } = await supabase
    .from('quotes')
    .select('id, price_cents, message, status, providers(display_name)')
    .eq('quote_request_id', id)
    .order('created_at')

  const categoryLabel = one(
    request.service_categories as unknown as { name: string } | { name: string }[] | null,
  )?.name

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-2xl font-bold text-navy">{categoryLabel} request</h1>
        <p className="text-sm text-slate">Status: {request.status}</p>
      </div>

      <p className="text-slate">{request.description}</p>

      {error && <ErrorAlert>{error}</ErrorAlert>}

      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-navy">Quotes received</h2>
        {quotes && quotes.length > 0 ? (
          quotes.map((q) => {
            const name = one(
              q.providers as unknown as { display_name: string } | { display_name: string }[] | null,
            )?.display_name
            return (
              <Card key={q.id}>
                <p className="font-semibold text-navy">{name}</p>
                <p className="text-lg font-bold text-brand-500">R{(q.price_cents / 100).toFixed(2)}</p>
                {q.message && <p className="text-sm text-slate">{q.message}</p>}
                <p className="text-sm text-slate">Status: {q.status}</p>
                {q.status === 'pending' && request.status === 'open' && (
                  <form action={acceptQuote} className="mt-2">
                    <input type="hidden" name="quoteId" value={q.id} />
                    <input type="hidden" name="quoteRequestId" value={request.id} />
                    <Button type="submit" className="px-4 py-1.5 text-xs">
                      Accept
                    </Button>
                  </form>
                )}
              </Card>
            )
          })
        ) : (
          <p className="text-sm text-slate">No quotes yet.</p>
        )}
      </div>
    </div>
  )
}
