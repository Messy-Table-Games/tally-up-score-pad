import { LitElement, html, css } from 'lit';
import './reset-button.js';
import './undo-button.js';
import logoImage from '../assets/tup-logo.png';

export class HeaderView extends LitElement {
  static properties = {
    canUndo: { type: Boolean, reflect: true },
  };

  static styles = css`
    :host {
      display: block;
      box-sizing: border-box;
      width: 100%;
      min-width: 230px;
      font-size: 16px;
      padding: 6px 8px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 6px;
      border: 1px solid rgba(255, 255, 255, 0.6);
    }
    .header-grid {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 0px;
    }
    .logo {
      height: 24px;
    }
    reset-button {
      justify-self: end;
    }
  `;

  render() {
    return html`
      <div class="header-grid">
        <undo-button ?disabled=${!this.canUndo}></undo-button>
        <img src=${logoImage} alt="Tally Up Logo" class="logo">
        <reset-button @click=${this._onResetClick}></reset-button>
      </div>
    `;
  }

  _onResetClick() {
    this.dispatchEvent(new CustomEvent('reset-click', { bubbles: true, composed: true }));
  }
}

customElements.define('header-view', HeaderView);
