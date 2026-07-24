import { type ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost'

const base =
  'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600',
  secondary: 'bg-accent text-navy hover:bg-accent-dark',
  outline: 'border border-border text-navy hover:bg-surface-tint',
  ghost: 'text-brand-500 hover:text-brand-600',
}

export function buttonClasses(variant: ButtonVariant = 'primary', className = '') {
  return `${base} ${variants[variant]} ${className}`.trim()
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }

export default function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return <button className={buttonClasses(variant, className)} {...props} />
}
