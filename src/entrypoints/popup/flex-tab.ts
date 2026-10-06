import { browser } from 'wxt/browser';

export type AdmitCardType = 'Sessional-I' | 'Sessional-II' | 'Final';

export interface FlexReply {
  ok: boolean;
  error?: string;
}

export type FlexMessage = { type: 'df:admit-card'; card: AdmitCardType } | { type: 'df:feedback-start' } | { type: 'df:feedback-stop' };

/**
 * Asks Flexify's content script in an open, logged-in Flex tab to act, so
 * the request carries the student's own session exactly like a click on Flex.
 */
export async function sendToFlexTab(message: FlexMessage): Promise<FlexReply> {
  // Prefer the Flex tab the student is looking at; otherwise any open Flex tab.
  const pattern = 'https://flexstudent.nu.edu.pk/*';
  const active = await browser.tabs.query({ url: pattern, active: true, currentWindow: true });
  const [tab] = active.length ? active : await browser.tabs.query({ url: pattern });
  if (!tab?.id) return { ok: false, error: 'Open Flex in a tab and log in first.' };
  try {
    return (await browser.tabs.sendMessage(tab.id, message)) as FlexReply;
  } catch {
    return { ok: false, error: 'Reload your Flex tab once so Flexify can connect to it.' };
  }
}

export function openFlex(path = '') {
  void browser.tabs.create({ url: `https://flexstudent.nu.edu.pk/${path}` });
}
