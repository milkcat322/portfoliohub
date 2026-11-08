import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowDown01Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"

/**
 * Styled native `<select>`. Native keeps keyboard, screen reader and mobile
 * picker behaviour for free, which matters more here than a custom popup.
 */
function NativeSelect({
  className,
  wrapperClassName,
  ...props
}: React.ComponentProps<"select"> & { wrapperClassName?: string }) {
  return (
    <div className={cn("relative", wrapperClassName)}>
      <select
        data-slot="native-select"
        className={cn(
          "h-10 w-full appearance-none rounded-xl border border-input bg-transparent pr-9 pl-3 text-sm outline-none transition-colors",
          "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50",
          "[&>option]:bg-popover [&>option]:text-popover-foreground",
          className
        )}
        {...props}
      />
      <HugeiconsIcon
        icon={ArrowDown01Icon}
        strokeWidth={1.8}
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  )
}

export { NativeSelect }
