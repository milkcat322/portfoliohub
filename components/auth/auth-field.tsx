import * as React from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

/**
 * Label + input pair used by the auth forms. `action` renders inline with the
 * label (e.g. a "forgot password" link).
 */
function AuthField({
  id,
  label,
  action,
  className,
  ...props
}: React.ComponentProps<"input"> & {
  id: string
  label: string
  action?: React.ReactNode
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id} className="text-[0.8125rem]">
          {label}
        </Label>
        {action}
      </div>
      <Input
        id={id}
        className={cn(
          "h-10 rounded-xl bg-transparent px-3 text-sm md:text-sm",
          className
        )}
        {...props}
      />
    </div>
  )
}

export { AuthField }
