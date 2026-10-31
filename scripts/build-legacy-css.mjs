// Builds public/legacy.css: a copy of the app's styles that old Safari
// (iOS 12 on iPad Air 2 and similar) can read. Modern browsers never load it.
//
// Tailwind v4 puts almost every rule inside @layer blocks, and browsers older
// than Safari 15.4 drop @layer blocks entirely, so the page renders unstyled.
// This script compiles globals.css the same way the Turbopack loader does,
// unwraps the layers (keeping their order, with unlayered rules last so they
// still win), lowers the syntax for Safari 12 and splits selector lists that
// contain selectors Safari 12 rejects (one unknown selector would discard the
// whole rule). The root layout loads the file only when the browser has no
// cascade layer support.

import fs from "node:fs";
import path from "node:path";
import { compile, Polyfills } from "@tailwindcss/node";
import { Scanner } from "@tailwindcss/oxide";
import { transform, browserslistToTargets } from "lightningcss";

const root = process.cwd();
const input = path.join(root, "src/app/globals.css");
const output = path.join(root, "public/legacy.css");

// Selectors Safari 12 does not parse; a rule listing one of them is dropped.
const UNSUPPORTED = [
  "::backdrop",
  "::file-selector-button",
  ":where(",
  ":is(",
  ":focus-visible",
  ":popover-open",
  ":has(",
  ":open",
  ":user-invalid",
  ":user-valid",
  "::details-content",
  ":-moz-",
  "::-moz-",
  "::-ms-",
  ":-ms-",
];

const source = fs.readFileSync(input, "utf8");
const compiler = await compile(source, {
  from: input,
  base: path.dirname(input),
  shouldRewriteUrls: true,
  onDependency: () => {},
  polyfills: Polyfills.All,
});

const sources = (
  compiler.root === "none"
    ? []
    : compiler.root === null
      ? [{ base: root, pattern: "**/*", negated: false }]
      : [{ ...compiler.root, negated: false }]
).concat(compiler.sources);
const scanner = new Scanner({ sources });
const css = compiler.build(scanner.scan()).replace(/\/\*[\s\S]*?\*\//g, "");

// Unwrap @layer blocks: layered rules first (in layer order), unlayered last.
const layered = [];
const unlayered = [];
let i = 0;
while (i < css.length) {
  while (/\s/.test(css[i] ?? "")) i++;
  if (i >= css.length) break;
  const m = /@layer\s+[\w-]+\s*\{/y;
  m.lastIndex = i;
  if (m.test(css)) {
    const start = m.lastIndex;
    const end = matchBrace(css, start);
    layered.push(css.slice(start, end));
    i = end + 1;
    continue;
  }
  // Copy one top-level chunk (an at-statement or a block) as unlayered.
  const next = nextTopLevel(css, i);
  const chunk = css.slice(i, next).trim();
  // Skip layer order statements like "@layer theme, base;".
  if (chunk && !/^@layer[^{]*;$/.test(chunk)) unlayered.push(chunk);
  i = next;
}

const flat = layered.join("\n") + "\n" + unlayered.join("\n");

const { code } = transform({
  filename: "legacy.css",
  code: Buffer.from(flat),
  minify: true,
  targets: browserslistToTargets(["safari 12", "ios_saf 12"]),
  visitor: {
    Rule: {
      style(rule) {
        const selectors = rule.value.selectors;
        const bad = (s) => UNSUPPORTED.some((u) => serialize(s).includes(u));
        if (selectors.length > 1 && selectors.some(bad)) {
          return selectors
            .filter((s) => !bad(s))
            .map((s) => ({ type: "style", value: { ...rule.value, selectors: [s] } }));
        }
        if (selectors.every(bad)) return [];
        return undefined;
      },
    },
  },
});

fs.writeFileSync(output, flexGapFallback() + "\n" + code.toString());
console.log(`legacy.css: ${(code.length / 1024).toFixed(1)} KB`);

function matchBrace(s, start) {
  let d = 1;
  let j = start;
  let quote = null;
  for (; j < s.length; j++) {
    const c = s[j];
    if (quote) {
      if (c === "\\") j++;
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'") quote = c;
    else if (c === "{") d++;
    else if (c === "}" && --d === 0) return j;
  }
  throw new Error("Unbalanced braces in compiled CSS");
}

function nextTopLevel(s, start) {
  let quote = null;
  for (let j = start; j < s.length; j++) {
    const c = s[j];
    if (quote) {
      if (c === "\\") j++;
      else if (c === quote) quote = null;
    } else if (c === '"' || c === "'") quote = c;
    else if (c === ";") return j + 1;
    else if (c === "{") return matchBrace(s, j + 1) + 1;
  }
  return s.length;
}

// Turn a lightningcss selector AST into rough text for pattern matching.
function serialize(selector) {
  return selector
    .map((c) => {
      if (c.type === "pseudo-class") return ":" + (c.kind === "custom" ? c.name.name : c.kind) + (["where", "is", "has"].includes(c.kind) ? "(" : "");
      if (c.type === "pseudo-element") return "::" + (c.kind === "custom" ? c.name.name : c.kind === "custom-function" ? c.name : c.kind);
      return "";
    })
    .join("");
}

// Safari before 14.1 ignores `gap` in flex layouts. Approximate it with margins
// for the spacing scale (gap-N is N * 0.25rem). `inset` shipped in the same
// Safari release, so the @supports check limits this to browsers without gap.
function flexGapFallback() {
  let out = "@supports not (inset:0){";
  for (const n of [0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12]) {
    const cls = String(n).replace(".", "\\.");
    const rem = `${n * 0.25}rem`;
    out += `.flex.flex-col.gap-${cls}>*+*,.flex.flex-col.gap-y-${cls}>*+*{margin-top:${rem}}`;
    out += `.flex:not(.flex-col).gap-${cls}>*+*,.flex:not(.flex-col).gap-x-${cls}>*+*{margin-left:${rem}}`;
    out += `.inline-flex.gap-${cls}>*+*{margin-left:${rem}}`;
  }
  return out + "}";
}
