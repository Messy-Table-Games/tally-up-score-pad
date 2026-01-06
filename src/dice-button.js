import { LitElement, html, css } from 'lit';

export class DiceButton extends LitElement {
  static properties = {
    disabled: { type: Boolean, reflect: true },
    value: { type: String },
  };

  static styles = css`
    button {
      width: 100%;
      min-width: 50px;
      font-size: 16px;
      font-weight: bold;
      padding: 10px 0;
      border-radius: 6px;
      border: 2px solid #c3401c;
      background: rgba(255, 255, 255, 0.95);
      color: black;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
      touch-action: manipulation;
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

  getAriaLabel() {
    return `Dice value ${this.value}`;
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

  render() {
    return html`
      <button
        ?disabled=${this.disabled}
        title=${this.getAriaLabel()}
        aria-label=${this.getAriaLabel()}
        aria-disabled=${this.disabled}
        @click=${this._handleClick}
      >
        ${this.value}
      </button>
    `;
  }}

customElements.define('dice-button', DiceButton);
