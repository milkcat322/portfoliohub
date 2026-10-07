/**
 * Accepts a `redirectTo` query value only if it is a path inside this app.
 *
 * Anything absolute (`https://evil.example`) or protocol-relative (`//evil`)
 * is dropped, so the query string cannot be used to bounce a freshly
 * signed-in user off to another site.
 */
export function safeRedirectPath(
  value: string | string[] | undefined,
  fallback = "/dashboard"
): string {
  const path = Array.isArray(value) ? value[0] : value

  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return fallback
  }

  return path
}
