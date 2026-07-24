import Link from 'next/link'
import { login } from '@/app/actions/auth'
import Card from '@/components/ui/Card'
import Field, { inputClasses } from '@/components/ui/Field'
import Button from '@/components/ui/Button'
import { ErrorAlert, InfoAlert } from '@/components/ui/Alert'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const { error, message } = await searchParams

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-bold text-navy">Log in</h1>

      {message && <InfoAlert>{message}</InfoAlert>}
      {error && <ErrorAlert>{error}</ErrorAlert>}

      <Card>
        <form action={login} className="flex flex-col gap-4">
          <Field label="Email">
            <input name="email" type="email" required className={inputClasses} />
          </Field>
          <Field label="Password">
            <input name="password" type="password" required className={inputClasses} />
          </Field>
          <Button type="submit">Log in</Button>
        </form>
      </Card>

      <p className="text-sm text-slate">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-medium text-brand-500 hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
