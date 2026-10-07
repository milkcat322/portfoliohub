import Link from "next/link"

import { SignOutButton } from "@/components/auth/sign-out-button"
import { Logo } from "@/components/layout/logo"
import { buttonVariants } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/server"
import { cn } from "@/lib/utils"

/** Shared sizing for the header's auth links. */
const NAV_ACTION_CLASSES = "rounded-full px-3.5 text-[0.8125rem]"

/**
 * Slim translucent top bar shared by the marketing pages.
 *
 * The actions reflect the session: showing "로그인 / 시작하기" to someone who is
 * already signed in is misleading, because proxy.ts bounces them straight back
 * to the dashboard and it looks as if the buttons did nothing.
 *
 * `actions={false}` hides them entirely (e.g. on the login page itself).
 */
async function SiteHeader({
  className,
  actions = true,
}: {
  className?: string
  actions?: boolean
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    NAV_ACTION_CLASSES
                  )}
                >
                  대시보드
                </Link>
                <SignOutButton
                  className={cn(
                    "border-transparent bg-transparent hover:bg-muted",
                    NAV_ACTION_CLASSES,
                    "h-7"
                  )}
                />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "lg" }),
                    NAV_ACTION_CLASSES
                  )}
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    NAV_ACTION_CLASSES
                  )}
                >
                  시작하기
                </Link>
              </>
            )}
          </nav>
        ) : null}
      </div>
    </header>
  )
}

export { SiteHeader }
