import { LitElement, html, css } from 'lit';
import { headerButtonStyles } from './shared-styles.js';
import { t } from './i18n.js';

export class UndoButton extends LitElement {
  static properties = {
    disabled: { type: Boolean, reflect: true },
  };

  static styles = [
    css`
    :host {
      display: inline-block;
      touch-action: manipulation;
    }`,
    headerButtonStyles
  ];

  constructor() {
    super();
    this.disabled = false;
  }

  render() {
    return html`
      <button 
        @click=${this._handleClick}
        ?disabled=${this.disabled}
        >${t('button.undo')}</button>
    `;
  }

  _handleClick(event) {
    if (!this.disabled) {
      this.dispatchEvent(
        new CustomEvent('undo-click', {
          bubbles: true,
          composed: true,
        })
      );
    }
  }
}

customElements.define('undo-button', UndoButton);
