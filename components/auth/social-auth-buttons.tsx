"use client"

import * as React from "react"
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { GithubIcon, GoogleIcon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { describeAuthError } from "@/lib/auth-errors"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type SocialProvider = {
  id: "google" | "github"
  label: string
  icon: IconSvgElement
}

const SOCIAL_PROVIDERS: SocialProvider[] = [
  { id: "google", label: "Google로 계속하기", icon: GoogleIcon },
  { id: "github", label: "GitHub로 계속하기", icon: GithubIcon },
]

/** Starts OAuth sign-in and returns the user through the shared auth callback. */
function SocialAuthButtons({
  providers = SOCIAL_PROVIDERS,
  className,
}: {
  providers?: SocialProvider[]
  className?: string
}) {
  const [activeProvider, setActiveProvider] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) {
        setActiveProvider(null)
      }
    }

    window.addEventListener("pageshow", handlePageShow)
    return () => window.removeEventListener("pageshow", handlePageShow)
  }, [])

  async function signIn(provider: SocialProvider["id"]) {
    setError(null)
    setActiveProvider(provider)

    try {
      const callbackUrl = new URL("/auth/callback", window.location.origin)
      const { data, error: signInError } =
        await createClient().auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: callbackUrl.toString(),
            skipBrowserRedirect: true,
          },
        })

      if (signInError) {
        setError(describeAuthError(signInError.message))
        setActiveProvider(null)
        return
      }

      if (!data.url) {
        setError("인증 제공자가 로그인 주소를 반환하지 않았습니다. 잠시 후 다시 시도해 주세요.")
        setActiveProvider(null)
        return
      }

      window.location.assign(data.url)
    } catch {
      setError("로그인 요청을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.")
      setActiveProvider(null)
    }
  }

  return (
    <div className={cn("grid gap-2", className)}>
      {error ? (
        <p role="alert" className="text-[0.8125rem] text-destructive">
          {error}
        </p>
      ) : null}
      {providers.map((provider) => (
        <Button
          key={provider.id}
          type="button"
          variant="outline"
          size="lg"
          disabled={activeProvider !== null}
          onClick={() => void signIn(provider.id)}
          className="h-10 w-full justify-center gap-2 rounded-xl text-sm font-normal"
        >
          <HugeiconsIcon
            icon={provider.icon}
            strokeWidth={1.8}
            className="size-4"
          />
          {activeProvider === provider.id
            ? "연결 중…"
            : provider.label}
        </Button>
      ))}
    </div>
  )
}

export { SocialAuthButtons, SOCIAL_PROVIDERS, type SocialProvider }
