import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/server'
import { updateProfile } from '@/app/actions/profile'

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
      <h1 className="text-2xl font-semibold">Your profile</h1>

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

      <form action={updateProfile} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Full name
          <input
            name="fullName"
            defaultValue={profile?.full_name ?? ''}
            required
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Phone
          <input
            name="phone"
            defaultValue={profile?.phone ?? ''}
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Suburb
          <input
            name="suburb"
            defaultValue={profile?.suburb ?? ''}
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          City
          <input
            name="city"
            defaultValue={profile?.city ?? ''}
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Province
          <input
            name="province"
            defaultValue={profile?.province ?? ''}
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          />
        </label>
        <button
          type="submit"
          className="rounded-full bg-foreground px-5 py-2 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Save
        </button>
      </form>

      <div className="flex flex-col gap-2 border-t border-black/10 pt-6 dark:border-white/20">
        <h2 className="text-lg font-medium">Your provider listings</h2>
        {providers && providers.length > 0 ? (
          <ul className="flex flex-col gap-4 text-sm">
            {providers.map((p) => (
              <li key={p.id} className="flex flex-col gap-2">
                <span>{p.display_name}</span>
                {p.paystack_recipient_code ? (
                  <span className="text-zinc-600 dark:text-zinc-400">Payout account on file</span>
                ) : (
                  <form action="/api/payouts/recipients" method="POST" className="flex flex-col gap-2 rounded-md border border-black/10 p-3 dark:border-white/20">
                    <input type="hidden" name="providerId" value={p.id} />
                    <label className="flex flex-col gap-1">
                      Account holder name
                      <input name="accountName" required className="rounded-md border border-black/10 px-2 py-1 dark:border-white/20" />
                    </label>
                    <label className="flex flex-col gap-1">
                      Bank account number
                      <input name="accountNumber" required className="rounded-md border border-black/10 px-2 py-1 dark:border-white/20" />
                    </label>
                    <label className="flex flex-col gap-1">
                      Bank code (Paystack)
                      <input name="bankCode" required className="rounded-md border border-black/10 px-2 py-1 dark:border-white/20" />
                    </label>
                    <button type="submit" className="w-fit rounded-full bg-foreground px-3 py-1 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]">
                      Save payout details
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            You don&apos;t have a provider listing yet.
          </p>
        )}
        <Link href="/providers/new" className="text-sm font-medium underline">
          Become a provider
        </Link>
      </div>
    </div>
  )
}
