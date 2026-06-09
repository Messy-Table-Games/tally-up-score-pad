import { LitElement, html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { t } from './i18n.js';
import { starSvgStr } from './shared-styles.js';

const tupButtonHtml = `<span style="display:inline-flex;align-items:center;gap:2px;border:1px solid #f29678;border-radius:16px;padding:0 2px;margin-bottom:2px;height:1em;color:#f05422;background:#fff;vertical-align:middle"><span style="display:inline-flex;align-items:center;gap:3px;transform:scale(.8);transform-origin:50% 50%;">${starSvgStr}${starSvgStr}${starSvgStr}</span></span>`;

export class HelpCard extends LitElement {
  static styles = [
    css`
      :host {
        display: flex;
        flex-direction: column;
        gap: 8px;
        box-sizing: border-box;
        padding: 8px;
        margin: 0 30px;
        border-radius: 12px;
        background: #ffffff;
        border: 1px solid rgba(255, 255, 255, 0.7);
        font-size: 14px;
        line-height: 1.4;
        color: #333;
        max-width: 400px;
        box-shadow: 0 0px 6px rgba(0, 0, 0, 0.15);
      }

      h3 {
        margin: 0 0 12px 0;
        font-size: 16px;
        font-weight: 600;
        color: #222;
        text-align: center;
      }

      ul {
        margin: 0;
        padding: 0;
        list-style: none;
      }

      li {
        margin-bottom: 8px;
        padding-left: 16px; 
        position: relative;
      }

      /* Align bullet with center of the first line only, regardless of wrap */
      li:before {
        content: '';
        position: absolute;
        left: 0;
        top: 0.7em; /* half of line-height (1.4em) => centers within first line */
        transform: translateY(-50%);
        width: 6px;
        height: 6px;
        background: #007acc;
        border-radius: 50%;
      }

      li:last-child {
        margin-bottom: 0;
      }
      button {
        align-self: center;
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
      .in {
        color: #388e3c;
      }

      .out {
        color: #d32f2f;
      }
    `
  ];

  render() {
    return html`
      ${unsafeHTML(t('help.content', { tupButton: tupButtonHtml }))}
    `;
  }
}

customElements.define('help-card', HelpCard);
