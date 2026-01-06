import { css } from 'lit';

export const headerButtonStyles = css`
  button {
    font-size: 12px;
    padding: 4px 8px;
    font-weight: bold;
    border-radius: 6px;
    border: 2px solid #fce77f;
    background: #fbf1be;
    color: #1a1310;
    cursor: pointer;
    transition: all 0.2s ease;
    touch-action: manipulation; /* Helps prevent double tap zoom on iOS */
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