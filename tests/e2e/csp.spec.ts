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
  const pagesWithInlineScripts: string[] = [];

  for (const htmlFile of htmlFiles) {
    const html = await readFile(htmlFile, 'utf8');
    const inlineScripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>/gi)];
    if (inlineScripts.length > 0) pagesWithInlineScripts.push(htmlFile);
  }

  expect(pagesWithInlineScripts).toEqual([]);
});
