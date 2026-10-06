import { describe, expect, it } from 'vitest';
import { loadFixture } from '../../../test/fixtures';
import { parseFeedbackList, safePath } from './feedback';
import { fillFeedbackForm, findSubmitButton, pickOption } from './feedback-form';

const doc = (html: string) => new DOMParser().parseFromString(html, 'text/html');

describe('parseFeedbackList', () => {
  it('reads the saved list (window closed, all submitted)', () => {
    const list = parseFeedbackList(loadFixture('feedback-list.html'));
    expect(list.active).toBe(false);
    expect(list.courses.map((c) => c.code)).toEqual(['CL2001', 'CS1005', 'CS2001', 'NS1001', 'SS1007']);
    expect(list.courses.every((c) => c.submitted && c.formPath === null)).toBe(true);
  });

  it('keeps form links for pending courses, and only Flex links', () => {
    const list = parseFeedbackList(
      doc(`<table><thead><tr><th>S.No</th><th>Code</th><th>Course Name</th><th>Credits</th><th>Status</th><th>Feedback</th></tr></thead>
      <tbody><tr><td>1</td><td>CS2001</td><td>Data Structures</td><td>3</td><td>Pending</td><td><a href="/Student/FeedBackQuestions?id=7">Give</a></td></tr>
      <tr><td>2</td><td>MT1003</td><td>Calculus</td><td>3</td><td>Pending</td><td><a href="https://evil.example/x">Give</a></td></tr></tbody></table>`),
    );
    expect(list.courses[0]).toMatchObject({ code: 'CS2001', submitted: false, formPath: '/Student/FeedBackQuestions?id=7' });
    expect(list.courses[1]!.formPath).toBeNull();
  });

  it('rejects links to other sites', () => {
    expect(safePath('javascript:alert(1)')).toBeNull();
    expect(safePath('//evil.example/a')).toBeNull();
    expect(safePath('FeedBackQuestions?x=1')).toBe('/Student/FeedBackQuestions?x=1');
  });
});

describe('fillFeedbackForm', () => {
  const numeric = () =>
    doc(`<form>${[1, 2, 3]
      .map((q) => `<p>Q${q}</p>` + [1, 2, 3, 4, 5].map((v) => `<label><input type="radio" name="q${q}" value="${v}"> ${v}</label>`).join(''))
      .join('')}<textarea name="c"></textarea><button type="submit">Submit</button></form>`);

  it('answers every question with the chosen rating on a 1–5 scale', () => {
    const d = numeric();
    expect(fillFeedbackForm(d, 4, 'Thanks')).toEqual({ questions: 3, answered: 3 });
    const checked = Array.from(d.querySelectorAll<HTMLInputElement>('input:checked')).map((i) => i.value);
    expect(checked).toEqual(['4', '4', '4']);
    expect(d.querySelector('textarea')!.value).toBe('Thanks');
    expect(findSubmitButton(d)?.textContent).toBe('Submit');
  });

  it('maps ratings onto worded scales in either direction', () => {
    const labels = ['Strongly Agree', 'Agree', 'Uncertain', 'Disagree', 'Strongly Disagree'];
    const d = doc(labels.map((l, i) => `<label><input type="radio" name="a" value="x${i}"> ${l}</label>`).join(''));
    const opts = Array.from(d.querySelectorAll<HTMLInputElement>('input'));
    expect(pickOption(opts, 5)?.parentElement?.textContent?.trim()).toBe('Strongly Agree');
    expect(pickOption(opts, 1)?.parentElement?.textContent?.trim()).toBe('Strongly Disagree');
    const reversed = [...opts].reverse();
    expect(pickOption(reversed, 5)?.parentElement?.textContent?.trim()).toBe('Strongly Agree');
  });
});
