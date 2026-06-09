import { SUPPORTED_LOCALES } from '../src/i18n.js';
import fs from 'fs';
import path from 'path';

const LOCALES_DIR = new URL('../src/locales/', import.meta.url).pathname;
const VALID_STATUSES = ['in', 'out'];

let gTestResults = {
  total: 0,
  passed: 0,
  failed: 0
};

function TestCondition(condition, message) {
  if (condition) {
    console.log(`${message}: \x1b[32mPASS\x1b[0m`);
    gTestResults.passed++;
  } else {
    console.log(`${message}: \x1b[31mFAIL\x1b[0m`);
    gTestResults.failed++;
  }
  gTestResults.total++;
}

const gTests = new Map();

function registerTest(name, func) {
  gTests.set(name, func);
}

function loadLocaleFiles() {
  const langs = fs.readdirSync(LOCALES_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => path.basename(f, '.json'));
  const locales = {};
  for (const lang of langs) {
    locales[lang] = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, `${lang}.json`), 'utf8'));
  }
  return locales;
}

const localeFiles = loadLocaleFiles();
const enStrings = localeFiles['en'];

registerTest('All SUPPORTED_LOCALES have a locale file on disk', () => {
  const files = new Set(Object.keys(localeFiles));
  const missing = [...SUPPORTED_LOCALES].filter(locale => !files.has(locale));
  TestCondition(
    missing.length === 0,
    `Missing locale files for: [${missing}]`
  );
});

registerTest('All locales have every key from en', () => {
  for (const [locale, strings] of Object.entries(localeFiles)) {
    if (locale === 'en') continue;
    for (const key of Object.keys(enStrings)) {
      TestCondition(key in strings, `${locale} has key: ${key}`);
    }
  }
});

registerTest('All locales have a key for every PlayerStatus', () => {
  for (const status of VALID_STATUSES) {
    for (const [locale, strings] of Object.entries(localeFiles)) {
      TestCondition(`status.${status}` in strings, `${locale} has key: status.${status}`);
    }
  }
});

function applyVars(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? `{{${k}}}`));
}

registerTest('All parametrized strings replace placeholders correctly', () => {
  const parametrizedKeys = Object.entries(enStrings)
    .filter(([, v]) => /\{\{/.test(v))
    .map(([key, template]) => {
      const placeholders = [...template.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]);
      const vars = Object.fromEntries(placeholders.map(p => [p, `test_${p}`]));
      return { key, vars };
    });

  for (const [locale, strings] of Object.entries(localeFiles)) {
    for (const { key, vars } of parametrizedKeys) {
      const template = strings[key];
      const result = applyVars(template, vars);
      TestCondition(
        !/\{\{/.test(result),
        `${locale} "${key}": all placeholders replaced`
      );
      for (const [placeholder, value] of Object.entries(vars)) {
        TestCondition(
          result.includes(value),
          `${locale} "${key}": replacement value for {{${placeholder}}} appears in output`
        );
      }
    }
  }
});

for (let [name, func] of gTests) {
  func();
}

console.log('\n\x1b[1mTest Results:\x1b[0m');
console.log(`  Total:  ${gTestResults.total}`);
console.log(`  Passed: \x1b[32m${gTestResults.passed}\x1b[0m`);
if (gTestResults.failed > 0) {
  console.log(`  Failed: \x1b[31m${gTestResults.failed}\x1b[0m\n`);
  process.exit(1);
} else {
  console.log(`  Failed: ${gTestResults.failed}\n`);
}
