import { LitElement, html, css } from 'lit';

export class HelpButton extends LitElement {
  static styles = css`
    :host { 
      display: inline-block;
    }
    button {
      cursor: pointer;
      font-size: 14px;
      padding: 4px 8px;
      font-weight: bold;
      border-radius: 6px;
      border: 2px solid #c2d8f0;
      background: #eaf0f5;
      color: #1a1310;
      cursor: pointer;
      transition: filter 0.2s, background 0.2s;
      touch-action: manipulation;
      user-select: none;
    }
    button:active { 
      filter: brightness(0.92); 
    }
  `;

  render() {
    return html`
      <button
        title="Help"
        aria-label="Help"
      >
        Help
      </button>
    `;
  }
}

customElements.define('help-button', HelpButton);
