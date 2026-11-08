import * as React from "react"
import ReactMarkdown, { type Components, type ExtraProps } from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

/**
 * Maps a Markdown element to a styled tag. react-markdown also passes the
 * source AST `node`, which must not reach the DOM, so it is dropped here.
 */
function styled<T extends keyof React.JSX.IntrinsicElements>(
  Tag: T,
  className: string,
  extra?: React.JSX.IntrinsicElements[T]
) {
  function Styled({
    node: _node, // eslint-disable-line @typescript-eslint/no-unused-vars
    className: own,
    ...props
  }: React.JSX.IntrinsicElements[T] & ExtraProps & { className?: string }) {
    return React.createElement(Tag, {
      ...extra,
      ...props,
      className: cn(className, own),
    })
  }
  return Styled
}

/**
 * Element styles for rendered descriptions. Headings are shifted down a level
 * and sized close to body text so they structure the card without shouting.
 */
const COMPONENTS: Components = {
  h1: styled("h3", "mt-3 mb-1.5 text-[0.95em] font-semibold text-foreground first:mt-0"),
  h2: styled("h4", "mt-3 mb-1.5 text-[0.95em] font-semibold text-foreground first:mt-0"),
  h3: styled("h5", "mt-2.5 mb-1 font-semibold text-foreground first:mt-0"),
  h4: styled("h6", "mt-2.5 mb-1 font-medium text-foreground first:mt-0"),
  h5: styled("h6", "mt-2.5 mb-1 font-medium text-foreground first:mt-0"),
  h6: styled("h6", "mt-2.5 mb-1 font-medium text-foreground first:mt-0"),
  p: styled("p", "my-1.5 first:mt-0 last:mb-0"),
  ul: styled("ul", "my-1.5 list-disc space-y-0.5 pl-5 first:mt-0 last:mb-0"),
  ol: styled("ol", "my-1.5 list-decimal space-y-0.5 pl-5 first:mt-0 last:mb-0"),
  li: styled("li", "pl-0.5 [&.task-list-item]:list-none [&.task-list-item]:-ml-5"),
  blockquote: styled("blockquote", "my-2 border-l-2 border-border pl-3 italic"),
  a: styled("a", "text-foreground underline underline-offset-2", {
    target: "_blank",
    rel: "noreferrer noopener",
  }),
  strong: styled("strong", "font-semibold text-foreground"),
  code: styled("code", "rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]"),
  pre: styled(
    "pre",
    "my-2 overflow-x-auto rounded-lg bg-muted p-3 [&_code]:bg-transparent [&_code]:p-0"
  ),
  hr: styled("hr", "my-3 border-border"),
  table: styled("table", "my-2 block w-full overflow-x-auto border-collapse text-left"),
  th: styled("th", "border-b border-border px-2 py-1 font-medium text-foreground"),
  td: styled("td", "border-b border-border px-2 py-1"),
  input: styled("input", "mr-1.5 align-middle"),
}

/**
 * Renders an activity description as GitHub-flavoured Markdown (headings,
 * lists, tables, checklists, links).
 *
 * Raw HTML in the source is shown as text rather than rendered, so a
 * description can never inject markup or scripts.
 */
export function Markdown({
  children,
  className,
}: {
  children: string
  className?: string
}) {
  return (
    <div className={cn("break-words", className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>
        {children}
      </ReactMarkdown>
    </div>
  )
}
