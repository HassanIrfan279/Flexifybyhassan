// Dev-only: renders a saved Flex page (?page=transcript.html) with Flexify's
// in-page tools, and Flex dark mode with ?dark.
import type { ContentScriptContext } from 'wxt/utils/content-script-context';
import { parseMarks } from '@/lib/flex/marks';
import { parseTranscript } from '@/lib/flex/transcript';
import { setFlexDark } from '@/lib/ui/flex-dark';
import { enhanceMarksPage } from '@/entrypoints/flex.content/marks-page';
import { enhanceTranscriptPage } from '@/entrypoints/flex.content/transcript-page';

const params = new URLSearchParams(location.search);
const page = params.get('page') ?? 'transcript.html';
const saved = new DOMParser().parseFromString(await (await fetch(`/fixtures/${page}`)).text(), 'text/html');
document.body.prepend(...Array.from(saved.body.childNodes));
// The saved pages keep their "loading" overlay; hide it like Flex does after load.
document.querySelectorAll<HTMLElement>('[id^="overlay"], .m-page-loader').forEach((n) => (n.style.display = 'none'));

setFlexDark(params.has('dark'));
// ?plain shows Flex as it is, without Flexify.
if (!params.has('plain')) {
  if (page.startsWith('transcript')) enhanceTranscriptPage(parseTranscript(document), { repeatPolicy: 'latest' });
  if (page.startsWith('marks')) await enhanceMarksPage({} as ContentScriptContext, parseMarks(document));
}
// ?click=Label presses a Flexify button (e.g. "All B"); ?scroll=N scrolls the page.
const click = params.get('click');
if (click) [...document.querySelectorAll<HTMLButtonElement>('button')].find((b) => b.textContent?.trim() === click)?.click();
const scroll = Number(params.get('scroll') ?? 0);
if (scroll) setTimeout(() => window.scrollTo(0, scroll), 300);
