import { LitElement, html, css } from 'lit';
import { t } from './i18n.js';

export class DiceButton extends LitElement {
  static properties = {
    disabled: { type: Boolean, reflect: true },
    value: { type: String },
  };

  static styles = css`
    :host {
      display: block;
      min-width: 0;
    }

    button {
      width: 100%;
      min-width: 50px;
      font-size: 16px;
      font-weight: bold;
      height: 40px;
      padding: 0;
      border-radius: 8px;
      border: none;
      background: #ffffff;
      color: black;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
      touch-action: manipulation;
      box-shadow: 0 0px 6px rgba(0, 0, 0, 0.3);
    }

    .label {
      white-space: nowrap;
    }

    button:active {
      background: rgba(255, 255, 255, 0.7);
    }

    /* Basic focus ring for keyboard users */
    button:focus-visible {
      outline: 2px solid #5b9dd9;
      outline-offset: 2px;
    }

      /* Make border lighter when disabled */
    :host([disabled]) button,
    button:disabled {
        color: #a6a6a6;
      }
  `;

  constructor() {
    super();
    this.value = '';
    this.disabled = false;
  }

  getTitle() {
    return t('diceButton.value', { value: this.value });
  }

  getDisplayLabel() {
    if (this.value === 'Bust') return t('diceButton.bust');
    if (this.value === 'Next') return t('diceButton.next');
    return this.value;
  }

  _handleClick(event) {
    if (!this.disabled) {
      this.dispatchEvent(new CustomEvent('dice-button-click', {
        detail: { value: this.value },
        bubbles: true,
        composed: true
      }));
    }
  }

  _adjustFontSize() {
    const button = this.shadowRoot?.querySelector('button');
    const label = this.shadowRoot?.querySelector('.label');
    if (!button || !label) return;

    label.style.fontSize = '';
    const available = button.clientWidth;
    const textWidth = label.scrollWidth;

    if (available > 0 && textWidth > available) {
      const scaled = Math.max(8, Math.floor(16 * available / textWidth));
      label.style.fontSize = `${scaled}px`;
    }
  }

  updated(changed) {
    if (changed.has('value')) this._adjustFontSize();
  }

  connectedCallback() {
    super.connectedCallback();
    this._resizeObserver = new ResizeObserver(() => requestAnimationFrame(() => this._adjustFontSize()));
    this.updateComplete.then(() => {
      const button = this.shadowRoot?.querySelector('button');
      if (button) this._resizeObserver.observe(button);
    });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._resizeObserver?.disconnect();
  }

  render() {
    return html`
      <button
        ?disabled=${this.disabled}
        title=${this.getTitle()}
        aria-label=${this.getTitle()}
        aria-disabled=${this.disabled}
        @click=${this._handleClick}
      >
        <span class="label">${this.getDisplayLabel()}</span>
      </button>
    `;
  }}

customElements.define('dice-button', DiceButton);
