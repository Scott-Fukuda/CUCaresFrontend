/**
 * Demo export for sorority chapters: a two-tab workbook of service hours and
 * requirement completion.
 *
 * The data here is fabricated on purpose — this is a shape-of-the-feature demo,
 * not a report of anything real. Nothing in this file reads the API, so what a
 * chapter downloads today is the same fixture for every chapter. The sheet
 * builders below take their data as arguments, so swapping the fixture for real
 * service records later is a change at the call site, not a rewrite.
 */

import { XlsxSheet } from './xlsx';

/** An org type counts as a sorority however it's spelled ("Panhellenic Sorority"). */
export const isSororityOrg = (type: string | undefined | null): boolean =>
  /sorority/i.test(type ?? '');

export interface DemoOpportunity {
  id: number;
  name: string;
  hostOrgName: string;
  hostOrgType: string;
}

export interface DemoMember {
  id: number;
  name: string;
}

/** One user at one opportunity — the unit a requirement consumes. */
export interface DemoServiceRecord {
  userId: number;
  opportunityId: number;
  hours: number;
}

export interface SororityReportData {
  members: DemoMember[];
  opportunities: DemoOpportunity[];
  records: DemoServiceRecord[];
}

export interface RequirementDefinition {
  name: string;
  /** Whether this record is the kind that can satisfy the requirement. */
  isEligible: (record: DemoServiceRecord, data: SororityReportData) => boolean;
}

export const REQUIREMENTS: RequirementDefinition[] = [
  {
    name: 'Req 1: Served at a sorority-hosted opportunity',
    isEligible: (record, data) => {
      const opp = data.opportunities.find((o) => o.id === record.opportunityId);
      return !!opp && isSororityOrg(opp.hostOrgType);
    },
  },
  {
    name: 'Req 2: Volunteered at any opportunity',
    isEligible: () => true,
  },
];

/* -------------------------------------------------------------------------- */
/* Dummy data                                                                  */
/* -------------------------------------------------------------------------- */

const DEMO_OPPORTUNITIES: DemoOpportunity[] = [
  { id: 101, name: 'Ithaca Food Bank Sort', hostOrgName: 'Kappa Alpha Theta', hostOrgType: 'Panhellenic Sorority' },
  { id: 102, name: 'Cayuga Creek Cleanup', hostOrgName: 'Cornell Outdoor Club', hostOrgType: 'Other' },
  { id: 103, name: 'Greek Week Blood Drive', hostOrgName: 'Delta Gamma', hostOrgType: 'Panhellenic Sorority' },
  { id: 104, name: 'Loaves & Fishes Dinner Service', hostOrgName: 'Loaves & Fishes', hostOrgType: 'Community Service' },
  { id: 105, name: 'Tutoring at BJM Elementary', hostOrgName: 'Alpha Phi', hostOrgType: 'Panhellenic Sorority' },
];

const DEMO_MEMBERS: DemoMember[] = [
  { id: 4101, name: 'Ava Ramirez' },
  { id: 4102, name: 'Priya Shah' },
  { id: 4103, name: 'Maya Chen' },
  { id: 4104, name: 'Sofia Rossi' },
  { id: 4105, name: 'Jordan Lee' },
  { id: 4106, name: 'Elena Novak' },
  { id: 4107, name: 'Hannah Okafor' },
  { id: 4108, name: 'Lily Tran' },
  { id: 4109, name: 'Chloe Martin' },
  { id: 4110, name: 'Grace Kim' },
  { id: 4111, name: 'Isabella Cruz' },
  { id: 4112, name: 'Nora Whitfield' },
  { id: 4113, name: 'Zoe Patel' },
  { id: 4114, name: 'Amara Nwosu' },
  { id: 4115, name: 'Leah Goldberg' },
  { id: 4116, name: 'Mia Alvarez' },
  { id: 4117, name: 'Harper Wilson' },
  { id: 4118, name: 'Rachel Kowalski' },
  { id: 4119, name: 'Nina Petrov' },
  { id: 4120, name: 'Kate Brennan' },
];

/**
 * Deliberately covers all four requirement outcomes, including the case the
 * one-record-one-requirement rule exists for: Priya served once, at a
 * sorority-hosted event, so that record satisfies Req 1 and leaves Req 2 unmet.
 */
