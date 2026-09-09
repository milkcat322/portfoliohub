import { cn } from "@/lib/utils"

function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("border-t border-border/60", className)}>
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-1 px-6 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} PortfolioHub
        </p>
        <p className="text-xs text-muted-foreground">
          학생 활동 기록 · 포트폴리오 관리 플랫폼
        </p>
      </div>
    </footer>
  )
}

export { SiteFooter }
