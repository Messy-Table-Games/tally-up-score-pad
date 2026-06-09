import { LitElement, html, css } from 'lit';
import { headerButtonStyles } from './shared-styles.js';
import { t } from './i18n.js';

export class ResetButton extends LitElement {
  static styles = [
    css`
      :host {
        display: inline-block;
      }
    `, 
    headerButtonStyles
  ];

  render() {
    return html`
      <button @click=${this._handleClick}>${t('button.clear')}</button>
    `;
  }

  _handleClick() {
    this.dispatchEvent(new CustomEvent('reset-click', {
      bubbles: true,
      composed: true,
    }));
  }
}

customElements.define('reset-button', ResetButton);
