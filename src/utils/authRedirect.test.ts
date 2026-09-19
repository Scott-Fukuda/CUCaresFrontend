import { describe, it, expect } from 'vitest';
import {
  AUTH_ROUTES,
  DEFAULT_REDIRECT_PATH,
  resolveRedirectPath,
  signInRedirectState,
} from './authRedirect';

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
