import Link from "next/link"

import { Logo } from "@/components/layout/logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

/**
 * Slim translucent top bar shared by the marketing pages.
 * `actions={false}` hides the auth buttons (e.g. on the login page itself).
 */
function SiteHeader({
  className,
  actions = true,
}: {
  className?: string
  actions?: boolean
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl",
        className
      )}
    >
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
        <Logo />

        {actions ? (
          <nav className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="lg"
              className="rounded-full px-3.5 text-[0.8125rem]"
              render={<Link href="/login" />}
            >
              로그인
            </Button>
            <Button
              size="lg"
              className="rounded-full px-3.5 text-[0.8125rem]"
              render={<Link href="/login" />}
            >
              시작하기
            </Button>
          </nav>
        ) : null}
      </div>
    </header>
  )
}

export { SiteHeader }
