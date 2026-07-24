import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { sendFriendRequest, respondToFriendRequest } from '@/app/actions/friends'
import { one } from '@/utils/one'

export default async function FriendsPage({
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

  const { data: friendships } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id, status, requester:requester_id(full_name), addressee:addressee_id(full_name)')
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

  const incoming = friendships?.filter((f) => f.addressee_id === user.id && f.status === 'pending') ?? []
  const outgoing = friendships?.filter((f) => f.requester_id === user.id && f.status === 'pending') ?? []
  const accepted = friendships?.filter((f) => f.status === 'accepted') ?? []

  const nameOf = (f: (typeof accepted)[number], otherId: string) => {
    const person = f.requester_id === otherId ? f.requester : f.addressee
    return one(person as unknown as { full_name: string } | { full_name: string }[] | null)?.full_name
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-8 px-6 py-12">
      <h1 className="text-2xl font-semibold">Friends</h1>

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

      <form action={sendFriendRequest} className="flex flex-col gap-2">
        <label className="flex flex-col gap-1 text-sm">
          Add a friend by email
          <input
            name="email"
            type="email"
            required
            className="rounded-md border border-black/10 px-3 py-2 dark:border-white/20"
          />
        </label>
        <button
          type="submit"
          className="w-fit rounded-full bg-foreground px-4 py-1.5 text-sm text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Send request
        </button>
      </form>

      {incoming.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">Requests</h2>
          {incoming.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-lg border border-black/10 p-3 dark:border-white/20">
              <span className="text-sm">{nameOf(f, f.requester_id)}</span>
              <div className="flex gap-2">
                <form action={respondToFriendRequest}>
                  <input type="hidden" name="friendshipId" value={f.id} />
                  <input type="hidden" name="action" value="accept" />
                  <button type="submit" className="text-sm font-medium underline">Accept</button>
                </form>
                <form action={respondToFriendRequest}>
                  <input type="hidden" name="friendshipId" value={f.id} />
                  <input type="hidden" name="action" value="decline" />
                  <button type="submit" className="text-sm underline">Decline</button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      {outgoing.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-medium">Sent requests</h2>
          {outgoing.map((f) => (
            <div key={f.id} className="flex items-center justify-between rounded-lg border border-black/10 p-3 dark:border-white/20">
              <span className="text-sm">{nameOf(f, f.addressee_id)}</span>
              <span className="text-sm text-zinc-600 dark:text-zinc-400">Pending</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Your friends</h2>
        {accepted.length > 0 ? (
          accepted.map((f) => {
            const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id
            return (
              <div key={f.id} className="flex items-center justify-between rounded-lg border border-black/10 p-3 dark:border-white/20">
                <span className="text-sm">{nameOf(f, otherId)}</span>
                <form action={respondToFriendRequest}>
                  <input type="hidden" name="friendshipId" value={f.id} />
                  <input type="hidden" name="action" value="remove" />
                  <button type="submit" className="text-sm underline">Remove</button>
                </form>
              </div>
            )
          })
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">No friends yet.</p>
        )}
      </div>
    </div>
  )
}