const DEMO_RECORDS: DemoServiceRecord[] = [
  { userId: 4101, opportunityId: 101, hours: 2.5 },
  { userId: 4101, opportunityId: 104, hours: 3 },
  { userId: 4102, opportunityId: 103, hours: 1.5 },
  { userId: 4103, opportunityId: 102, hours: 4 },
  { userId: 4103, opportunityId: 104, hours: 2 },
  { userId: 4104, opportunityId: 101, hours: 2 },
  { userId: 4104, opportunityId: 103, hours: 1.5 },
  { userId: 4104, opportunityId: 105, hours: 3 },
  { userId: 4106, opportunityId: 102, hours: 1 },
  { userId: 4107, opportunityId: 105, hours: 3 },
  { userId: 4107, opportunityId: 102, hours: 2 },
  { userId: 4108, opportunityId: 101, hours: 2 },
  { userId: 4109, opportunityId: 104, hours: 2.5 },
  { userId: 4109, opportunityId: 102, hours: 1.5 },
  { userId: 4111, opportunityId: 103, hours: 1.5 },
  { userId: 4111, opportunityId: 105, hours: 3 },
  { userId: 4111, opportunityId: 104, hours: 2 },
  { userId: 4112, opportunityId: 104, hours: 3 },
  { userId: 4113, opportunityId: 105, hours: 2 },
  { userId: 4114, opportunityId: 101, hours: 2.5 },
  { userId: 4114, opportunityId: 103, hours: 1.5 },
  { userId: 4116, opportunityId: 102, hours: 4 },
  { userId: 4117, opportunityId: 101, hours: 2 },
  { userId: 4117, opportunityId: 104, hours: 3 },
  { userId: 4118, opportunityId: 103, hours: 1.5 },
  { userId: 4119, opportunityId: 101, hours: 1 },
  { userId: 4119, opportunityId: 102, hours: 1 },
  { userId: 4119, opportunityId: 105, hours: 2 },
  { userId: 4120, opportunityId: 104, hours: 1.5 },
  { userId: 4120, opportunityId: 102, hours: 2 },
];

export const demoReportData = (): SororityReportData => ({
  members: DEMO_MEMBERS,
  opportunities: DEMO_OPPORTUNITIES,
  records: DEMO_RECORDS,
});

/* -------------------------------------------------------------------------- */
/* Sheets                                                                      */
/* -------------------------------------------------------------------------- */

/** Opportunities anyone in the chapter served at, in the order they're listed. */
export const servedOpportunities = (data: SororityReportData): DemoOpportunity[] => {
  const served = new Set(data.records.map((r) => r.opportunityId));
  return data.opportunities.filter((opp) => served.has(opp.id));
};

/** Tab 1: a member per row, an opportunity per column, hours in the cells. */
export const buildHoursSheet = (data: SororityReportData): XlsxSheet => {
  const opportunities = servedOpportunities(data);

  const hoursByUser = new Map<string, number>();
  data.records.forEach((record) => {
    const key = `${record.userId}-${record.opportunityId}`;
    hoursByUser.set(key, (hoursByUser.get(key) ?? 0) + record.hours);
  });

  const header = ['Name', 'User ID', ...opportunities.map((o) => o.name), 'Total Hours'];

  const rows = data.members.map((member) => {
    const cells = opportunities.map((opp) => hoursByUser.get(`${member.id}-${opp.id}`) ?? 0);
    const total = cells.reduce((sum, hours) => sum + hours, 0);
    return [member.name, member.id, ...cells, total];
  });

  return { name: 'Hours by Opportunity', rows: [header, ...rows] };
};

/**
 * Assigns each of a member's service records to at most one requirement.
 *
 * A record can satisfy several requirements but may only be spent on one, so
 * handing records out first-come-first-served would leave requirements unmet
 * that a different assignment could have satisfied. This is the standard
 * augmenting-path matching (Kuhn's), which finds an assignment satisfying as
 * many requirements as the records allow.
 */
export const satisfiedRequirements = (
  records: DemoServiceRecord[],
  data: SororityReportData,
  requirements: RequirementDefinition[] = REQUIREMENTS
): boolean[] => {
  const eligible = requirements.map((req) =>
    records.map((record, index) => ({ record, index })).filter(({ record }) => req.isEligible(record, data)).map(({ index }) => index)
  );

  // record index -> requirement index currently holding it
  const heldBy = new Map<number, number>();

  const assign = (reqIndex: number, visited: Set<number>): boolean =>
    eligible[reqIndex].some((recordIndex) => {
      if (visited.has(recordIndex)) return false;
      visited.add(recordIndex);
      const holder = heldBy.get(recordIndex);
      // Free, or its current holder can be re-housed on another record.
      if (holder === undefined || assign(holder, visited)) {
        heldBy.set(recordIndex, reqIndex);
        return true;
      }
      return false;
    });

  return requirements.map((_, index) => assign(index, new Set<number>()));
};

export const ALL_REQUIREMENTS_MET = 'All Requirements Met';

/**
 * Tab 2: a member per row, a requirement per column, TRUE/FALSE in the cells,
 * and a final column that is TRUE only when every requirement is satisfied.
 */
export const buildRequirementsSheet = (
  data: SororityReportData,
  requirements: RequirementDefinition[] = REQUIREMENTS
): XlsxSheet => {
  const header = ['Name', 'User ID', ...requirements.map((r) => r.name), ALL_REQUIREMENTS_MET];

  const rows = data.members.map((member) => {
    const records = data.records.filter((r) => r.userId === member.id);
    const satisfied = satisfiedRequirements(records, data, requirements);
    return [member.name, member.id, ...satisfied, satisfied.every(Boolean)];
  });

  return { name: 'Requirements', rows: [header, ...rows] };
};

export const buildSororityReport = (data: SororityReportData = demoReportData()): XlsxSheet[] => [
  buildHoursSheet(data),
  buildRequirementsSheet(data),
];

export const reportFileName = (orgName: string): string => {
  const slug = orgName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${slug || 'chapter'}-service-report.xlsx`;
};
