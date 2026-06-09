import { LitElement, html, css } from 'lit';
import { autorun } from 'mobx';
import { i18nStore, setLocale, SUPPORTED_LOCALES, LANGUAGE_NAMES, t } from './i18n.js';
import './modal-dialog.js';

export class LocaleSelector extends LitElement {
  static properties = {
    _open: { type: Boolean, state: true }
  };

  static styles = css`
    .trigger {
      font-size: 12px;
      padding: 4px 8px;
      font-weight: normal;
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.7);
      background: #faf9fc;
      color: #1a1310;
      cursor: pointer;
      transition: all 0.2s ease;
      touch-action: manipulation;
      box-shadow: 0 0px 6px rgba(0, 0, 0, 0.15);
    }

    .trigger:active {
      filter: brightness(92%);
    }

    modal-dialog {
      --modal-max-width: 320px;
      --modal-content-padding: 0px;
    }

    .locale-list {
      display: flex;
      flex-direction: column;
    }

    .locale-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      min-height: 44px;
      padding: 10px 16px;
      border: none;
      border-bottom: 1px solid #e0e0e0;
      border-radius: 0;
      background: #f0eff5;
      color: #1a1310;
      font-size: 1em;
      cursor: pointer;
      text-align: left;
      transition: background 0.15s;
      touch-action: manipulation;
      box-sizing: border-box;
    }

    .locale-option:last-child {
      border-bottom: none;
    }

    .locale-option:active {
      background: #f0f0f0;
    }

    .locale-option.active {
      font-weight: bold;
      color: #1976d2;
    }

    .locale-check {
      font-size: 1em;
      color: #1976d2;
    }
  `;

  constructor() {
    super();
    this._open = false;
    this._disposeAutorun = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._disposeAutorun = autorun(() => {
      i18nStore.locale;
      this.requestUpdate();
    });
  }

  disconnectedCallback() {
    if (this._disposeAutorun) {
      this._disposeAutorun();
      this._disposeAutorun = null;
    }
    super.disconnectedCallback();
  }

  render() {
    return html`
      <button class="trigger" @click=${this._openModal} aria-label=${t('locale.label')}>
        ${LANGUAGE_NAMES[i18nStore.locale]} ▾
      </button>
      <modal-dialog
        ?open=${this._open}
        .mfs=${false}
        @modal-close=${this._onModalClose}
      >
        <div class="locale-list">
          ${SUPPORTED_LOCALES.map(lang => html`
            <button
              class="locale-option ${i18nStore.locale === lang ? 'active' : ''}"
              @click=${() => this._selectLocale(lang)}
            >
              ${LANGUAGE_NAMES[lang]}
              ${i18nStore.locale === lang ? html`<span class="locale-check">✓</span>` : null}
            </button>
          `)}
        </div>
      </modal-dialog>
    `;
  }

  _openModal() {
    this._open = true;
  }

  _onModalClose() {
    this._open = false;
  }

  _selectLocale(lang) {
    setLocale(lang);
  }
}

customElements.define('locale-selector', LocaleSelector);
