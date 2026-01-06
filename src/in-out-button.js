import { LitElement, html, css } from 'lit';

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
      width: 4em;
      height: 2em;
      border: none;
      border-radius: 1.5em;
      cursor: pointer;
      color: white;
      transition: background 0.2s;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
      touch-action: manipulation; /* Helps prevent double tap zoom on iOS */
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
        ${this.status === 'in' ? 'IN' : 'OUT'}
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
