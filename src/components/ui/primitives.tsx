'use client'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

/** Small on/off switch used for the shuffle options. */
export function Switch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
  className,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
  className?: string
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start justify-between gap-3 py-0.5',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-content-primary">{label}</span>
        {description ? (
          <span className="text-content-muted mt-0.5 block text-xs leading-relaxed">
            {description}
          </span>
        ) : null}
      </span>
      {/* A native checkbox keeps the semantics right: the wrapping label, the keyboard and
          the disabled state each toggle exactly once, with no nested interactive elements. */}
      <input
        type="checkbox"
        role="switch"
        aria-label={label}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          'relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors',
          checked ? 'bg-brand' : 'bg-surface-hover',
          'peer-focus-visible:outline-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0 size-4 rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-4.5' : 'translate-x-0.5',
          )}
        />
      </span>
    </label>
  )
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-content-secondary mb-1.5 block text-xs font-semibold tracking-wide uppercase"
    >
      {children}
    </label>
  )
}

/** Shared section heading: icon + uppercase label, same rhythm in every panel. */
export function SectionTitle({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <h2 className="text-content-secondary flex min-w-0 items-center gap-1.5 text-xs font-semibold tracking-wider uppercase">
      {icon}
      <span className="truncate">{children}</span>
    </h2>
  )
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  compact = false,
}: {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  /** Tighter variant for height-constrained spaces like the video stage. */
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'text-content-muted flex flex-col items-center text-center',
        compact ? 'gap-2 px-6 py-6' : 'gap-2.5 px-6 py-10 sm:py-12',
      )}
    >
      {icon ? (
        <div
          className={cn(
            'bg-surface-overlay text-content-muted mb-1 flex items-center justify-center rounded-2xl',
            compact ? 'size-11 [&_svg]:size-5' : 'size-14 [&_svg]:size-7',
          )}
        >
          {icon}
        </div>
      ) : null}
      <p className="text-content-primary text-balance text-sm font-semibold">{title}</p>
      {description ? (
        <p className="max-w-xs text-xs leading-relaxed text-pretty">{description}</p>
      ) : null}
      {action}
    </div>
  )
}
