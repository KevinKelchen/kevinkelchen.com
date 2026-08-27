# Oxc tooling for Astro

Research date: 2026-08-27. This note evaluates whether this Astro 7 site can replace ESLint and Prettier with Oxlint and Oxfmt.

## Recommendation

Retain ESLint for linting and use Prettier with the official Astro plugin for formatting. Do not make a full Oxc replacement, and do not add a two-linter/two-formatter hybrid to this small site yet.

The deciding issue is coverage, not speed: removing ESLint would remove static accessibility checks from Astro template markup, while using Oxfmt alone would leave every `.astro` file unformatted. Reconsider Oxc when Oxlint supports Astro templates and Oxfmt supports `.astro` natively or can load `prettier-plugin-astro`.

## Compatibility

| Capability                            | Current support                                                                                                                                                                                                                                              | Consequence for this site                                                                                                                                                                                                                                                                                                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Oxlint on `.astro`                    | Partial. Oxc documents `.astro` support as linting only script regions, and its compatibility matrix says there is no template linting yet.                                                                                                                  | It cannot replace template-aware Astro linting. Template references can also produce false unused diagnostics because the template is invisible to analysis. ([Oxlint overview](https://oxc.rs/docs/guide/usage/linter), [compatibility matrix](https://oxc.rs/compatibility.html), [open Astro unused-variable bug](https://github.com/oxc-project/oxc/issues/18878)) |
| `jsx-a11y` on Astro markup            | No. Oxlint has a native `jsx-a11y` implementation, but without an Astro template AST those rules apply to JSX/TSX, not Astro markup.                                                                                                                         | Oxlint cannot enforce the WCAG-oriented source rules currently applied to `.astro` templates. ([built-in plugins](https://oxc.rs/docs/guide/usage/linter/plugins), [compatibility matrix](https://oxc.rs/compatibility.html))                                                                                                                                          |
| `eslint-plugin-astro` in Oxlint       | No practical support. Oxlint's JavaScript-plugin API is alpha and does not yet support custom file formats or parsers. `eslint-plugin-astro` relies on Astro-specific parsing to expose frontmatter, templates, expressions, client scripts, and directives. | Loading the plugin as an Oxlint JavaScript plugin cannot reproduce the current Astro rule set. ([Oxlint JS-plugin limitations](https://oxc.rs/docs/guide/usage/linter/js-plugins.html), [eslint-plugin-astro scope](https://ota-meshi.github.io/eslint-plugin-astro/))                                                                                                 |
| Astro accessibility linting in ESLint | Yes. `eslint-plugin-astro` provides `jsx-a11y-recommended` and `jsx-a11y-strict`, with Astro-aware adaptations of the `jsx-a11y` rules.                                                                                                                      | Keep the existing `flat/jsx-a11y-recommended` gate. ([configuration guide](https://ota-meshi.github.io/eslint-plugin-astro/user-guide/), [Astro accessibility rules](https://ota-meshi.github.io/eslint-plugin-astro/rules/))                                                                                                                                          |
| Oxfmt on `.astro`                     | No. Oxc says Astro requires Prettier-plugin support, which is not available; `.astro` is absent from Oxfmt's supported language list.                                                                                                                        | Oxfmt cannot format Astro frontmatter or templates and cannot be this repository's sole formatter. ([compatibility matrix](https://oxc.rs/compatibility.html), [language support](https://oxc.rs/docs/guide/usage/formatter/language-support), [Prettier-plugin tracking issue](https://github.com/oxc-project/oxc/issues/15665))                                      |
| Oxfmt on other repository formats     | Yes for JavaScript/TypeScript, JSON/JSONC/JSON5, CSS/SCSS/Less, YAML, and TOML using native formatters. Markdown and MDX use the bundled Prettier path in the npm package.                                                                                   | Oxfmt could format the non-Astro subset, but doing so would still require a second formatter for `.astro`. ([language support](https://oxc.rs/docs/guide/usage/formatter/language-support))                                                                                                                                                                            |

## Maturity

Oxlint itself has been stable since version 1.0 and follows semantic versioning. Its JavaScript-plugin API remains alpha, however, and the missing custom-parser support is directly relevant here. ([Oxlint 1.0 announcement](https://oxc.rs/blog/2025-06-10-oxlint-stable), [versioning policy](https://oxc.rs/docs/guide/usage/linter/versioning), [JS-plugin status](https://oxc.rs/docs/guide/usage/linter/js-plugins.html))

Oxfmt is beta and remains pre-1.0. Its JavaScript and TypeScript formatter passes Oxc's full Prettier conformance suite, but Oxc explicitly recommends staying with Prettier when plugin behavior is still required. Astro is exactly such a case. ([Oxfmt beta announcement](https://oxc.rs/blog/2026-02-24-oxfmt-beta), [Oxfmt overview](https://oxc.rs/docs/guide/usage/formatter.html), [current releases](https://github.com/oxc-project/oxc/releases))

## Proposed repository and CI commands

The coherent complete-coverage setup is:

```json
{
  "scripts": {
    "lint": "eslint . --max-warnings 0",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

Configure `prettier-plugin-astro` with an explicit `*.astro` parser override, as Astro's official editor guide recommends. That formats the complete `.astro` file, including its frontmatter and template, while also covering Markdown, CSS, JSON, and YAML. ([Astro editor setup](https://docs.astro.build/en/editor-setup/), [official Astro Prettier plugin](https://github.com/withastro/prettier-plugin-astro))

CI should run `npm run lint` and `npm run format:check` before build and browser tests. Oxlint's equivalent CI command would be `oxlint --max-warnings 0`, and Oxfmt's would be `oxfmt --check`, but those commands do not close the Astro coverage gaps described above. ([Oxlint quickstart](https://oxc.rs/docs/guide/usage/linter/quickstart), [Oxfmt quickstart](https://oxc.rs/docs/guide/usage/formatter/quickstart.html))

An optional future incremental migration is `oxlint --max-warnings 0 && eslint .`, with `eslint-plugin-oxlint` disabling overlap only for ordinary JavaScript and TypeScript files. Oxc documents this adoption path, but the additional configuration and dependency cost offers little benefit for this repository while ESLint must remain for `.astro`. ([Oxlint adoption paths](https://oxc.rs/docs/guide/usage/linter), [eslint-plugin-oxlint](https://github.com/oxc-project/eslint-plugin-oxlint))
