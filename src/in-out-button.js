import { LitElement, html, css } from 'lit';
import { t } from './i18n.js';

class InOutButton extends LitElement {
  static properties = {
    status: { type: String }, // 'in' or 'out'
  };

  static styles = css`
    :host {
      box-sizing: border-box;
    }

    button {
      font-size: 14px;
      font-weight: bold;
      min-width: 5em;
      height: 2em;
      padding: 0 12px;
      border: none;
      border-radius: 1.5em;
      cursor: pointer;
      color: white;
      transition: background 0.2s;
      display: grid;
      place-items: center;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
      touch-action: manipulation; /* Helps prevent double tap zoom on iOS */
      box-shadow: 0 0px 6px rgba(0, 0, 0, 0.25);
    }
    .label {
      grid-area: 1 / 1;
    }
    .label.hidden {
      visibility: hidden;
    }
    button.out {
      background: #d32f2f;
    }
    button.in {
      background: #388e3c;
    }
  `;

  constructor() {
    super();
    this.status = 'in';
  }

  render() {
    return html`
      <button class="${this.status}" @click=${this._onClick}>
        <span class="label ${this.status === 'in' ? '' : 'hidden'}">${t('status.in')}</span>
        <span class="label ${this.status === 'out' ? '' : 'hidden'}">${t('status.out')}</span>
      </button>
    `;
  }

  _onClick() {
    this.dispatchEvent(new CustomEvent('inout-button-click', {
      detail: { status: this.status },
      bubbles: true,
      composed: true,
    }));
  }
}

customElements.define('in-out-button', InOutButton);
