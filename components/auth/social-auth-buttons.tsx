import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"
import { GithubIcon, GoogleIcon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
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

/**
 * Third-party sign-in buttons. UI only for now — no provider is connected, so
 * these render as inert buttons until auth is added.
 */
function SocialAuthButtons({
  providers = SOCIAL_PROVIDERS,
  className,
}: {
  providers?: SocialProvider[]
  className?: string
}) {
  return (
    <div className={cn("grid gap-2", className)}>
      {providers.map((provider) => (
        <Button
          key={provider.id}
          type="button"
          variant="outline"
          size="lg"
          className="h-10 w-full justify-center gap-2 rounded-xl text-sm font-normal"
        >
          <HugeiconsIcon
            icon={provider.icon}
            strokeWidth={1.8}
            className="size-4"
          />
          {provider.label}
        </Button>
      ))}
    </div>
  )
}

export { SocialAuthButtons, SOCIAL_PROVIDERS, type SocialProvider }
