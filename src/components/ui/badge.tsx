'use client'
import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '../../lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-white/10 ring-inset',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-overlay text-content-secondary',
        brand: 'bg-brand-soft text-red-200',
        success: 'bg-emerald-500/15 text-emerald-300',
        warning: 'bg-amber-500/15 text-amber-300',
        danger: 'bg-red-500/15 text-red-300',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}
