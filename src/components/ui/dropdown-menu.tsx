'use client'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { forwardRef, type ComponentPropsWithoutRef, type ComponentRef } from 'react'
import { cn } from '../../lib/utils'

export const DropdownMenu = DropdownMenuPrimitive.Root
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger

export const DropdownMenuContent = forwardRef<
  ComponentRef<typeof DropdownMenuPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(function DropdownMenuContent({ className, sideOffset = 6, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          'panel animate-pop-in z-50 min-w-52 overflow-hidden p-1 text-sm shadow-xl',
          className,
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
})

export const DropdownMenuItem = forwardRef<
  ComponentRef<typeof DropdownMenuPrimitive.Item>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & { danger?: boolean }
>(function DropdownMenuItem({ className, danger = false, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Item
      ref={ref}
      className={cn(
        'flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-content-secondary outline-none select-none data-[highlighted]:bg-surface-overlay data-[highlighted]:text-content-primary data-[disabled]:pointer-events-none data-[disabled]:opacity-45 [&_svg]:size-4',
        danger && 'text-red-400 data-[highlighted]:bg-red-500/15 data-[highlighted]:text-red-400',
        className,
      )}
      {...props}
    />
  )
})

export const DropdownMenuSeparator = () => (
  <DropdownMenuPrimitive.Separator className="bg-line-subtle my-1 h-px" />
)

export const DropdownMenuLabel = forwardRef<
  ComponentRef<typeof DropdownMenuPrimitive.Label>,
  ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label>
>(function DropdownMenuLabel({ className, ...props }, ref) {
  return (
    <DropdownMenuPrimitive.Label
      ref={ref}
      className={cn(
        'text-content-muted truncate px-2.5 py-1.5 text-[11px] font-semibold tracking-wide uppercase',
        className,
      )}
      {...props}
    />
  )
})
