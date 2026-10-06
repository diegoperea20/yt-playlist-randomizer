'use client'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { forwardRef, type ComponentPropsWithoutRef, type ComponentRef } from 'react'
import { useT } from '../../i18n/useT'
import { cn } from '../../lib/utils'

export const Dialog = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose = DialogPrimitive.Close
export const DialogTitle = DialogPrimitive.Title
export const DialogDescription = DialogPrimitive.Description

export const DialogContent = forwardRef<
  ComponentRef<typeof DialogPrimitive.Content>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(function DialogContent({ className, children, ...props }, ref) {
  const { t } = useT()

  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="animate-fade-in fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          // Bottom sheets only: on desktop the panels render inline instead.
          // Centered with margins, never with translate/transform: those would turn the
          // sheet into the containing block for `position: fixed` descendants and trap
          // dnd-kit's DragOverlay (it must resolve against the viewport to track the pointer).
          'panel animate-pop-in absolute top-auto right-0 bottom-0 left-0 z-50 mx-auto max-h-[88dvh] w-full overflow-y-auto rounded-b-none p-0 pb-[env(safe-area-inset-bottom)] shadow-2xl sm:max-w-md',
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="text-content-muted hover:text-content-primary absolute top-3 right-3 rounded-md p-1 transition-colors">
          <X className="size-4" />
          <span className="sr-only">{t('common.close')}</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
})
