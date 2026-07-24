import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { one } from '@/utils/one'

export default async function JobPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const { id } = await params
  const { error, message } = await searchParams
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: job } = await supabase
    .from('jobs')
    .select('id, price_cents, status, scheduled_at, completed_at, customer_profile_id, providers(display_name, owner_profile_id)')
    .eq('id', id)
    .single()

  if (!job) {
    notFound()
  }

  const provider = one(
    job.providers as unknown as
      | { display_name: string; owner_profile_id: string }
      | { display_name: string; owner_profile_id: string }[]
      | null,
  )

  const isParticipant = job.customer_profile_id === user.id || provider?.owner_profile_id === user.id
  if (!isParticipant) {
    notFound()
  }

  const { data: payment } = await supabase
    .from('payments')
    .select('status')
    .eq('job_id', job.id)
    .maybeSingle()

  const isCustomer = job.customer_profile_id === user.id
  const isPaid = payment?.status === 'captured'

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-6 py-16">
      <h1 className="text-2xl font-semibold">Job confirmed</h1>

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

      <p>Provider: {provider?.display_name}</p>
      <p>Price: R{(job.price_cents / 100).toFixed(2)}</p>
      <p>Status: {job.status}</p>
      <p>Payment: {isPaid ? 'Paid' : payment?.status ?? 'Not paid yet'}</p>

      {isCustomer && !isPaid && (
        <form action="/api/payments/initialize" method="POST" className="w-fit">
          <input type="hidden" name="jobId" value={job.id} />
          <button
            type="submit"
            className="rounded-full bg-foreground px-6 py-3 font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Pay now
          </button>
        </form>
      )}
    </div>
  )
}
