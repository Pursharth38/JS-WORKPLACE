import "server-only";

const VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Server-side Turnstile check. The widget in the browser proves nothing on its
 * own — this call is what actually verifies the token, and it must happen
 * before anything is written.
 *
 * Returns true when TURNSTILE_SECRET_KEY is unset. That is deliberate: the
 * client's Cloudflare account does not exist yet, and a hard failure here would
 * make every form on the site unusable in development and in CI. The honeypot
 * and the rate limiter still apply, so the form is never completely open.
 * ⚠️ Set the secret before launch — tracked in P1-08.
 */
export async function verifyTurnstile(
  token: string | undefined,
  ip: string,
): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn(
      "[turnstile] TURNSTILE_SECRET_KEY not set — skipping bot verification",
    );
    return true;
  }

  if (!token) return false;

  try {
    const body = new URLSearchParams({
      secret,
      response: token,
      remoteip: ip,
    });

    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body,
      // Never let a slow Cloudflare response hold a form submission open.
      signal: AbortSignal.timeout(5000),
    });

    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch (err) {
    // Fail CLOSED on a verification error. Unlike the rate limiter — whose job
    // is only to slow abuse — this gate is the bot check itself, and letting
    // submissions through when it breaks defeats the point.
    console.error("[turnstile] verification failed", err);
    return false;
  }
}
