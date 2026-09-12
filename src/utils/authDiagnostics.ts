/**
 * Fire-and-forget reporting for sign-in failures.
 *
 * The sign-in bug we're chasing ("Unable to process request due to missing
 * initial state") is intermittent and mobile-only, so it can't be caught by
 * hand -- it has to be recorded from real devices as it happens. Nothing here
 * may throw or block: a broken report must never make a broken login worse.
 */

const ENDPOINT_URL = import.meta.env.VITE_ENDPOINT_URL;

/** Which leg of sign-in produced the failure. */
export type AuthStage =
  | 'popup'
  | 'redirect-fallback'
  | 'redirect-inapp'
  | 'redirect-result';

/**
 * Whether the browser will actually let us use each store, checked by writing
 * rather than by feature-detecting -- Safari exposes both objects and then
 * throws on write in some privacy modes. This is the signal most likely to
 * explain the "missing initial state" failures.
 */
const probeStorage = (store: 'localStorage' | 'sessionStorage'): string => {
  try {
    const s = window[store];
    if (!s) return 'absent';
    const key = '__cc_probe__';
    s.setItem(key, '1');
    s.removeItem(key);
    return 'ok';
  } catch {
    return 'blocked';
  }
};

const collectContext = (): Record<string, string> => {
  const ctx: Record<string, string> = {};
  try {
    ctx.localStorage = probeStorage('localStorage');
    ctx.sessionStorage = probeStorage('sessionStorage');
    ctx.cookiesEnabled = String(navigator.cookieEnabled);
    ctx.online = String(navigator.onLine);
    ctx.platform = navigator.platform || 'unknown';
    ctx.language = navigator.language || 'unknown';
    ctx.screen = `${window.screen?.width ?? '?'}x${window.screen?.height ?? '?'}`;
    ctx.viewport = `${window.innerWidth}x${window.innerHeight}`;
    // Distinguishes a normal tab from an installed PWA or an embedded webview.
    ctx.displayMode = window.matchMedia?.('(display-mode: standalone)')?.matches
      ? 'standalone'
      : 'browser';
    ctx.href = window.location.href;
    ctx.authDomain = String(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'unset');
  } catch {
    // Context is best-effort; send whatever was gathered before the throw.
  }
  return ctx;
};

/**
 * Reports a sign-in failure. Always resolves, never throws.
 *
 * Sends no email, name or uid: sign-in has failed at this point, so there is no
 * authenticated subject, and the error code plus user agent is what's needed to
 * diagnose it. `keepalive` lets the request outlive the page, which matters
 * because the redirect paths navigate away immediately after reporting.
 */
export const reportAuthFailure = async (stage: AuthStage, error: unknown): Promise<void> => {
  try {
    if (!ENDPOINT_URL) return;

    const err = error as { code?: unknown; message?: unknown } | null;

    await fetch(`${ENDPOINT_URL}/api/client-errors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      mode: 'cors',
      credentials: 'omit',
      keepalive: true,
      body: JSON.stringify({
        kind: 'auth',
        stage,
        code: err?.code ? String(err.code) : 'none',
        message: err?.message ? String(err.message) : String(error),
        context: collectContext(),
      }),
    });
  } catch {
    // Reporting is strictly best-effort -- swallow everything.
  }
};

export default reportAuthFailure;
