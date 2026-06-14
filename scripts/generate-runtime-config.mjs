import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const apiUrl = (process.env.API_URL || 'http://localhost:8080')
  .trim()
  .replace(/\/+$/, '');

const outputPath = resolve('public/app-config.js');
mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(
  outputPath,
  `window.__APP_CONFIG__ = ${JSON.stringify({ apiUrl })};\n`,
  'utf8'
);

console.log(`Runtime API URL: ${apiUrl}`);
