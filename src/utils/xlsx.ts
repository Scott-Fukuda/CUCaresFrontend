/**
 * A minimal .xlsx writer.
 *
 * A CSV is a single sheet by definition, so anything with tabs has to be a real
 * workbook. Rather than pull in a spreadsheet dependency for one export, this
 * writes the handful of XML parts Excel actually requires and stores them in an
 * uncompressed ZIP — the container format .xlsx is. Uncompressed keeps this
 * dependency-free: the ZIP spec allows stored entries, so no deflate is needed.
 *
 * Supports the value types this export needs — text, numbers, booleans — and no
 * styling. If a future export needs formatting or formulas, reach for SheetJS
 * instead of growing this.
 */

export type CellValue = string | number | boolean | null | undefined;

export interface XlsxSheet {
  /** Tab name. Sanitised to Excel's rules (31 chars, no []:*?/\). */
  name: string;
  /** Row-major cells. The first row is just a row — headers are the caller's job. */
  rows: CellValue[][];
}

const encoder = new TextEncoder();

/** "A", "B", ... "Z", "AA", ... for a 0-based column index. */
export const columnName = (index: number): string => {
  let name = '';
  let n = index;
  while (n >= 0) {
    name = String.fromCharCode(65 + (n % 26)) + name;
    n = Math.floor(n / 26) - 1;
  }
  return name;
};

const escapeXml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // Control characters are illegal in XML 1.0 and make Excel reject the file.
    // eslint-disable-next-line no-control-regex
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

/** Excel rejects these outright, and silently truncates past 31 characters. */
export const sanitizeSheetName = (name: string): string => {
  const cleaned = name.replace(/[[\]:*?/\\]/g, ' ').trim();
  return (cleaned || 'Sheet').slice(0, 31);
};

const cellXml = (value: CellValue, ref: string): string => {
  if (value === null || value === undefined || value === '') return '';
  if (typeof value === 'boolean') {
    return `<c r="${ref}" t="b"><v>${value ? 1 : 0}</v></c>`;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `<c r="${ref}"><v>${value}</v></c>`;
  }
  // Inline strings avoid the shared-string table entirely: a little more bytes,
  // a lot less machinery.
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(value))}</t></is></c>`;
};

const sheetXml = (sheet: XlsxSheet): string => {
  const rows = sheet.rows
    .map((row, rowIndex) => {
      const cells = row.map((value, colIndex) => cellXml(value, `${columnName(colIndex)}${rowIndex + 1}`)).join('');
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join('');

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<sheetData>${rows}</sheetData>` +
    '</worksheet>'
  );
};

