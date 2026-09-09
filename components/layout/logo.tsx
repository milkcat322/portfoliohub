import Link from "next/link"

import { cn } from "@/lib/utils"

/**
 * PortfolioHub wordmark. Renders as a link to the landing page by default so it
 * can be dropped into any header; pass `asLink={false}` for static contexts.
 */
function Logo({
  className,
  asLink = true,
  showWordmark = true,
}: {
  className?: string
  asLink?: boolean
  showWordmark?: boolean
}) {
  const content = (
    <>
      <span
        aria-hidden
        className="flex size-7 items-center justify-center rounded-lg bg-foreground text-[0.8125rem] font-semibold text-background"
      >
        P
      </span>
      {showWordmark ? (
        <span className="font-heading text-[0.9375rem] font-semibold tracking-tight">
          PortfolioHub
        </span>
      ) : null}
    </>
  )

  const classes = cn(
    "inline-flex items-center gap-2 text-foreground transition-opacity hover:opacity-70",
    className
  )

  if (!asLink) {
    return <span className={classes}>{content}</span>
  }

  return (
    <Link href="/" aria-label="PortfolioHub 홈으로 이동" className={classes}>
      {content}
    </Link>
  )
}

export { Logo }
