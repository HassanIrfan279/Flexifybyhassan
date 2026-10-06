import { cleanText, parseFlexDate, readLabels } from './table';

export interface DateRange {
  start: string;
  end: string;
}

export interface StudentProfile {
  degree: string;
  campus: string;
  batch: string;
  section: string;
  status: string;
  calendar: {
    classes: DateRange | null;
    registration: DateRange | null;
    feedback: DateRange[];
    withdraw: DateRange | null;
  };
}

/** Parses the Flex home page (University Information + Academic Calendar). Personal details are never read. */
export function parseProfile(doc: Document): StudentProfile {
  const labels = readLabels(doc);
  return {
    degree: labels['degree'] ?? '',
    campus: labels['campus'] ?? '',
    batch: labels['batch'] ?? '',
    section: labels['section'] ?? '',
    status: labels['status'] ?? '',
    calendar: {
      classes: parseRange(labels['classes']),
      registration: parseRange(labels['registration']),
      feedback: Object.entries(labels)
        .filter(([key]) => key.startsWith('onlinefeedback'))
        .map(([, value]) => parseRange(value))
        .filter((r): r is DateRange => r !== null),
      withdraw: parseRange(labels['onlinewithdrawrequest']),
    },
  };
}

/**
 * The logged-in student's name (top-bar greeting) and roll number. Read only so
 * query emails can be signed; stored on this device and never sent anywhere.
 */
export function parseIdentity(doc: Document): { name: string; rollNo: string } | null {
  const name = cleanText(doc.querySelector('.m-topbar__username')?.textContent);
  const rollNo = readLabels(doc)['rollno'] ?? '';
  return name || rollNo ? { name, rollNo } : null;
}

function parseRange(text: string | undefined): DateRange | null {
  const [a, b] = (text ?? '').split(/\s+to\s+/i);
  const start = parseFlexDate(a ?? '');
  const end = parseFlexDate(b ?? '');
  return start && end ? { start, end } : null;
}
