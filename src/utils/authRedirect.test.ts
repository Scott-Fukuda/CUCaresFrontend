import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AUTH_ROUTES,
  DEFAULT_REDIRECT_PATH,
  captureEntryPath,
  clearIntendedPath,
  consumeIntendedPath,
  readIntendedPath,
  rememberIntendedPath,
  resolveRedirectPath,
  signInRedirectState,
} from './authRedirect';

/** Tests run in node, which has no sessionStorage — stand one up. */
const installStorage = (impl?: Partial<Storage>) => {
  const data = new Map<string, string>();
  const store: Storage = {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
    key: (i: number) => [...data.keys()][i] ?? null,
    get length() {
      return data.size;
    },
    ...impl,
  } as Storage;
  vi.stubGlobal('sessionStorage', store);
  return store;
};

describe('signed-out sign-up redirect', () => {
  it('points the sign-in prompt back at the event', () => {
    expect(signInRedirectState('/opportunity/42')).toEqual({
      from: { pathname: '/opportunity/42', search: '', hash: '' },
    });
  });

  it('returns the visitor to the event they tried to sign up for, not the home page', () => {
    const state = signInRedirectState('/opportunity/42');
    expect(resolveRedirectPath(state)).toBe('/opportunity/42');
  });

  it('returns the visitor to the multiopp they clicked', () => {
    expect(resolveRedirectPath(signInRedirectState('/multiopp/7'))).toBe('/multiopp/7');
  });

  it('keeps search and hash on the way back', () => {
    const state = signInRedirectState('/opportunity/42', '?ref=explore', '#signup');
    expect(resolveRedirectPath(state)).toBe('/opportunity/42?ref=explore#signup');
  });

  it('falls back to the default page when there is nowhere to return to', () => {
    expect(resolveRedirectPath(null)).toBe(DEFAULT_REDIRECT_PATH);
    expect(resolveRedirectPath({})).toBe(DEFAULT_REDIRECT_PATH);
    expect(resolveRedirectPath(signInRedirectState('/explore'))).toBe(DEFAULT_REDIRECT_PATH);
  });

  it('treats the sign-up prompt itself as a signed-out route', () => {
    expect(AUTH_ROUTES.has('/sign-up')).toBe(true);
    expect(resolveRedirectPath(signInRedirectState('/sign-up'))).toBe(DEFAULT_REDIRECT_PATH);
  });
});

describe('remembering where the visitor was headed', () => {
  beforeEach(() => {
    installStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('remembers a deep link and hands it back once', () => {
    rememberIntendedPath('/opportunity/583');
    expect(readIntendedPath()).toBe('/opportunity/583');
    expect(consumeIntendedPath()).toBe('/opportunity/583');
    // Consumed: a later sign-in must not bounce somewhere stale
    expect(readIntendedPath()).toBeNull();
  });

  it('keeps the query string and hash of the original link', () => {
    rememberIntendedPath('/opportunity/583', '?ref=sms', '#signup');
    expect(readIntendedPath()).toBe('/opportunity/583?ref=sms#signup');
  });

  it('refuses to remember the auth pages themselves', () => {
    rememberIntendedPath('/login');
    rememberIntendedPath('/sign-up');
    rememberIntendedPath('');
    expect(readIntendedPath()).toBeNull();
  });

  it('keeps the newest destination when the visitor opens another link', () => {
    rememberIntendedPath('/opportunity/1');
    rememberIntendedPath('/multiopp/7');
    expect(readIntendedPath()).toBe('/multiopp/7');
  });

  it('forgets on demand, as when a session ends', () => {
    rememberIntendedPath('/opportunity/583');
    clearIntendedPath();
    expect(readIntendedPath()).toBeNull();
  });

  it('sends the visitor to the remembered link when router state was lost', () => {
    expect(resolveRedirectPath(null, '/opportunity/583')).toBe('/opportunity/583');
    expect(resolveRedirectPath({}, '/opportunity/583?ref=sms')).toBe('/opportunity/583?ref=sms');
  });

  it('prefers router state over the remembered link', () => {
    const state = signInRedirectState('/opportunity/42');
    expect(resolveRedirectPath(state, '/opportunity/583')).toBe('/opportunity/42');
  });

  it('falls back to the remembered link when state points at an auth page', () => {
    const state = signInRedirectState('/login');
    expect(resolveRedirectPath(state, '/opportunity/583')).toBe('/opportunity/583');
  });

  it('ignores a remembered auth page, query string and all', () => {
    expect(resolveRedirectPath(null, '/login?next=/x')).toBe(DEFAULT_REDIRECT_PATH);
    expect(resolveRedirectPath(null, null)).toBe(DEFAULT_REDIRECT_PATH);
  });
});

describe('when storage is unavailable', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('signing in still works in a browser with no sessionStorage', () => {
    vi.stubGlobal('sessionStorage', undefined);
    expect(() => rememberIntendedPath('/opportunity/583')).not.toThrow();
    expect(readIntendedPath()).toBeNull();
    expect(consumeIntendedPath()).toBeNull();
    expect(resolveRedirectPath(signInRedirectState('/opportunity/42'))).toBe('/opportunity/42');
  });

  it('signing in still works when storage throws, as in private mode', () => {
    const boom = () => {
      throw new Error('blocked');
    };
    installStorage({ getItem: boom, setItem: boom, removeItem: boom });
    expect(() => rememberIntendedPath('/opportunity/583')).not.toThrow();
    expect(readIntendedPath()).toBeNull();
    expect(resolveRedirectPath(null)).toBe(DEFAULT_REDIRECT_PATH);
  });
});

describe('capturing the URL the app was opened at', () => {
  const openAt = (href: string) => {
    const url = new URL(`https://www.campuscares.us${href}`);
    vi.stubGlobal('window', {
      location: { pathname: url.pathname, search: url.search, hash: url.hash },
    });
  };

  beforeEach(() => {
    installStorage();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('catches a shared event link before any routing runs', () => {
    openAt('/opportunity/583');
    captureEntryPath();
    expect(readIntendedPath()).toBe('/opportunity/583');
  });

  it('keeps the query string and hash of the opened link', () => {
    openAt('/opportunity/583?ref=sms#signup');
    captureEntryPath();
    expect(readIntendedPath()).toBe('/opportunity/583?ref=sms#signup');
  });

  it('ignores a landing on the sign-in pages themselves', () => {
    openAt('/login');
    captureEntryPath();
    openAt('/');
    captureEntryPath();
    expect(readIntendedPath()).toBeNull();
  });

  it('survives the trip: opened link comes back as the post-sign-in target', () => {
    openAt('/opportunity/583');
    captureEntryPath();
    // ...visitor is bounced to /login, where router state was lost
    expect(resolveRedirectPath(null, consumeIntendedPath())).toBe('/opportunity/583');
  });
});
