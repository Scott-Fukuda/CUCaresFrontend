import { describe, it, expect } from 'vitest';
import {
  ALL_REQUIREMENTS_MET,
  DemoServiceRecord,
  REQUIREMENTS,
  SororityReportData,
  buildHoursSheet,
  buildRequirementsSheet,
  buildSororityReport,
  demoReportData,
  isSororityOrg,
  reportFileName,
  satisfiedRequirements,
  servedOpportunities,
} from './sororityReport';

const data = demoReportData();

/** Row for a member by name, from a built sheet. */
const rowFor = (rows: (string | number | boolean | null | undefined)[][], name: string) =>
  rows.find((row) => row[0] === name)!;

describe('isSororityOrg', () => {
  it('matches however the type spells it', () => {
    expect(isSororityOrg('Sorority')).toBe(true);
    expect(isSororityOrg('Panhellenic Sorority')).toBe(true);
    expect(isSororityOrg('panhellenic sorority')).toBe(true);
  });

  it('does not match other org types or missing ones', () => {
    expect(isSororityOrg('Fraternity')).toBe(false);
    expect(isSororityOrg('Community Service')).toBe(false);
    expect(isSororityOrg(undefined)).toBe(false);
    expect(isSororityOrg('')).toBe(false);
  });
});

describe('hours sheet', () => {
  const sheet = buildHoursSheet(data);
  const [header, ...rows] = sheet.rows;

  it('has a column per served opportunity, bracketed by identity and total', () => {
    expect(header[0]).toBe('Name');
    expect(header[1]).toBe('User ID');
    expect(header[header.length - 1]).toBe('Total Hours');
    expect(header.slice(2, -1)).toEqual(servedOpportunities(data).map((o) => o.name));
  });

  it('has a row per member, including members who never served', () => {
    expect(rows).toHaveLength(data.members.length);
    const jordan = rowFor(rows, 'Jordan Lee');
    expect(jordan.slice(2)).toEqual(new Array(header.length - 2).fill(0));
  });

  it('puts each record\'s hours in its own cell and totals the row', () => {
    const ava = rowFor(rows, 'Ava Ramirez');
    expect(ava[1]).toBe(4101);
    // Ava: 2.5h at the food bank sort, 3h at the dinner service
    expect(ava[header.indexOf('Ithaca Food Bank Sort')]).toBe(2.5);
    expect(ava[header.indexOf('Loaves & Fishes Dinner Service')]).toBe(3);
    expect(ava[header.indexOf('Cayuga Creek Cleanup')]).toBe(0);
    expect(ava[ava.length - 1]).toBe(5.5);
  });

  it('totals match the sum of the opportunity columns for every member', () => {
    rows.forEach((row) => {
      const cells = row.slice(2, -1) as number[];
      expect(row[row.length - 1]).toBeCloseTo(cells.reduce((a, b) => a + b, 0));
    });
  });
});

describe('requirement matching', () => {
  const record = (opportunityId: number): DemoServiceRecord => ({ userId: 1, opportunityId, hours: 1 });

  it('is unsatisfied with no service', () => {
    expect(satisfiedRequirements([], data)).toEqual([false, false]);
  });

  it('spends a lone sorority-hosted record on the narrower requirement only', () => {
    // 103 is hosted by Delta Gamma. It could satisfy either requirement, but
    // only one — and the requirement it alone can satisfy is Req 1.
    expect(satisfiedRequirements([record(103)], data)).toEqual([true, false]);
  });

  it('cannot satisfy the sorority requirement with non-sorority service', () => {
    expect(satisfiedRequirements([record(102)], data)).toEqual([false, true]);
  });

  it('satisfies both when there are records to spare', () => {
    expect(satisfiedRequirements([record(103), record(102)], data)).toEqual([true, true]);
  });

  it('re-houses a record rather than leaving a requirement unmet', () => {
    // Req 2 would grab 103 first if records were handed out greedily in order,
    // stranding Req 1; the matching moves it back.
    expect(satisfiedRequirements([record(104), record(103)], data)).toEqual([true, true]);
  });

  it('never counts one record twice', () => {
    const alwaysEligible = [
      { name: 'a', isEligible: () => true },
      { name: 'b', isEligible: () => true },
      { name: 'c', isEligible: () => true },
    ];
    const satisfied = satisfiedRequirements([record(101), record(102)], data, alwaysEligible);
    expect(satisfied.filter(Boolean)).toHaveLength(2);
  });
});

describe('requirements sheet', () => {
  const sheet = buildRequirementsSheet(data);
  const [header, ...rows] = sheet.rows;

  it('has a column per requirement, then the all-met column', () => {
    expect(header).toEqual(['Name', 'User ID', ...REQUIREMENTS.map((r) => r.name), ALL_REQUIREMENTS_MET]);
  });

  it('marks all-met TRUE exactly when every requirement column is TRUE', () => {
    rows.forEach((row) => {
      const perRequirement = row.slice(2, -1);
      expect(row[row.length - 1]).toBe(perRequirement.every(Boolean));
    });
  });

  it('records booleans, not strings, so Excel shows TRUE/FALSE', () => {
    rows.forEach((row) => row.slice(2).forEach((cell) => expect(typeof cell).toBe('boolean')));
  });

  it('covers every outcome across the demo roster', () => {
    expect(rowFor(rows, 'Ava Ramirez').slice(2)).toEqual([true, true, true]);
    expect(rowFor(rows, 'Priya Shah').slice(2)).toEqual([true, false, false]);
    expect(rowFor(rows, 'Elena Novak').slice(2)).toEqual([false, true, false]);
    expect(rowFor(rows, 'Jordan Lee').slice(2)).toEqual([false, false, false]);
  });

  it('has several members in every outcome, so the demo reads as a real chapter', () => {
    const outcomes = new Map<string, number>();
    rows.forEach((row) => {
      const key = JSON.stringify(row.slice(2, -1));
      outcomes.set(key, (outcomes.get(key) ?? 0) + 1);
    });
    expect(outcomes.size).toBe(4);
    outcomes.forEach((count) => expect(count).toBeGreaterThanOrEqual(3));
  });
});

describe('workbook', () => {
  it('is two tabs, rows keyed the same way on both', () => {
    const [hours, requirements] = buildSororityReport();
    expect(buildSororityReport()).toHaveLength(2);
    expect(hours.name).toBe('Hours by Opportunity');
    expect(requirements.name).toBe('Requirements');
    expect(hours.rows.map((r) => r[0])).toEqual(requirements.rows.map((r) => r[0]));
  });

  it('accepts injected data, so real records can replace the fixture', () => {
    const custom: SororityReportData = {
      members: [{ id: 1, name: 'Solo Member' }],
      opportunities: [{ id: 9, name: 'Park Cleanup', hostOrgName: 'Theta', hostOrgType: 'Sorority' }],
      records: [{ userId: 1, opportunityId: 9, hours: 6 }],
    };
    const [hours, requirements] = buildSororityReport(custom);
    expect(hours.rows).toEqual([
      ['Name', 'User ID', 'Park Cleanup', 'Total Hours'],
      ['Solo Member', 1, 6, 6],
    ]);
    expect(requirements.rows[1].slice(2)).toEqual([true, false, false]);
  });
});

describe('reportFileName', () => {
  it('slugifies the chapter name', () => {
    expect(reportFileName('Kappa Alpha Theta')).toBe('kappa-alpha-theta-service-report.xlsx');
    expect(reportFileName('  Alpha Phi!  ')).toBe('alpha-phi-service-report.xlsx');
    expect(reportFileName('!!!')).toBe('chapter-service-report.xlsx');
  });
});
