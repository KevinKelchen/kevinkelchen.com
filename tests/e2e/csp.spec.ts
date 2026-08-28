import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { expect, test } from '@playwright/test';

const findHtmlFiles = async (directory: string): Promise<string[]> => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map((entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory()
        ? findHtmlFiles(path)
        : Promise.resolve(entry.name.endsWith('.html') ? [path] : []);
    }),
  );

  return nestedFiles.flat();
};

test('built pages comply with the production script policy', async () => {
  const netlifyConfig = await readFile('netlify.toml', 'utf8');
  expect(netlifyConfig).toContain("script-src 'self'");

  const htmlFiles = await findHtmlFiles('dist');
  const homepage = await readFile('dist/index.html', 'utf8');
  const stylesheetIndex = homepage.indexOf('<link rel="stylesheet"');

  expect(stylesheetIndex).toBeGreaterThanOrEqual(0);

  for (const script of ['/offline-reading.js', '/theme-toggle.js']) {
    expect(homepage.indexOf(`src="${script}"`)).toBeGreaterThan(
      stylesheetIndex,
    );
  }

  for (const htmlFile of htmlFiles) {
    const html = await readFile(htmlFile, 'utf8');
    const inlineScripts = [
      ...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi),
    ];

    for (const inlineScript of inlineScripts) {
      const hash = createHash('sha256')
        .update(inlineScript[1] ?? '')
        .digest('base64');

      expect(netlifyConfig).toContain(`'sha256-${hash}'`);
    }
  }
});
