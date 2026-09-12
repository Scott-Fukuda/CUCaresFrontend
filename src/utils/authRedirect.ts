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

/** Where to send a user once they are signed in. */
export const resolveRedirectPath = (state: RedirectState | null | undefined): string => {
  const from = state?.from;
  if (from?.pathname) {
    if (AUTH_ROUTES.has(from.pathname)) {
      return DEFAULT_REDIRECT_PATH;
    }
    const search = from.search ?? '';
    const hash = from.hash ?? '';
    return `${from.pathname}${search}${hash}`;
  }
  return DEFAULT_REDIRECT_PATH;
};
