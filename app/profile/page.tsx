import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { updateProfile } from '@/app/actions/profile'
import Card from '@/components/ui/Card'
import Field, { inputClasses } from '@/components/ui/Field'
import Button from '@/components/ui/Button'
import { ErrorAlert, InfoAlert } from '@/components/ui/Alert'

export default async function ProfilePage({
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, phone, suburb, city, province')
    .eq('id', user.id)
    .single()

  const { data: providers } = await supabase
    .from('providers')
    .select('id, display_name, paystack_recipient_code')
    .eq('owner_profile_id', user.id)

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-16">
      <h1 className="text-2xl font-bold text-navy">Your profile</h1>

      {message && <InfoAlert>{message}</InfoAlert>}
      {error && <ErrorAlert>{error}</ErrorAlert>}

      <Card>
        <form action={updateProfile} className="flex flex-col gap-4">
          <Field label="Full name">
            <input name="fullName" defaultValue={profile?.full_name ?? ''} required className={inputClasses} />
          </Field>
          <Field label="Phone">
            <input name="phone" defaultValue={profile?.phone ?? ''} className={inputClasses} />
          </Field>
          <Field label="Suburb">
            <input name="suburb" defaultValue={profile?.suburb ?? ''} className={inputClasses} />
          </Field>
          <Field label="City">
            <input name="city" defaultValue={profile?.city ?? ''} className={inputClasses} />
          </Field>
          <Field label="Province">
            <input name="province" defaultValue={profile?.province ?? ''} className={inputClasses} />
          </Field>
          <Button type="submit">Save</Button>
        </form>
      </Card>

      <div className="flex flex-col gap-3 border-t border-border pt-6">
        <h2 className="text-lg font-semibold text-navy">Your provider listings</h2>
        {providers && providers.length > 0 ? (
          <ul className="flex flex-col gap-4 text-sm">
            {providers.map((p) => (
              <li key={p.id} className="flex flex-col gap-2">
                <span className="font-medium text-navy">{p.display_name}</span>
                {p.paystack_recipient_code ? (
                  <span className="text-slate">Payout account on file</span>
                ) : (
                  <Card as="form" action="/api/payouts/recipients" method="POST" className="flex flex-col gap-2 p-3">
                    <input type="hidden" name="providerId" value={p.id} />
                    <Field label="Account holder name">
                      <input name="accountName" required className={inputClasses} />
                    </Field>
                    <Field label="Bank account number">
                      <input name="accountNumber" required className={inputClasses} />
                    </Field>
                    <Field label="Bank code (Paystack)">
                      <input name="bankCode" required className={inputClasses} />
                    </Field>
                    <Button type="submit" className="w-fit px-4 py-1.5 text-xs">
                      Save payout details
                    </Button>
                  </Card>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate">You don&apos;t have a provider listing yet.</p>
        )}
        <Link href="/providers/new" className="text-sm font-medium text-brand-500 hover:underline">
          Become a provider
        </Link>
      </div>
    </div>
  )
}
