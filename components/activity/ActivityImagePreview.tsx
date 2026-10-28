"use client"

import Image from "next/image"
import * as React from "react"

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

export function ActivityImagePreview({
  imageUrl,
  title,
}: {
  imageUrl: string
  title: string
}) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative block h-44 w-full overflow-hidden rounded-xl bg-muted focus-visible:outline-2 focus-visible:outline-ring"
        aria-label={`${title} 이미지 크게 보기`}
      >
        <Image
          src={imageUrl}
          alt={`${title} 활동 이미지`}
          fill
          unoptimized
          sizes="(max-width: 640px) 100vw, 50vw"
          className="object-cover transition-transform duration-300 hover:scale-[1.02]"
        />
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-w-5xl rounded-2xl border-0 bg-transparent p-2 shadow-none"
          showCloseButton
        >
          <DialogTitle className="sr-only">{title} 이미지</DialogTitle>
          <div className="relative flex max-h-[85vh] min-h-48 items-center justify-center">
            <Image
              src={imageUrl}
              alt={`${title} 활동 이미지 크게 보기`}
              width={1600}
              height={1200}
              unoptimized
              className="max-h-[85vh] w-auto max-w-full rounded-xl object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
