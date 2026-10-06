import { cleanText, parseCourseHeading } from './table';

/**
 * Fills a Flex course-feedback form: every question gets the option matching
 * `rating` (1–5, 5 = most positive). Questions are groups of radio buttons
 * sharing a name. Options are matched by numeric value/label when present,
 * otherwise by position, reading the scale's direction from its labels.
 */
export function fillFeedbackForm(doc: Document, rating: number, comment: string): { questions: number; answered: number } {
  const groups = new Map<string, HTMLInputElement[]>();
  for (const input of Array.from(doc.querySelectorAll<HTMLInputElement>('input[type="radio"]'))) {
    if (!input.name || input.disabled) continue;
    groups.set(input.name, [...(groups.get(input.name) ?? []), input]);
  }

  let answered = 0;
  for (const options of groups.values()) {
    const choice = pickOption(options, rating);
    if (!choice) continue;
    choice.checked = true;
    choice.dispatchEvent(new Event('input', { bubbles: true }));
    choice.dispatchEvent(new Event('change', { bubbles: true }));
    choice.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    answered += 1;
  }

  for (const box of Array.from(doc.querySelectorAll<HTMLTextAreaElement>('textarea'))) {
    if (!box.value.trim() && !box.disabled) {
      box.value = comment;
      box.dispatchEvent(new Event('input', { bubbles: true }));
      box.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  return { questions: groups.size, answered };
}

function optionText(input: HTMLInputElement): string {
  const label =
    (input.id && input.ownerDocument.querySelector(`label[for="${CSS.escape(input.id)}"]`)) ||
    input.closest('label') ||
    input.parentElement;
  return cleanText(label?.textContent);
}

const POSITIVE = /strongly\s*agree|excellent|very\s*good|always|outstanding/i;
const NEGATIVE = /strongly\s*disagree|very\s*poor|never|poor/i;

export function pickOption(options: HTMLInputElement[], rating: number): HTMLInputElement | undefined {
  const r = Math.max(1, Math.min(5, Math.round(rating)));

  // 1) Numeric values or labels 1..5.
  const byNumber = options.find((o) => Number(o.value) === r || Number(optionText(o)) === r);
  const numeric = options.filter((o) => /^\d$/.test(o.value.trim()) || /^\d$/.test(optionText(o)));
  if (byNumber && numeric.length >= 3) return byNumber;

  // 2) By position: work out which end of the scale is positive.
  const n = options.length;
  if (n < 2) return options[0];
  const firstText = optionText(options[0]!);
  const lastText = optionText(options[n - 1]!);
  const positiveFirst = POSITIVE.test(firstText) || NEGATIVE.test(lastText) || !(POSITIVE.test(lastText) || NEGATIVE.test(firstText));
  // Map 5..1 onto the options' range.
  const fromPositive = Math.round(((5 - r) / 4) * (n - 1));
  return options[positiveFirst ? fromPositive : n - 1 - fromPositive];
}

export function findSubmitButton(doc: Document): HTMLElement | null {
  const candidates = Array.from(
    doc.querySelectorAll<HTMLElement>('button, input[type="submit"], input[type="button"], a.btn'),
  ).filter((b) => !(b as HTMLButtonElement).disabled);
  return (
    candidates.find((b) => /^\s*(submit|save|send)\b/i.test(b.textContent || (b as HTMLInputElement).value || '')) ??
    candidates.find((b) => (b as HTMLButtonElement).type === 'submit') ??
    null
  );
}

/** Course code shown on a feedback form page, if this is one. */
export function formCourseCode(doc: Document): string | null {
  if (!doc.querySelector('input[type="radio"]')) return null;
  for (const h of Array.from(doc.querySelectorAll('h3, h4, h5, .m-portlet__head-text, label, span'))) {
    const heading = parseCourseHeading(h.textContent ?? '');
    if (heading) return heading.code;
    const m = /\b([A-Z]{2}\d{4})\b/.exec(h.textContent ?? '');
    if (m?.[1]) return m[1];
  }
  return null;
}
