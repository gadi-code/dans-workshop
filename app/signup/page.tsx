import Link from 'next/link'
import { signup } from '@/app/actions/auth'
import Card from '@/components/ui/Card'
import Field, { inputClasses } from '@/components/ui/Field'
import Button from '@/components/ui/Button'
import { ErrorAlert } from '@/components/ui/Alert'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col justify-center gap-6 px-4">
      <h1 className="text-2xl font-bold text-navy">Create an account</h1>

      {error && <ErrorAlert>{error}</ErrorAlert>}

      <Card>
        <form action={signup} className="flex flex-col gap-4">
          <Field label="Full name">
            <input name="fullName" type="text" required className={inputClasses} />
          </Field>
          <Field label="Email">
            <input name="email" type="email" required className={inputClasses} />
          </Field>
          <Field label="Password">
            <input name="password" type="password" required minLength={6} className={inputClasses} />
          </Field>
          <Button type="submit">Sign up</Button>
        </form>
      </Card>

      <p className="text-sm text-slate">
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-brand-500 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  )
}
