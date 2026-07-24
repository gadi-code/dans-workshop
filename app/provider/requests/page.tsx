import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { submitQuote } from '@/app/actions/quotes'
import { one } from '@/utils/one'

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
      <h1 className="text-2xl font-semibold">Incoming requests</h1>

      {message && (
        <p className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
          {message}
        </p>
      )}
      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      )}

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
              <li key={i} className="rounded-lg border border-black/10 p-4 dark:border-white/20">
                <p className="font-medium">{categoryName}</p>
                <p className="text-sm">{req.description}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Request status: {req.status}</p>

                {myQuote ? (
                  <p className="mt-2 text-sm font-medium">
                    Your quote: {myQuote.status}
                  </p>
                ) : req.status === 'open' ? (
                  <form action={submitQuote} className="mt-3 flex flex-col gap-2">
                    <input type="hidden" name="quoteRequestId" value={req.id} />
                    <input type="hidden" name="providerId" value={invite.provider_id} />
                    <label className="flex flex-col gap-1 text-sm">
                      Price (ZAR)
                      <input
                        name="price"
                        type="number"
                        min="1"
                        step="0.01"
                        required
                        className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      Message
                      <textarea
                        name="message"
                        rows={2}
                        className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
                      />
                    </label>
                    <button
                      type="submit"
                      className="w-fit rounded-full bg-foreground px-4 py-1.5 text-sm text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
                    >
                      Submit quote
                    </button>
                  </form>
                ) : (
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    This request is no longer open.
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">No incoming requests yet.</p>
      )}
    </div>
  )
}
