export function ErrorAlert({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
      {children}
    </p>
  )
}

export function InfoAlert({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700 dark:text-brand-600">
      {children}
    </p>
  )
}

export function SuccessAlert({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
      {children}
    </p>
  )
}
