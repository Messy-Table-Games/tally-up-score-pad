import { SUPPORTED_LOCALES } from '../src/i18n.js';
import { TestCondition, registerTest } from './test_harness.js';
import fs from 'fs';
import path from 'path';

const LOCALES_DIR = new URL('../src/locales/', import.meta.url).pathname;
const VALID_STATUSES = ['in', 'out'];

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

