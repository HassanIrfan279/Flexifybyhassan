import type { Identity } from './storage';

export type QueryKind = 'marks-missing' | 'marks-discrepancy' | 'attendance';

export interface QueryContext {
  kind: QueryKind;
  course: { code: string; name: string; section: string };
  /** e.g. "Quiz 3" or "Lecture 7 on 16 Sep 2026". */
  item: string;
  /** Extra facts shown in the email, e.g. "Marked: 0 / 10". */
  details?: string;
  identity: Identity | null;
}

export interface QueryEmail {
  subject: string;
  body: string;
}

const KIND_LABEL: Record<QueryKind, string> = {
  'marks-missing': 'Marks not uploaded',
  'marks-discrepancy': 'Marks query',
  attendance: 'Attendance query',
};

/** Drafts a formal, ready-to-send email to the course instructor. */
export function draftQuery(ctx: QueryContext): QueryEmail {
  const { course, item, identity } = ctx;
  const who = identity?.rollNo ? `${identity.name || 'Student'} (${identity.rollNo})` : 'Student';
  const subject = `${KIND_LABEL[ctx.kind]}: ${course.code} ${course.name} (${course.section}) — ${item}`;

  const request: Record<QueryKind, string> = {
    'marks-missing': `The marks for ${item} are not yet uploaded on Flex for my record. Could you kindly check and update them at your convenience?`,
    'marks-discrepancy': `I believe the marks shown on Flex for ${item} may not be correct. Could you kindly review them, or let me know a suitable time to see the paper?`,
    attendance: `My attendance for ${item} appears to be marked as absent, although I was present in class. Could you kindly review and correct the record?`,
  };

  const lines = [
    'Respected Sir/Madam,',
    '',
    `I hope you are well. I am ${who}, enrolled in ${course.code} ${course.name}, section ${course.section}.`,
    '',
    request[ctx.kind],
  ];
  if (ctx.details) lines.push('', ctx.details);
  lines.push('', 'Thank you for your time.', '', 'Regards,', identity?.name || '', identity?.rollNo || '');

  return { subject, body: lines.join('\n').trimEnd() };
}

/** Gmail compose link with everything prefilled. The student reviews it and presses Send. */
export function gmailComposeUrl(email: QueryEmail, to = ''): string {
  const params = new URLSearchParams({ view: 'cm', fs: '1', to, su: email.subject, body: email.body });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

export function mailtoUrl(email: QueryEmail, to = ''): string {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
}
