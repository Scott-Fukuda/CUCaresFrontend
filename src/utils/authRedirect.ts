import type { Location } from 'react-router-dom';

const PUBLIC_AUTH_PATH_SET = new Set<string>(['/login', '/register', '/about-us', '/']);

const extractBasePath = (path: string) => path.split('#')[0].split('?')[0];

export const isAuthPublicPath = (path: string) => PUBLIC_AUTH_PATH_SET.has(extractBasePath(path));

export const sanitizeRedirectPath = (path?: string | null) => {
  if (!path) {
    return '/opportunities';
  }
  return isAuthPublicPath(path) ? '/opportunities' : path;
};

export const buildRedirectPath = (location: Location) =>
  `${location.pathname}${location.search}${location.hash}`;
