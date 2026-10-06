'use client'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { forwardRef, type ComponentPropsWithoutRef, type ComponentRef } from 'react'
import { cn } from '../../lib/utils'

export const Tabs = TabsPrimitive.Root

export const TabsList = forwardRef<
  ComponentRef<typeof TabsPrimitive.List>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(function TabsList({ className, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={cn(
        'bg-surface-base border-line-subtle inline-flex gap-1 rounded-lg border p-1',
        className,
      )}
      {...props}
    />
  )
})

export const TabsTrigger = forwardRef<
  ComponentRef<typeof TabsPrimitive.Trigger>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={cn(
        'text-content-muted hover:text-content-primary rounded-md px-3 py-1.5 text-sm font-medium transition-colors data-[state=active]:bg-surface-overlay data-[state=active]:text-content-primary',
        className,
      )}
      {...props}
    />
  )
})

export const TabsContent = forwardRef<
  ComponentRef<typeof TabsPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(function TabsContent({ className, ...props }, ref) {
  return <TabsPrimitive.Content ref={ref} className={cn('outline-none', className)} {...props} />
})
