import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { sendFriendRequest, respondToFriendRequest } from '@/app/actions/friends'
import { one } from '@/utils/one'
import Card from '@/components/ui/Card'
import Field, { inputClasses } from '@/components/ui/Field'
import Button from '@/components/ui/Button'
import { ErrorAlert, InfoAlert } from '@/components/ui/Alert'

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
      <h1 className="text-2xl font-bold text-navy">Friends</h1>

      {message && <InfoAlert>{message}</InfoAlert>}
      {error && <ErrorAlert>{error}</ErrorAlert>}

      <Card>
        <form action={sendFriendRequest} className="flex flex-col gap-2">
          <Field label="Add a friend by email">
            <input name="email" type="email" required className={inputClasses} />
          </Field>
          <Button type="submit" className="w-fit px-4 py-1.5 text-xs">
            Send request
          </Button>
        </form>
      </Card>

      {incoming.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-navy">Requests</h2>
          {incoming.map((f) => (
            <Card key={f.id} className="flex items-center justify-between">
              <span className="text-sm text-navy">{nameOf(f, f.requester_id)}</span>
              <div className="flex gap-3">
                <form action={respondToFriendRequest}>
                  <input type="hidden" name="friendshipId" value={f.id} />
                  <input type="hidden" name="action" value="accept" />
                  <button type="submit" className="text-sm font-medium text-brand-500 hover:underline">Accept</button>
                </form>
                <form action={respondToFriendRequest}>
                  <input type="hidden" name="friendshipId" value={f.id} />
                  <input type="hidden" name="action" value="decline" />
                  <button type="submit" className="text-sm text-slate hover:underline">Decline</button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}

      {outgoing.length > 0 && (
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-semibold text-navy">Sent requests</h2>
          {outgoing.map((f) => (
            <Card key={f.id} className="flex items-center justify-between">
              <span className="text-sm text-navy">{nameOf(f, f.addressee_id)}</span>
              <span className="text-sm text-slate">Pending</span>
            </Card>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-navy">Your friends</h2>
        {accepted.length > 0 ? (
          accepted.map((f) => {
            const otherId = f.requester_id === user.id ? f.addressee_id : f.requester_id
            return (
              <Card key={f.id} className="flex items-center justify-between">
                <span className="text-sm text-navy">{nameOf(f, otherId)}</span>
                <form action={respondToFriendRequest}>
                  <input type="hidden" name="friendshipId" value={f.id} />
                  <input type="hidden" name="action" value="remove" />
                  <button type="submit" className="text-sm text-slate hover:underline">Remove</button>
                </form>
              </Card>
            )
          })
        ) : (
          <p className="text-sm text-slate">No friends yet.</p>
        )}
      </div>
    </div>
  )
}
