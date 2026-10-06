// Renders assets/icon.svg to the PNG sizes the extension and stores need.
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';

const svg = readFileSync('assets/icon.svg', 'utf-8');
for (const size of [16, 32, 48, 96, 128]) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  writeFileSync(`public/icon/${size}.png`, png);
}
console.log('icons written');
