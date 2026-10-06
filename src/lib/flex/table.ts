/**
 * Reads an HTML table into objects keyed by normalized header text, so parsers
 * depend on column meaning ("CrdHrs", "Grade") rather than column position.
 */
export function readTable(table: HTMLTableElement): Record<string, string>[] {
  const headers = Array.from(table.querySelectorAll('thead th')).map((th) => headerKey(th.textContent ?? ''));
  return Array.from(table.querySelectorAll('tbody tr')).map((tr) => {
    const cells = Array.from(tr.querySelectorAll('td'));
    const row: Record<string, string> = {};
    cells.forEach((td, i) => {
      if (headers[i]) row[headers[i]] = cleanText(td.textContent);
    });
    return row;
  });
}

export function headerKey(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function cleanText(text: string | null | undefined): string {
  return (text ?? '').replace(/\s+/g, ' ').trim();
}

/** Picks the first present column among several header spellings. */
export function pick(row: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const value = row[headerKey(key)];
    if (value !== undefined) return value;
  }
  return '';
}

export function toNumber(text: string): number {
  return toNumberOrNull(text) ?? 0;
}

/** Like toNumber, but '-' or an empty cell (marks not uploaded) becomes null. */
export function toNumberOrNull(text: string): number | null {
  const n = parseFloat(text.replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

/**
 * Reads Flex's bold "Label: value" pairs (e.g. "Degree: BS(CS)") into a map
 * keyed by normalized label.
 */
export function readLabels(root: ParentNode): Record<string, string> {
  const out: Record<string, string> = {};
  for (const label of Array.from(root.querySelectorAll('.m--font-boldest'))) {
    const key = headerKey(label.textContent ?? '');
    const value = label.nextElementSibling;
    if (key && value) out[key] = cleanText(value.textContent);
  }
  return out;
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** "17-Aug-2026" → "2026-08-17"; null when unparseable. Kept as a string to avoid timezone drift. */
export function parseFlexDate(text: string): string | null {
  const m = /(\d{1,2})-([A-Za-z]{3})-(\d{2,4})/.exec(text);
  if (!m?.[1] || !m[2] || !m[3]) return null;
  const month = MONTHS.indexOf(m[2].toLowerCase()) + 1;
  if (!month) return null;
  const year = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
  return `${year}-${String(month).padStart(2, '0')}-${m[1].padStart(2, '0')}`;
}

/** "CS2001-Data Structures (BCS-3E)" → code, name, section. */
export function parseCourseHeading(text: string): { code: string; name: string; section: string } | null {
  const m = /^\s*([A-Z]{2,4}\s*[A-Z0-9]{3,5})\s*-\s*(.+?)\s*(?:\(([^)]+)\))?\s*$/i.exec(cleanText(text));
  if (!m?.[1] || !m[2]) return null;
  return { code: m[1].replace(/\s+/g, '').toUpperCase(), name: m[2], section: m[3] ?? '' };
}
