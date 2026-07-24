import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { logout } from '@/app/actions/auth'

export default async function NavBar() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <nav className="flex items-center justify-between border-b border-black/10 px-6 py-4 dark:border-white/20">
      <Link href="/" className="font-semibold">
        Home Services
      </Link>
      <div className="flex items-center gap-4 text-sm">
        <Link href="/browse">Browse</Link>
        {user ? (
          <>
            <Link href="/quotes">My requests</Link>
            <Link href="/provider/requests">Provider requests</Link>
            <Link href="/friends">Friends</Link>
            <Link href="/profile">Profile</Link>
            <form action={logout}>
              <button type="submit" className="underline">
                Log out
              </button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login">Log in</Link>
            <Link href="/signup">Sign up</Link>
          </>
        )}
      </div>
    </nav>
  )
}
