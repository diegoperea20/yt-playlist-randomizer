'use client'
import * as SliderPrimitive from '@radix-ui/react-slider'
import { forwardRef, type ComponentPropsWithoutRef, type ComponentRef } from 'react'
import { cn } from '../../lib/utils'

export const Slider = forwardRef<
  ComponentRef<typeof SliderPrimitive.Root>,
  ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(function Slider({ className, ...props }, ref) {
  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        'relative flex h-4 w-full touch-none items-center select-none data-[disabled]:opacity-45',
        className,
      )}
      {...props}
    >
      <SliderPrimitive.Track className="bg-surface-hover relative h-1 w-full grow overflow-hidden rounded-full">
        <SliderPrimitive.Range className="bg-brand absolute h-full" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="border-line-subtle bg-content-primary block size-4 cursor-pointer rounded-full border-2 shadow transition-transform hover:scale-110 focus-visible:outline-none active:scale-110" />
    </SliderPrimitive.Root>
  )
})
