import { Organization, OrganizationType } from '../types';

/**
 * One-click selections for a private event's visibility list: each preset
 * selects every organization whose type is in `types`.
 */
export interface OrgPreset {
  id: string;
  label: string;
  types: OrganizationType[];
}

export const ORG_PRESETS: OrgPreset[] = [
  {
    id: 'all-greek',
    label: 'All Greek',
    // Business Fraternity is left out on purpose: it's a professional club with
    // Greek letters, not part of Greek life.
    types: ['Panhellenic Sorority', 'Fraternity', 'Multicultural Fraternity'],
  },
  { id: 'panhellenic-sorority', label: 'Panhellenic Sorority', types: ['Panhellenic Sorority'] },
  { id: 'fraternity', label: 'Fraternity', types: ['Fraternity'] },
  { id: 'multicultural-fraternity', label: 'Multicultural Fraternity', types: ['Multicultural Fraternity'] },
];

const normalize = (type: string | undefined | null): string => (type ?? '').trim().toLowerCase();

/** Ids of every organization the preset covers. Type matching ignores case and padding. */
export const orgIdsForPreset = (preset: OrgPreset, organizations: Organization[]): number[] => {
  const wanted = new Set(preset.types.map(normalize));
  return organizations.filter((org) => wanted.has(normalize(org.type))).map((org) => org.id);
};

/** Adds the preset's organizations to a selection, keeping anything already picked. */
export const applyOrgPreset = (
  selected: number[],
  preset: OrgPreset,
  organizations: Organization[]
): number[] => {
  const next = new Set(selected);
  orgIdsForPreset(preset, organizations).forEach((id) => next.add(id));
  return [...next];
};
