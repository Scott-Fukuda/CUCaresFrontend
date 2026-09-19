import { describe, it, expect } from 'vitest';
import { buildXlsx, columnName, sanitizeSheetName } from './xlsx';

const decoder = new TextDecoder();

/**
 * Reads the stored (uncompressed) entries back out of the archive.
 *
 * Walks the local file headers rather than the central directory, so a
 * mismatch between the two would show up as a parse failure here.
 */
const readZip = (bytes: Uint8Array): Map<string, string> => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const files = new Map<string, string>();
  let offset = 0;

  while (offset + 4 <= bytes.length && view.getUint32(offset, true) === 0x04034b50) {
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const size = view.getUint32(offset + 22, true);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    files.set(
      decoder.decode(bytes.slice(nameStart, nameStart + nameLength)),
      decoder.decode(bytes.slice(dataStart, dataStart + size))
    );
    offset = dataStart + size;
  }

  return files;
};

describe('columnName', () => {
  it('counts like a spreadsheet past Z', () => {
    expect(columnName(0)).toBe('A');
    expect(columnName(25)).toBe('Z');
    expect(columnName(26)).toBe('AA');
    expect(columnName(27)).toBe('AB');
    expect(columnName(51)).toBe('AZ');
    expect(columnName(52)).toBe('BA');
    expect(columnName(701)).toBe('ZZ');
  });
});

describe('sanitizeSheetName', () => {
  it('drops the characters Excel rejects and caps the length', () => {
    expect(sanitizeSheetName('Hours [2026]')).toBe('Hours  2026');
    expect(sanitizeSheetName('a/b\\c:d*e?f')).toBe('a b c d e f');
    expect(sanitizeSheetName('x'.repeat(40))).toHaveLength(31);
    expect(sanitizeSheetName('   ')).toBe('Sheet');
  });
});

describe('buildXlsx', () => {
  const bytes = buildXlsx([
    { name: 'First', rows: [['Name', 'Hours'], ['Ava', 2.5], ['Sofia', 0]] },
    { name: 'Second', rows: [['Done'], [true], [false], [null]] },
  ]);
  const files = readZip(bytes);

  it('writes the parts Excel requires, one worksheet per tab', () => {
    expect([...files.keys()]).toEqual([
      '[Content_Types].xml',
      '_rels/.rels',
      'xl/workbook.xml',
      'xl/_rels/workbook.xml.rels',
      'xl/worksheets/sheet1.xml',
      'xl/worksheets/sheet2.xml',
    ]);
  });

  it('starts with the ZIP magic number so the OS sees an archive', () => {
    expect([...bytes.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);
  });

  it('names both tabs in the workbook and points a relationship at each', () => {
    const workbook = files.get('xl/workbook.xml')!;
    expect(workbook).toContain('name="First"');
    expect(workbook).toContain('name="Second"');
    const rels = files.get('xl/_rels/workbook.xml.rels')!;
    expect(rels).toContain('Target="worksheets/sheet1.xml"');
    expect(rels).toContain('Target="worksheets/sheet2.xml"');
  });

  it('types cells so numbers stay numeric and booleans stay boolean', () => {
    const sheet1 = files.get('xl/worksheets/sheet1.xml')!;
    expect(sheet1).toContain('<c r="A1" t="inlineStr"><is><t xml:space="preserve">Name</t></is></c>');
    expect(sheet1).toContain('<c r="B2"><v>2.5</v></c>');
    expect(sheet1).toContain('<c r="B3"><v>0</v></c>');

    const sheet2 = files.get('xl/worksheets/sheet2.xml')!;
    expect(sheet2).toContain('<c r="A2" t="b"><v>1</v></c>');
    expect(sheet2).toContain('<c r="A3" t="b"><v>0</v></c>');
    // A blank cell is omitted rather than written empty
    expect(sheet2).toContain('<row r="4"></row>');
  });

  it('escapes text that would otherwise break the XML', () => {
    const files2 = readZip(buildXlsx([{ name: 'S', rows: [['Loaves & Fishes <"x">']] }]));
    const sheet = files2.get('xl/worksheets/sheet1.xml')!;
    expect(sheet).toContain('Loaves &amp; Fishes &lt;&quot;x&quot;&gt;');
  });

  it('refuses to build a workbook with no sheets', () => {
    expect(() => buildXlsx([])).toThrow();
  });
});
