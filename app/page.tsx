import Link from 'next/link'
import { buttonClasses } from '@/components/ui/Button'

const steps = [
  {
    number: '1',
    title: 'Describe the job',
    body: "Tell us what's going on — a leaking pipe, a tripped DB, a garden that's gotten away from you.",
  },
  {
    number: '2',
    title: 'Choose your providers',
    body: 'Pick which local pros should quote, and see straight away if a friend has used them before.',
  },
  {
    number: '3',
    title: 'Accept a quote, pay safely',
    body: "Compare quotes, accept the one you want, and pay through the app — we handle the rest.",
  },
]

export default function Page() {
  return (
    <div className="flex flex-1 flex-col">
      <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-6 px-6 py-24 text-center">
        <h1 className="max-w-2xl text-4xl font-bold leading-tight text-navy sm:text-5xl">
          Find trusted home service pros near you
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-slate">
          Plumbers, electricians, cleaners, gardeners, security and more.
          Describe the job, get quotes from the providers you choose, and pay
          safely through the app.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/browse" className={buttonClasses('primary', 'px-8 py-3.5 text-base')}>
            Browse providers
          </Link>
          <Link href="/signup" className={buttonClasses('outline', 'px-8 py-3.5 text-base')}>
            Sign up
          </Link>
        </div>
      </section>

      <section className="bg-surface-tint py-20">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-500">How it works</p>
            <h2 className="mt-2 text-3xl font-bold text-navy">From problem to solved</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-lg font-bold text-white">
                  {step.number}
                </span>
                <h3 className="text-lg font-semibold text-navy">{step.title}</h3>
                <p className="text-slate">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
