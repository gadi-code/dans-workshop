import { type ReactNode } from 'react'

export const inputClasses =
  'rounded-lg border border-border bg-surface px-3 py-2 text-navy placeholder:text-slate/60 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100'

export default function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-navy">
      {label}
      {children}
    </label>
  )
}
