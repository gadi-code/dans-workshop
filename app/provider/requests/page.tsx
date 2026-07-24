import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { submitQuote } from '@/app/actions/quotes'
import { one } from '@/utils/one'
import Card from '@/components/ui/Card'
import Field, { inputClasses } from '@/components/ui/Field'
import Button from '@/components/ui/Button'
import { ErrorAlert, InfoAlert } from '@/components/ui/Alert'

export default async function ProviderRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const { error, message } = await searchParams
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: myProviders } = await supabase
    .from('providers')
    .select('id')
    .eq('owner_profile_id', user.id)

  const providerIds = myProviders?.map((p) => p.id) ?? []

  const { data: invites } =
    providerIds.length > 0
      ? await supabase
          .from('quote_request_providers')
          .select(
            'provider_id, quote_requests(id, description, status, service_categories(name)), quotes(id, provider_id, status)',
          )
          .in('provider_id', providerIds)
      : { data: null }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <h1 className="text-2xl font-bold text-navy">Incoming requests</h1>

      {message && <InfoAlert>{message}</InfoAlert>}
      {error && <ErrorAlert>{error}</ErrorAlert>}

      {invites && invites.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {invites.map((invite, i) => {
            const req = one(
              invite.quote_requests as unknown as
                | { id: string; description: string; status: string; service_categories: { name: string } | { name: string }[] | null }
                | { id: string; description: string; status: string; service_categories: { name: string } | { name: string }[] | null }[]
                | null,
            )
            if (!req) return null

            const categoryName = one(req.service_categories)?.name

            const myQuote = one(
              invite.quotes as unknown as
                | { provider_id: string; status: string }
                | { provider_id: string; status: string }[]
                | null,
            )

            return (
              <Card as="li" key={i}>
                <p className="font-semibold text-navy">{categoryName}</p>
                <p className="text-sm text-slate">{req.description}</p>
                <p className="text-sm text-slate">Request status: {req.status}</p>

                {myQuote ? (
                  <p className="mt-2 text-sm font-medium text-navy">
                    Your quote: {myQuote.status}
                  </p>
                ) : req.status === 'open' ? (
                  <form action={submitQuote} className="mt-3 flex flex-col gap-2">
                    <input type="hidden" name="quoteRequestId" value={req.id} />
                    <input type="hidden" name="providerId" value={invite.provider_id} />
                    <Field label="Price (ZAR)">
                      <input
                        name="price"
                        type="number"
                        min="1"
                        step="0.01"
                        required
                        className={inputClasses}
                      />
                    </Field>
                    <Field label="Message">
                      <textarea name="message" rows={2} className={inputClasses} />
                    </Field>
                    <Button type="submit" className="w-fit px-4 py-1.5 text-xs">
                      Submit quote
                    </Button>
                  </form>
                ) : (
                  <p className="mt-2 text-sm text-slate">This request is no longer open.</p>
                )}
              </Card>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-slate">No incoming requests yet.</p>
      )}
    </div>
  )
}
