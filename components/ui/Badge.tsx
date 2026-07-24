export default function Badge({
  children,
  active = false,
  as: Tag = 'span',
  ...props
}: {
  children: React.ReactNode
  active?: boolean
  as?: 'span' | 'div'
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
        active
          ? 'border-brand-500 bg-brand-500 text-white'
          : 'border-border bg-surface text-slate hover:bg-surface-tint'
      }`}
      {...props}
    >
      {children}
    </Tag>
  )
}
