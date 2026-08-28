import { LitElement, html, css } from 'lit';
import './reset-button.js';
import './undo-button.js';
import { i18nStore, t } from './i18n.js';

// Add locale-specific logos as they become available:
import logoEn from '../assets/tup-logo.png';
import logoEs from '../assets/tup-logo-es.png';
import logoFr from '../assets/tup-logo-fr.png';

// import logoFr from '../assets/tup-logo-fr.png';

// Maps locale codes to their logo asset. Omitted locales fall back to logoEn.
const LOCALE_LOGOS = {
  es: logoEs,
  fr: logoFr,
};


export class HeaderView extends LitElement {
  static properties = {
    canUndo: { type: Boolean, reflect: true },
  };

  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      width: 100%;
      min-width: 0;
      font-size: 16px;
      padding: 8px;
      background: linear-gradient(180deg, #fff45f 0%, #ffe465 100%);
    }
    .header-grid {
      display: grid;
      grid-template-columns: 1fr minmax(0, auto) 1fr;
      align-items: center;
      gap: 6px;
    }
    .logo {
      max-height: 28px;
      max-width: 100%;
      height: auto;
      width: auto;
    }
    reset-button {
      justify-self: end;
    }
  `;

  render() {
    const logo = LOCALE_LOGOS[i18nStore.locale] ?? logoEn;
    return html`
      <div class="header-grid">
        <undo-button ?disabled=${!this.canUndo}></undo-button>
        <img src=${logo} alt=${t('game.name')} class="logo">
        <reset-button></reset-button>
      </div>
    `;
  }

}

customElements.define('header-view', HeaderView);
