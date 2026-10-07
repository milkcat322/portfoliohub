import { FeaturesSection } from "@/components/home/features-section"
import { HeroSection } from "@/components/home/hero-section"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { createClient } from "@/lib/supabase/server"

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <>
      <SiteHeader />

      <main className="flex-1">
        {/*
          Someone already signed in has nowhere to go from "시작하기" except the
          dashboard — proxy.ts would redirect them there anyway — so say so
          rather than offering a login they cannot reach.
        */}
        <HeroSection
          primaryAction={
            user
              ? { label: "대시보드로 가기", href: "/dashboard" }
              : { label: "시작하기", href: "/signup" }
          }
          secondaryAction={user ? null : { label: "로그인", href: "/login" }}
        />
        <FeaturesSection />
      </main>

      <SiteFooter />
    </>
  )
}
