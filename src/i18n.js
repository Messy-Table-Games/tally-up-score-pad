import { makeObservable, observable, action } from 'mobx';
import enStrings from './locales/en.json' with { type: 'json' };
import esStrings from './locales/es.json' with { type: 'json' };
import deStrings from './locales/de.json' with { type: 'json' };
import frStrings from './locales/fr.json' with { type: 'json' };
import nlStrings from './locales/nl.json' with { type: 'json' };

const LOCALE_REGISTRY = {
  de: { name: 'Deutsch',  strings: deStrings },
  en: { name: 'English',  strings: enStrings },
  es: { name: 'Español',  strings: esStrings },
  fr: { name: 'Français', strings: frStrings },
  nl: { name: 'Nederlands', strings: nlStrings },
};

export const SUPPORTED_LOCALES = Object.keys(LOCALE_REGISTRY);
export const LANGUAGE_NAMES    = Object.fromEntries(Object.entries(LOCALE_REGISTRY).map(([k, v]) => [k, v.name]));

const STORAGE_KEY = 'TallyUpLocale';
const DEFAULT_LOCALE = 'en';

class I18nStore {
  locale = DEFAULT_LOCALE;
  _strings = enStrings;

  constructor() {
    makeObservable(this, {
      locale: observable,
      _strings: observable,
      _setStrings: action,
    });
  }

  _setStrings(locale, strings) {
    this.locale = locale;
    this._strings = strings;
  }
}

export const i18nStore = new I18nStore();

// Auto-initialize when this module is first imported.
// All locale data is bundled — no async loading needed.
// Guards against non-browser environments (e.g. Node.js test runners).
(function _initLocale() {
  const isBrowser = typeof localStorage !== 'undefined';
  const saved = isBrowser ? localStorage.getItem(STORAGE_KEY) : null;
  const navLangs = typeof navigator !== 'undefined' ? (navigator.languages ?? [navigator.language ?? '']) : [];
  const detected = Array.from(navLangs)
    .map(l => l.split('-')[0])
    .find(l => SUPPORTED_LOCALES.includes(l));

  const urlLang = isBrowser ? new URLSearchParams(location.search).get('lang') : null;

  if (isBrowser && urlLang !== null) {
    const url = new URL(location.href);
    url.searchParams.delete('lang');
    history.replaceState(null, '', url);
  }

  let lang;
  if (SUPPORTED_LOCALES.includes(urlLang)) {
    lang = urlLang;
    localStorage.setItem(STORAGE_KEY, lang);
  } else {
    lang = SUPPORTED_LOCALES.includes(saved) ? saved : (detected ?? DEFAULT_LOCALE);
  }

  i18nStore._setStrings(lang, LOCALE_REGISTRY[lang].strings);
})();

/**
 * Returns the translated string for key, substituting {{variable}} placeholders.
 * Falls back to the key itself if not found.
 * @param {string} key
 * @param {Object} [vars]
 * @returns {string}
 */
export function t(key, vars) {
  const template = i18nStore._strings[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? `{{${k}}}`));
}

/**
 * Saves the chosen locale to localStorage and reloads the page.
 * Page reload ensures all components re-render with the new strings.
 * @param {string} lang
 */
export function setLocale(lang) {
  if (!SUPPORTED_LOCALES.includes(lang)) return;
  localStorage.setItem(STORAGE_KEY, lang);
  window.location.reload();
}
