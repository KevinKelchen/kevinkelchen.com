# Accessibility tooling for this Astro site

Research date: 2026-08-27

## Recommendation

Use a small layered setup:

1. Add `eslint-plugin-astro` with its `recommended` and `jsx-a11y-recommended` flat configs. Install `eslint-plugin-jsx-a11y` as the accessibility rule engine, but apply the Astro-adapted config to `.astro` files.
2. Add `@axe-core/playwright` to the existing Playwright suite and scan the Homepage, Archive, About, and one representative Post in a real browser.
3. Keep Astro's development-toolbar Audit app enabled for immediate, non-blocking feedback while editing.
4. Maintain a short manual check for keyboard use, visible focus, zoom/reflow, page structure and accessible names. Automated checks cannot establish WCAG conformance on their own.

Do not add Vitest solely for accessibility testing. `vitest-axe` becomes useful if this project later has interactive components that already justify component tests in Vitest.

## Why `jsx-a11y` needs an Astro adapter

`eslint-plugin-jsx-a11y` is a static checker for JSX elements. An Astro template is JSX-like, but it is not a JSX/React file and needs an Astro-aware parser and rules. `eslint-plugin-astro` lints Astro frontmatter, templates, expressions, scripts, and directives, and provides Astro extensions of the `jsx-a11y` rules. Its `jsx-a11y-recommended` and `jsx-a11y-strict` configs are specifically extended for Astro components; `eslint-plugin-jsx-a11y` must also be installed because those rules use it internally. ([eslint-plugin-astro introduction and configuration](https://github.com/ota-meshi/eslint-plugin-astro#readme), [Astro-adapted accessibility rules](https://ota-meshi.github.io/eslint-plugin-astro/rules/))

Therefore:

- For `.astro`, use `eslint-plugin-astro`'s `jsx-a11y-recommended` config.
- If JSX/TSX is added later through React, Preact, or another JSX renderer, apply the ordinary `eslint-plugin-jsx-a11y` config to those JSX/TSX files as well.
- Include `.astro` explicitly in the lint command; the plugin documentation notes that ESLint does not target it by default. ([eslint-plugin-astro CLI guidance](https://github.com/ota-meshi/eslint-plugin-astro#running-eslint-from-the-command-line))

This layer catches source-level mistakes early, such as missing alternate text, invalid ARIA properties or roles, empty headings, and mouse handlers without keyboard equivalents. It cannot evaluate the final composed DOM, computed color contrast, focus order, responsive states, or content whose accessibility depends on runtime behavior.

## What Astro checks by itself

Astro does not provide a comprehensive compiler or build-time accessibility gate:

- `astro check` runs diagnostics such as type checking across `.astro` and TypeScript files. Astro's documentation also says `astro build` does not type-check by default. Neither is documented as a general accessibility audit. ([Astro TypeScript and `astro check` documentation](https://docs.astro.build/en/guides/typescript/))
- Astro's `<Image>` component does have one narrow accessibility guard: it requires an `alt` property and raises `ImageMissingAlt` when it is absent. ([Astro `ImageMissingAlt` reference](https://docs.astro.build/en/reference/errors/image-missing-alt/))
- The development toolbar's Audit app checks the current rendered page for common performance and accessibility issues. Astro explicitly describes these as basic audits that do not replace dedicated tools or human assessment. ([Astro dev-toolbar Audit documentation](https://docs.astro.build/en/guides/dev-toolbar/#audit))

The toolbar is already enabled in normal development in this repository and disabled only during Playwright runs. It should remain useful as an editor-time safety net, but it is not a repeatable CI gate.

## Why axe belongs in Playwright here

Playwright's official accessibility-testing guide uses `@axe-core/playwright`. An `AxeBuilder` analyzes the actual page in the browser, and it can scan the whole page or scan a UI after Playwright has opened or changed it. This catches issues in the generated HTML and computed presentation rather than only the source template. ([Playwright accessibility testing](https://playwright.dev/docs/accessibility-testing))

This repository already has Playwright, starts the Astro site through `webServer`, and defines the four representative page types in `tests/e2e/responsive.spec.ts`. The lowest-complexity addition is a focused accessibility spec that visits those same routes and expects `analyze().violations` to be empty.

Recommended test shape:

- Scan `/`, `/blog`, `/about`, and `/blog/hello-world`.
- Run at 320 and 1280 CSS pixels so the minimum-width and desktop layouts are both exercised. If responsive markup never changes, this can later be reduced to one width after evidence shows the second scan adds no coverage.
- Start with axe's default enabled rules, which include WCAG-related rules and useful best-practice rules. If the project needs a declared standard-specific gate, axe supports the `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, and `wcag22aa` tags. ([axe-core tag reference](https://github.com/dequelabs/axe-core/blob/develop/doc/API.md#axe-core-tags))
- Scan interactive states after the interaction that reveals them. The site currently has little interactive UI, so route-level scans are sufficient for the present design. ([Playwright on scanning revealed UI](https://playwright.dev/docs/accessibility-testing#configuring-axe-to-scan-a-specific-part-of-a-page))
- Avoid broad exclusions and disabled rules. Playwright notes that excluding an element also excludes all descendants and all rules for that subtree. Any temporary exception should identify a specific known issue and include a removal plan. ([Playwright on known issues](https://playwright.dev/docs/accessibility-testing#handling-known-issues))

## Why not `vitest-axe` now

`vitest-axe` is a Vitest matcher, forked from `jest-axe`, for analyzing HTML or a DOM rendered in a unit-test environment. Its own documentation notes an incompatibility with Happy DOM. ([`vitest-axe` README](https://github.com/chaance/vitest-axe#readme)) Axe itself documents limited JSDOM support and specifically says its color-contrast rule does not work there. ([axe-core browser and JSDOM support](https://github.com/dequelabs/axe-core#supported-browsers))

That tradeoff is worthwhile for fast tests of isolated, interactive framework components. It is not worthwhile for this mostly static Astro site today: there is no Vitest/component-test setup, while Playwright already renders the complete pages in Chromium and can evaluate contrast and composed markup. `@axe-core/playwright` is both more direct and more complete for the current architecture.

## Manual verification still required

Playwright warns that automated testing finds only some accessibility problems and recommends combining it with manual assessment and inclusive user testing. It recommends the free, open-source Accessibility Insights for Web tool for a guided WCAG assessment. ([Playwright disclaimer and manual-tool recommendation](https://playwright.dev/docs/accessibility-testing#introduction))

For this site, manually verify after significant design or navigation changes:

- Every page can be traversed with the keyboard alone, with a visible focus indicator and a logical focus order.
- Header and footer navigation, Post links, and external social links have understandable names and destinations.
- Heading hierarchy and landmarks communicate the page structure in a screen reader.
- Meaning does not depend on color alone, and text remains usable under high zoom and text-only zoom.
- At the equivalent of 320 CSS pixels (for example, a 1280-pixel viewport at 400% zoom), content reflows without two-dimensional scrolling except where intrinsically necessary.
- Post content, link text, and image alternatives make sense in context; this requires editorial judgment that a rule cannot supply.

## Repository-specific implementation order

1. Add ESLint, `eslint-plugin-astro`, and `eslint-plugin-jsx-a11y`; configure flat ESLint with Astro's `recommended` and `jsx-a11y-recommended` configs, and add a lint script.
2. Resolve existing lint findings rather than suppressing the accessibility preset wholesale.
3. Add `@axe-core/playwright` and a dedicated accessibility spec over the four representative routes at 320 and 1280 pixels.
4. Run lint and accessibility tests in CI alongside the existing Playwright suite.
5. Record the manual checklist in the project's release or design-change workflow.

One dependency detail should be resolved during implementation: the current `eslint-plugin-astro` documentation requires a newer Node 22 patch level than this repository's declared `node >=22.12.0` minimum. Select mutually compatible ESLint/plugin versions or raise the declared Node minimum rather than bypassing engine or peer-dependency checks. ([eslint-plugin-astro requirements](https://github.com/ota-meshi/eslint-plugin-astro#installation))
