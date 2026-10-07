"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

/** Signs the user out and sends them back to the login page. */
export function SignOutButton({ className }: { className?: string }) {
  const router = useRouter()
  const [submitting, setSubmitting] = React.useState(false)

  async function handleClick() {
    setSubmitting(true)

    try {
      await createClient().auth.signOut()
      router.replace("/login")
      // Re-renders the Server Components so they no longer see a session.
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="lg"
      onClick={handleClick}
      disabled={submitting}
      className={className}
    >
      {submitting ? "로그아웃 중…" : "로그아웃"}
    </Button>
  )
}
