import Link from 'next/link'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { logout } from '@/app/actions/auth'
import { buttonClasses } from '@/components/ui/Button'

export default async function NavBar() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <nav className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-bold text-navy">
          Home Services
        </Link>
        <div className="flex items-center gap-5 text-sm font-medium text-slate">
          <Link href="/browse" className="hover:text-brand-500">Browse</Link>
          {user ? (
            <>
              <Link href="/quotes" className="hover:text-brand-500">My requests</Link>
              <Link href="/provider/requests" className="hover:text-brand-500">Provider requests</Link>
              <Link href="/friends" className="hover:text-brand-500">Friends</Link>
              <Link href="/profile" className="hover:text-brand-500">Profile</Link>
              <form action={logout}>
                <button type="submit" className="hover:text-brand-500">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-brand-500">Log in</Link>
              <Link href="/signup" className={buttonClasses('primary', 'px-5 py-2')}>
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
