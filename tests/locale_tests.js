import { SUPPORTED_LOCALES, resolveLocale } from '../src/i18n.js';
import { TestCondition, registerTest } from './test_harness.js';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

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


registerTest('resolveLocale precedence and fallbacks', () => {
  TestCondition(resolveLocale({ urlLang: 'fr', saved: 'de', navLangs: ['es'] }) === 'fr', 'resolveLocale - URL wins over saved and browser');
  TestCondition(resolveLocale({ urlLang: null, saved: 'de', navLangs: ['es'] }) === 'de', 'resolveLocale - saved wins over browser');
  TestCondition(resolveLocale({ urlLang: null, saved: null, navLangs: ['es'] }) === 'es', 'resolveLocale - browser language used when nothing saved');
  TestCondition(resolveLocale({ urlLang: null, saved: null, navLangs: [] }) === 'en', 'resolveLocale - falls back to en');
  TestCondition(resolveLocale({}) === 'en', 'resolveLocale - no inputs falls back to en');
  TestCondition(resolveLocale({ urlLang: 'xx', saved: 'nl', navLangs: [] }) === 'nl', 'resolveLocale - unsupported URL language ignored');
  TestCondition(resolveLocale({ urlLang: null, saved: 'xx', navLangs: ['fr'] }) === 'fr', 'resolveLocale - unsupported saved language ignored');
  TestCondition(resolveLocale({ urlLang: null, saved: null, navLangs: ['fr-CA'] }) === 'fr', 'resolveLocale - region tag maps to base language');
  TestCondition(resolveLocale({ urlLang: null, saved: null, navLangs: ['ja', 'de-DE', 'es'] }) === 'de', 'resolveLocale - first supported browser language wins');
  TestCondition(resolveLocale({ urlLang: null, saved: null, navLangs: ['ja', ''] }) === 'en', 'resolveLocale - no supported browser language falls back to en');
});

registerTest('i18n imports in Node with localStorage already defined', () => {
  const i18nUrl = new URL('../src/i18n.js', import.meta.url).href;
  const script = `
    globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
    await import(${JSON.stringify(i18nUrl)});
  `;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', script], { encoding: 'utf8' });
  TestCondition(result.status === 0, 'i18n import does not throw when localStorage exists outside a browser');
  if (result.status !== 0) console.log(result.stderr.split('\n').slice(0, 6).join('\n'));
});
