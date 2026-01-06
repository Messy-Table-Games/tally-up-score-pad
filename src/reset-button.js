import { LitElement, html, css } from 'lit';
import { headerButtonStyles } from './shared-styles.js';

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
      <button>Clear</button>
    `;
  }
}

customElements.define('reset-button', ResetButton);
