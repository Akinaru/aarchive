"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground",
        destructive:
          "text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90",
        info:
          "border-amber-300/60 bg-amber-50 text-amber-900 dark:border-amber-400/30 dark:bg-amber-950/40 dark:text-amber-100 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-400 *:data-[slot=alert-description]:text-amber-800/90 dark:*:data-[slot=alert-description]:text-amber-200/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

type AlertProps = React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & {
    closable?: boolean
    onClose?: () => void
    closeLabel?: string
  }

function Alert({
  className,
  variant,
  closable = false,
  onClose,
  closeLabel = "Close",
  ...props
}: AlertProps) {
  const [open, setOpen] = React.useState(true)
  if (!open) return null

  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), closable && "pr-10", className)}
      {...props}
    >
      {props.children}
      {closable && (
        <button
          type="button"
          aria-label={closeLabel}
          onClick={() => {
            setOpen(false)
            onClose?.()
          }}
          className="cursor-pointer absolute right-1.5 top-1.5 inline-flex size-6 items-center justify-center rounded-md text-foreground/60 hover:bg-foreground/10 hover:text-foreground focus:outline-none"
        >
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      )}
    </div>
  )
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-title"
      className={cn("col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight", className)}
      {...props}
    />
  )
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-muted-foreground col-start-2 text-sm [&_p]:leading-relaxed", className)}
      {...props}
    />
  )
}

export { Alert, AlertTitle, AlertDescription }
