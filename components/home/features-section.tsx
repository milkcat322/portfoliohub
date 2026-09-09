import {
  ChartAnalysisIcon,
  LayoutGridIcon,
  Link01Icon,
  Note01Icon,
} from "@hugeicons/core-free-icons"

import { FeatureCard, type Feature } from "@/components/home/feature-card"
import { cn } from "@/lib/utils"

const DEFAULT_FEATURES: Feature[] = [
  {
    icon: Note01Icon,
    title: "활동 기록",
    description:
      "대회, 동아리, 봉사, 프로젝트를 날짜와 함께 남기고 언제든 다시 찾아보세요.",
  },
  {
    icon: LayoutGridIcon,
    title: "포트폴리오 정리",
    description:
      "기록한 활동을 분야별로 모아 한 장의 포트폴리오로 자동 정리합니다.",
  },
  {
    icon: ChartAnalysisIcon,
    title: "성장 분석",
    description:
      "활동 분포와 누적 시간을 한눈에 확인하고 부족한 영역을 채워 나가세요.",
  },
  {
    icon: Link01Icon,
    title: "간편한 공유",
    description:
      "링크 하나로 선생님과 친구에게 공유하고, 공개 범위는 직접 정할 수 있습니다.",
  },
]

/**
 * Four-up feature grid. Accepts a custom `features` list so the grid can be
 * reused with different copy.
 */
function FeaturesSection({
  features = DEFAULT_FEATURES,
  className,
}: {
  features?: Feature[]
  className?: string
}) {
  return (
    <section className={cn("px-6 pb-24 sm:pb-32", className)}>
      <div className="mx-auto grid w-full max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  )
}

export { FeaturesSection, DEFAULT_FEATURES }