const workbookXml = (sheets: XlsxSheet[]): string => {
  const entries = sheets
    .map((sheet, i) => `<sheet name="${escapeXml(sanitizeSheetName(sheet.name))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
    .join('');

  return (
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    `<sheets>${entries}</sheets>` +
    '</workbook>'
  );
};

const workbookRelsXml = (sheets: XlsxSheet[]): string =>
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  sheets
    .map(
      (_, i) =>
        `<Relationship Id="rId${i + 1}" ` +
        'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" ' +
        `Target="worksheets/sheet${i + 1}.xml"/>`
    )
    .join('') +
  '</Relationships>';

const contentTypesXml = (sheets: XlsxSheet[]): string =>
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
  '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
  '<Default Extension="xml" ContentType="application/xml"/>' +
  '<Override PartName="/xl/workbook.xml" ' +
  'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
  sheets
    .map(
      (_, i) =>
        `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ` +
        'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
    )
    .join('') +
  '</Types>';

const rootRelsXml =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
  '<Relationship Id="rId1" ' +
  'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" ' +
  'Target="xl/workbook.xml"/>' +
  '</Relationships>';

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c >>> 0;
  }
  return table;
})();

const crc32 = (bytes: Uint8Array): number => {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
};

interface ZipEntry {
  path: string;
  bytes: Uint8Array;
}

/** A ZIP archive with every entry stored (method 0) rather than deflated. */
const zip = (entries: ZipEntry[]): Uint8Array => {
  const LOCAL_HEADER = 30;
  const CENTRAL_HEADER = 46;

  const prepared = entries.map((entry) => {
    const name = encoder.encode(entry.path);
    return { name, bytes: entry.bytes, crc: crc32(entry.bytes) };
  });

  const localSize = prepared.reduce((sum, e) => sum + LOCAL_HEADER + e.name.length + e.bytes.length, 0);
  const centralSize = prepared.reduce((sum, e) => sum + CENTRAL_HEADER + e.name.length, 0);
  const out = new Uint8Array(localSize + centralSize + 22);
  const view = new DataView(out.buffer);

  let offset = 0;
  const offsets: number[] = [];

  prepared.forEach((entry) => {
    offsets.push(offset);
    view.setUint32(offset, 0x04034b50, true); // local file header
    view.setUint16(offset + 4, 20, true); // version needed
    view.setUint16(offset + 6, 0x0800, true); // UTF-8 filenames
    view.setUint16(offset + 8, 0, true); // stored
    view.setUint16(offset + 10, 0, true); // mod time
    view.setUint16(offset + 12, 0x21, true); // mod date (1980-01-01)
    view.setUint32(offset + 14, entry.crc, true);
    view.setUint32(offset + 18, entry.bytes.length, true); // compressed size
    view.setUint32(offset + 22, entry.bytes.length, true); // uncompressed size
    view.setUint16(offset + 26, entry.name.length, true);
    view.setUint16(offset + 28, 0, true); // extra field length
    out.set(entry.name, offset + LOCAL_HEADER);
    out.set(entry.bytes, offset + LOCAL_HEADER + entry.name.length);
    offset += LOCAL_HEADER + entry.name.length + entry.bytes.length;
  });

  const centralStart = offset;

  prepared.forEach((entry, i) => {
    view.setUint32(offset, 0x02014b50, true); // central directory header
    view.setUint16(offset + 4, 20, true); // version made by
    view.setUint16(offset + 6, 20, true); // version needed
    view.setUint16(offset + 8, 0x0800, true); // UTF-8 filenames
    view.setUint16(offset + 10, 0, true); // stored
    view.setUint16(offset + 12, 0, true); // mod time
    view.setUint16(offset + 14, 0x21, true); // mod date
    view.setUint32(offset + 16, entry.crc, true);
    view.setUint32(offset + 20, entry.bytes.length, true);
    view.setUint32(offset + 24, entry.bytes.length, true);
    view.setUint16(offset + 28, entry.name.length, true);
    view.setUint16(offset + 30, 0, true); // extra
    view.setUint16(offset + 32, 0, true); // comment
    view.setUint16(offset + 34, 0, true); // disk number
    view.setUint16(offset + 36, 0, true); // internal attrs
    view.setUint32(offset + 38, 0, true); // external attrs
    view.setUint32(offset + 42, offsets[i], true);
    out.set(entry.name, offset + CENTRAL_HEADER);
    offset += CENTRAL_HEADER + entry.name.length;
  });

  view.setUint32(offset, 0x06054b50, true); // end of central directory
  view.setUint16(offset + 4, 0, true); // disk number
  view.setUint16(offset + 6, 0, true); // disk with central directory
  view.setUint16(offset + 8, prepared.length, true);
  view.setUint16(offset + 10, prepared.length, true);
  view.setUint32(offset + 12, offset - centralStart, true);
  view.setUint32(offset + 16, centralStart, true);
  view.setUint16(offset + 20, 0, true); // comment length

  return out;
};

/** Builds a workbook with one tab per sheet. */
export const buildXlsx = (sheets: XlsxSheet[]): Uint8Array => {
  if (sheets.length === 0) throw new Error('A workbook needs at least one sheet');

  return zip([
    { path: '[Content_Types].xml', bytes: encoder.encode(contentTypesXml(sheets)) },
    { path: '_rels/.rels', bytes: encoder.encode(rootRelsXml) },
    { path: 'xl/workbook.xml', bytes: encoder.encode(workbookXml(sheets)) },
    { path: 'xl/_rels/workbook.xml.rels', bytes: encoder.encode(workbookRelsXml(sheets)) },
    ...sheets.map((sheet, i) => ({
      path: `xl/worksheets/sheet${i + 1}.xml`,
      bytes: encoder.encode(sheetXml(sheet)),
    })),
  ]);
};

export const XLSX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Hands the workbook to the browser as a download. */
export const downloadXlsx = (sheets: XlsxSheet[], fileName: string): void => {
  // The archive is allocated at its exact size, so its buffer is the file.
  const blob = new Blob([buildXlsx(sheets).buffer as ArrayBuffer], { type: XLSX_MIME_TYPE });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
