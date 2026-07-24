import Link from 'next/link'

export default function Page() {
  return (
    <div className="mx-auto flex flex-1 w-full max-w-3xl flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <h1 className="text-4xl font-semibold tracking-tight">
        Find trusted home service pros near you
      </h1>
      <p className="max-w-xl text-lg text-zinc-600 dark:text-zinc-400">
        Plumbers, electricians, cleaners, gardeners, security and more.
        Describe the job, get quotes from the providers you choose, and pay
        safely through the app.
      </p>
      <div className="flex gap-4">
        <Link
          href="/browse"
          className="rounded-full bg-foreground px-6 py-3 font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          Browse providers
        </Link>
        <Link
          href="/signup"
          className="rounded-full border border-black/10 px-6 py-3 font-medium transition-colors hover:bg-black/[.04] dark:border-white/20 dark:hover:bg-white/[.06]"
        >
          Sign up
        </Link>
      </div>
    </div>
  )
}
