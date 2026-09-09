import { FeaturesSection } from "@/components/home/features-section"
import { HeroSection } from "@/components/home/hero-section"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"

export default function Home() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
      </main>

      <SiteFooter />
    </>
  )
}
