import Link from 'next/link'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { one } from '@/utils/one'
import Card from '@/components/ui/Card'

export default async function MyQuoteRequestsPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: requests } = await supabase
    .from('quote_requests')
    .select('id, description, status, created_at, service_categories(name)')
    .eq('customer_profile_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-navy">My requests</h1>
        <Link href="/quotes/new" className="text-sm font-medium text-brand-500 hover:underline">
          New request
        </Link>
      </div>

      {requests && requests.length > 0 ? (
        <ul className="flex flex-col gap-4">
          {requests.map((r) => {
            const name = one(
              r.service_categories as unknown as { name: string } | { name: string }[] | null,
            )?.name
            return (
              <Card as="li" key={r.id}>
                <Link href={`/quotes/${r.id}`} className="font-semibold text-navy hover:text-brand-500">
                  {name}
                </Link>
                <p className="text-sm text-slate">Status: {r.status}</p>
                <p className="mt-1 text-sm text-slate">{r.description}</p>
              </Card>
            )
          })}
        </ul>
      ) : (
        <p className="text-sm text-slate">You have no requests yet.</p>
      )}
    </div>
  )
}
