import { LitElement, html, css } from 'lit';
import { starSvg } from './shared-styles.js';

export class TallyUpButton extends LitElement {
  static styles = css`
    button {
      font-size: 14px;
      font-weight: bold;
      height: 2em;
      padding: 0 12px;
      border-radius: 16px;
      border: 1.5px solid #f29678;
      background: #fff;
      color: #f05422;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      gap: 3px;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
      touch-action: manipulation;
      box-shadow: 0 0px 6px rgba(0, 0, 0, 0.15);
    }
    button:active {
      background: #ddd;
      border-color: #ccc;
    }
    svg {
      height: 1em;
      width: auto;
    }
  `;

  _handleClick() {
    this.dispatchEvent(new CustomEvent('tally-up-button-click', {
      bubbles: true,
      composed: true,
    }));
  }

  render() {
    return html`
      <button @click=${this._handleClick}>
        ${starSvg}${starSvg}${starSvg}
      </button>
    `;
  }
}

customElements.define('tally-up-button', TallyUpButton);
