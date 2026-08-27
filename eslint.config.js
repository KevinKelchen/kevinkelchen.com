import eslint from '@eslint/js';
import astro from 'eslint-plugin-astro';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['.astro/', 'dist/', 'node_modules/', 'test-results/'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs['flat/recommended'],
  ...astro.configs['flat/jsx-a11y-recommended'],
  {
    files: ['*.{js,mjs,ts}', 'src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['public/offline-reading.js'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['public/offline-sw.js'],
    languageOptions: {
      globals: globals.serviceworker,
    },
  },
];
