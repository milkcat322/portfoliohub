import * as React from "react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

/**
 * Shell for auth screens (login, signup, password reset). Handles the card
 * chrome and heading so each form only has to render its own fields.
 */
function AuthCard({
  title,
  description,
  footer,
  children,
  className,
}: {
  title: string
  description?: string
  footer?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card
      className={cn(
        "w-full max-w-sm gap-6 rounded-2xl py-7 shadow-sm ring-border",
        className
      )}
    >
      <CardHeader className="gap-1.5 px-7 text-center">
        <CardTitle className="text-lg tracking-tight">{title}</CardTitle>
        {description ? (
          <CardDescription className="text-[0.8125rem]">
            {description}
          </CardDescription>
        ) : null}
      </CardHeader>

      <CardContent className="px-7">{children}</CardContent>

      {footer ? (
        <CardFooter className="justify-center px-7 text-xs text-muted-foreground">
          {footer}
        </CardFooter>
      ) : null}
    </Card>
  )
}

export { AuthCard }
