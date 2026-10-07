/**
 * Turns a Supabase auth error into something a user can act on.
 *
 * GoTrue returns short English strings like "email rate limit exceeded" that
 * say nothing about what to do next, so the ones we can actually hit during
 * signup and login get a Korean explanation with the fix attached.
 */
const MESSAGES: { match: RegExp; message: string }[] = [
  {
    match: /email rate limit exceeded/i,
    message:
      "메일 발송 한도를 초과했습니다. Supabase 기본 메일 서버는 시간당 발송 수가 제한됩니다. 잠시 후 다시 시도하거나, Supabase 대시보드에서 이메일 확인(Confirm email)을 끄면 메일 없이 바로 가입됩니다.",
  },
  {
    match: /user already registered|already been registered/i,
    message: "이미 가입된 이메일입니다. 로그인해 주세요.",
  },
  {
    match: /invalid login credentials/i,
    message: "이메일 또는 비밀번호가 올바르지 않습니다.",
  },
  {
    match: /email not confirmed/i,
    message:
      "메일 인증이 아직 완료되지 않았습니다. 받은 메일의 링크를 눌러 인증한 뒤 다시 로그인해 주세요.",
  },
  {
    match: /is invalid$|invalid email/i,
    message:
      "사용할 수 없는 이메일 주소입니다. 실제로 받을 수 있는 주소를 입력해 주세요.",
  },
  {
    match: /password should be at least (\d+)/i,
    message: "비밀번호가 너무 짧습니다.",
  },
  {
    match: /signups not allowed|signup is disabled/i,
    message:
      "현재 회원가입이 막혀 있습니다. Supabase 대시보드의 Authentication 설정을 확인해 주세요.",
  },
  {
    match: /for security purposes|request this after/i,
    message: "요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.",
  },
]

export function describeAuthError(raw: string): string {
  const known = MESSAGES.find((entry) => entry.match.test(raw))

  // Keep the original text when it is not one we recognise — a mystery message
  // is still more useful than a generic one.
  return known ? known.message : raw
}

/** Message for a failed fetch, where there is no Supabase error to read. */
export const AUTH_NETWORK_ERROR =
  "Supabase에 연결하지 못했습니다. 프로젝트 상태와 .env.local 설정을 확인해 주세요."
