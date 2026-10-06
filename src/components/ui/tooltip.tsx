'use client'
import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import type { ComponentProps, ReactNode } from 'react'

export const TooltipProvider = TooltipPrimitive.Provider
export const TooltipRoot = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger

export const TooltipContent = ({
  side = 'top',
  sideOffset = 8,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      side={side}
      sideOffset={sideOffset}
      className="bg-surface-overlay border-line-subtle text-content-primary animate-pop-in z-50 max-w-64 rounded-md border px-2 py-1 text-xs shadow-xl"
      {...props}
    />
  </TooltipPrimitive.Portal>
)

/** Convenience wrapper: `<Tooltip label="..."><button /></Tooltip>`. */
export function Tooltip({
  label,
  children,
  side,
}: {
  label: string
  children: ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
}) {
  return (
    <TooltipRoot>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </TooltipRoot>
  )
}
