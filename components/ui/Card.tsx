import { type ElementType, type HTMLAttributes } from 'react'

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType
  action?: string
  method?: string
}

export default function Card({ as: Tag = 'div', className = '', ...props }: CardProps) {
  return (
    <Tag
      className={`rounded-2xl border border-border bg-surface p-5 shadow-[0_5px_16px_rgba(19,34,79,0.06)] ${className}`.trim()}
      {...props}
    />
  )
}
