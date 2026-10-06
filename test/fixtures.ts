import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Loads a redacted Flex page snapshot from /fixtures as a DOM Document. */
export function loadFixture(name: string): Document {
  const html = readFileSync(resolve(__dirname, '../fixtures', name), 'utf-8');
  return new DOMParser().parseFromString(html, 'text/html');
}
