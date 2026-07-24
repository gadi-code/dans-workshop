import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { one } from '@/utils/one'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { ErrorAlert, InfoAlert } from '@/components/ui/Alert'

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
      <h1 className="text-2xl font-bold text-navy">Job confirmed</h1>

      {message && <InfoAlert>{message}</InfoAlert>}
      {error && <ErrorAlert>{error}</ErrorAlert>}

      <Card className="flex flex-col gap-2 text-sm">
        <p className="text-navy"><span className="text-slate">Provider:</span> {provider?.display_name}</p>
        <p className="text-lg font-bold text-brand-500">R{(job.price_cents / 100).toFixed(2)}</p>
        <p className="text-navy"><span className="text-slate">Status:</span> {job.status}</p>
        <p className="text-navy"><span className="text-slate">Payment:</span> {isPaid ? 'Paid' : payment?.status ?? 'Not paid yet'}</p>
      </Card>

      {isCustomer && !isPaid && (
        <form action="/api/payments/initialize" method="POST" className="w-fit">
          <input type="hidden" name="jobId" value={job.id} />
          <Button type="submit" className="px-8 py-3.5 text-base">
            Pay now
          </Button>
        </form>
      )}
    </div>
  )
}
