export type RedirectState = {
  from?: {
    pathname: string;
    search?: string;
    hash?: string;
  };
};

/**
 * Routes an unauthenticated visitor can sit on. Landing on one of these after
 * signing in means there is nowhere specific to return to.
 */
export const AUTH_ROUTES = new Set([
  '/login',
  '/register',
  '/sign-up',
  '/about-us',
  '/',
  '/explore',
]);

export const DEFAULT_REDIRECT_PATH = '/opportunities';

/**
 * State to hand the sign-in prompt so the user comes back to `pathname` once
 * they are signed in, instead of the default landing page.
 */
export const signInRedirectState = (
  pathname: string,
  search = '',
  hash = ''
): RedirectState => ({ from: { pathname, search, hash } });

/**
 * Where the intended destination is parked while the visitor signs in.
 *
 * Router state alone isn't enough: it's dropped the moment the visitor moves
 * between /login and /sign-up, reloads, or is bounced through a provider that
 * reloads the page. sessionStorage survives all of those and is per-tab, so two
 * tabs opened on different events don't fight over the destination.
 */
const INTENDED_PATH_KEY = 'campuscares:intendedPath';

/**
 * Storage access throws outright in some privacy modes rather than failing
 * soft, and a broken return trip must never break signing in.
 */
const safeStorage = <T,>(operation: (store: Storage) => T, fallback: T): T => {
  try {
    if (typeof sessionStorage === 'undefined') return fallback;
    return operation(sessionStorage);
  } catch {
    return fallback;
  }
};

/**
 * Records the URL the app was opened at, before any routing has run.
 *
 * This is the reliable place to catch a shared link. Doing it from a component
 * means racing the redirect that unmounts it, and it misses any entry point
 * that never renders that component; at boot there is nothing to race.
 */
export const captureEntryPath = (): void => {
  if (typeof window === 'undefined') return;
  const { pathname, search, hash } = window.location;
  rememberIntendedPath(pathname, search, hash);
};

/** Records where the visitor was headed before being sent to sign in. */
export const rememberIntendedPath = (pathname: string, search = '', hash = ''): void => {
  // A sign-in page is not a destination — remembering one would strand the
  // visitor in the auth flow after they sign in.
  if (!pathname || AUTH_ROUTES.has(pathname)) return;
  safeStorage((store) => store.setItem(INTENDED_PATH_KEY, `${pathname}${search}${hash}`), undefined);
};

export const readIntendedPath = (): string | null =>
  safeStorage((store) => store.getItem(INTENDED_PATH_KEY), null);

export const clearIntendedPath = (): void => {
  safeStorage((store) => store.removeItem(INTENDED_PATH_KEY), undefined);
};

/** Reads the remembered destination and forgets it, so it's used exactly once. */
export const consumeIntendedPath = (): string | null => {
  const path = readIntendedPath();
  clearIntendedPath();
  return path;
};

/**
 * Where to send a user once they are signed in.
 *
 * Router state wins when it's there, since it's the most specific record of
 * what the visitor clicked; `storedPath` is the fallback for the trips that
 * lose it.
 */
export const resolveRedirectPath = (
  state: RedirectState | null | undefined,
  storedPath?: string | null
): string => {
  const from = state?.from;
  if (from?.pathname && !AUTH_ROUTES.has(from.pathname)) {
    const search = from.search ?? '';
    const hash = from.hash ?? '';
    return `${from.pathname}${search}${hash}`;
  }

  if (storedPath) {
    // Compare against the path alone: a stored "/opportunity/5?x=1" is a
    // destination even though the raw string isn't in AUTH_ROUTES.
    const [pathname] = storedPath.split(/[?#]/);
    if (!AUTH_ROUTES.has(pathname)) return storedPath;
  }

  return DEFAULT_REDIRECT_PATH;
};
