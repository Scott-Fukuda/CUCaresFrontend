import { describe, it, expect } from 'vitest';
import { Organization } from '../types';
import { ORG_PRESETS, applyOrgPreset, orgIdsForPreset } from './orgPresets';

const org = (id: number, type: string): Organization => ({ id, name: `Org ${id}`, type });

const organizations = [
  org(1, 'Panhellenic Sorority'),
  org(2, 'Fraternity'),
  org(3, 'Multicultural Fraternity'),
  org(4, 'Business Fraternity'),
  org(5, 'Sports Team'),
  org(6, 'panhellenic sorority '), // stored with odd casing/padding
];

const preset = (id: string) => ORG_PRESETS.find((p) => p.id === id)!;

describe('orgIdsForPreset', () => {
  it('All Greek covers sororities, fraternities and multicultural fraternities', () => {
    expect(orgIdsForPreset(preset('all-greek'), organizations)).toEqual([1, 2, 3, 6]);
  });

  it('All Greek leaves out business fraternities and non-Greek orgs', () => {
    const ids = orgIdsForPreset(preset('all-greek'), organizations);
    expect(ids).not.toContain(4);
    expect(ids).not.toContain(5);
  });

  it('each single-type preset selects only its own type', () => {
    expect(orgIdsForPreset(preset('panhellenic-sorority'), organizations)).toEqual([1, 6]);
    expect(orgIdsForPreset(preset('fraternity'), organizations)).toEqual([2]);
    expect(orgIdsForPreset(preset('multicultural-fraternity'), organizations)).toEqual([3]);
  });

  it('matches nothing when no org has the type', () => {
    expect(orgIdsForPreset(preset('fraternity'), [org(9, 'Religious')])).toEqual([]);
  });
});

describe('applyOrgPreset', () => {
  it('adds to the existing selection instead of replacing it', () => {
    expect(applyOrgPreset([5], preset('fraternity'), organizations)).toEqual([5, 2]);
  });

  it('does not duplicate orgs that were already selected', () => {
    expect(applyOrgPreset([2], preset('all-greek'), organizations)).toEqual([2, 1, 3, 6]);
  });

  it('is idempotent', () => {
    const once = applyOrgPreset([], preset('all-greek'), organizations);
    expect(applyOrgPreset(once, preset('all-greek'), organizations)).toEqual(once);
  });
});
