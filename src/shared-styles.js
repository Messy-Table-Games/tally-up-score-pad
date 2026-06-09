import { html, css } from 'lit';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';

export const headerButtonStyles = css`
  button {
    font-size: 14px;
    padding: 6px 10px;
    font-weight: regular;
    border-radius: 8px;
    border: 0px solid #ffffff;
    background: #fffadd;
    color: #1a1310;
    cursor: pointer;
    transition: all 0.2s ease;
    touch-action: manipulation; /* Helps prevent double tap zoom on iOS */
    box-shadow: 0px 0px 4px rgba(0, 0, 0, 0.15);
  }
  button:active {
    filter: brightness(92%);
  }

  :host([disabled]) button,
  button:disabled {
    color: #a6a6a6;
    background: #fefcef;
    border-color: #faf4d8;
  }
`;

export const arrowSvg = html`
<svg viewBox="0 0 22 16" xmlns="http://www.w3.org/2000/svg" fill="none">
  <line x1="2" y1="8" x2="20" y2="8" stroke="#3182ce" stroke-width="2" stroke-linecap="round" />
  <path d="M15 3 L20 8 L15 13" stroke="#3182ce" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" />
</svg>`;

export const starSvgStr = `<svg xmlns="http://www.w3.org/2000/svg" style="height:1em;width:auto" viewBox="0 0 103.92 120.00"><polygon fill="currentColor" points="51.96,0.00 36.96,34.02 0.00,30.00 21.96,60.00 0.00,90.00 36.96,85.98 51.96,120.00 66.96,85.98 103.92,90.00 81.96,60.00 103.92,30.00 66.96,34.02"/></svg>`;
export const starSvg = unsafeHTML(starSvgStr);
