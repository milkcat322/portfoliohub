import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Feature = {
  icon: IconSvgElement
  title: string
  description: string
}

/**
 * A single service-feature tile. Kept presentational so any list of
 * `Feature` objects can be rendered with it.
 */
function FeatureCard({
  icon,
  title,
  description,
  className,
}: Feature & { className?: string }) {
  return (
    <Card
      className={cn(
        "h-full gap-0 rounded-2xl bg-card/60 py-6 ring-border transition-shadow hover:shadow-sm",
        className
      )}
    >
      <CardHeader className="gap-3 px-6">
        <span className="flex size-9 items-center justify-center rounded-xl bg-muted text-foreground">
          <HugeiconsIcon icon={icon} strokeWidth={1.8} className="size-4.5" />
        </span>
        <CardTitle className="text-[0.9375rem] tracking-tight">
          {title}
        </CardTitle>
        <CardDescription className="text-[0.8125rem] leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

export { FeatureCard, type Feature }
