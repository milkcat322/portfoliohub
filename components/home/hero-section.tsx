import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowRight01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type HeroSectionProps = {
  eyebrow?: string
  title?: string
  description?: string
  primaryAction?: { label: string; href: string }
  secondaryAction?: { label: string; href: string }
  className?: string
}

/**
 * Centered Apple-style hero. Every string and CTA is a prop with a sensible
 * default so the same section can be reused on other marketing routes.
 */
function HeroSection({
  eyebrow = "학생 포트폴리오, 한 곳에서",
  title = "PortfolioHub",
  description = "동아리, 대회, 프로젝트, 봉사까지. 흩어져 있던 활동 기록을 한 곳에 모아 나만의 포트폴리오로 정리하세요.",
  primaryAction = { label: "시작하기", href: "/login" },
  secondaryAction = { label: "로그인", href: "/login" },
  className,
}: HeroSectionProps) {
  return (
    <section
      className={cn(
        "flex flex-col items-center justify-center px-6 pt-24 pb-20 text-center sm:pt-32 sm:pb-28",
        className
      )}
    >
      {eyebrow ? (
        <p className="mb-5 text-xs font-medium tracking-wide text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}

      <h1 className="font-heading text-5xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl md:text-7xl">
        {title}
      </h1>

      <p className="mt-6 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground sm:text-lg">
        {description}
      </p>

      <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
        <Button
          size="lg"
          className="h-11 w-full rounded-full px-7 text-sm sm:w-auto"
          render={<Link href={primaryAction.href} />}
        >
          {primaryAction.label}
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            className="size-4 transition-transform group-hover/button:translate-x-0.5"
          />
        </Button>

        <Button
          variant="outline"
          size="lg"
          className="h-11 w-full rounded-full px-7 text-sm sm:w-auto"
          render={<Link href={secondaryAction.href} />}
        >
          {secondaryAction.label}
        </Button>
      </div>
    </section>
  )
}

export { HeroSection }
