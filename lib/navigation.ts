/**
 * Accepts a `redirectTo` query value only if it is a path inside this app.
 *
 * Anything that resolves outside this app (including backslash-based URL
 * variants) is dropped, so a sign-in redirect cannot send users elsewhere.
 */
export function safeRedirectPath(
  value: string | string[] | undefined,
  fallback = "/dashboard"
): string {
  const path = Array.isArray(value) ? value[0] : value

  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return fallback
  }

  const destination = new URL(path, "https://portfoliohub.local")

  if (destination.origin !== "https://portfoliohub.local") {
    return fallback
  }

  return `${destination.pathname}${destination.search}${destination.hash}`
}
