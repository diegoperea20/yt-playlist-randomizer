'use client'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-45 active:scale-[0.97] [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        brand: 'bg-brand text-white shadow-lg shadow-red-950/30 hover:bg-brand-strong',
        secondary: 'bg-surface-overlay text-content-primary hover:bg-surface-hover',
        outline:
          'border border-line-subtle bg-transparent text-content-primary hover:bg-surface-overlay',
        ghost: 'text-content-secondary hover:bg-surface-overlay hover:text-content-primary',
        danger: 'bg-transparent text-red-400 hover:bg-red-500/15',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-11 px-5 text-sm',
        icon: 'size-9',
        'icon-sm': 'size-8 rounded-md',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant, size, asChild = false, ...props },
  ref,
) {
  const Component = asChild ? Slot : 'button'
  return (
    <Component ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
})
