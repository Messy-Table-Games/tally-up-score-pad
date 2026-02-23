import { LitElement, html, css } from 'lit';

export class HelpCard extends LitElement {
  static properties = {
    showClose: { type: Boolean, attribute: 'show-close' },
  };
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
        background: rgba(255, 255, 255, 0.95);
        border: 1px solid rgba(255, 255, 255, 0.7);
        font-size: 14px;
        line-height: 1.4;
        color: #333;
        max-width: 400px;
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
    `
  ];

  constructor() {
    super();
    this.showClose = false;
  }
  
  render() {
    return html`
      <ul>
        <li>Tap the plus to add a player.</li>
        <li>Tap a player name to change the name or delete a player.</li>
        <li>Tap on a player's score to manually change their score.</li>
        <li>Tap on a dice roll number in the button pad to add it to the running total.</li>
        <li>Tap the <b>IN/OUT</b> button for a player to change their status.</li>
        <li>Tap <b>Bust</b> when a bust occurs. <em>A bust occurs when 2 stars are rolled in the Main roll, or 2 or more stars are shown after the Up die roll.</em></li>
        <li>Tap <b>Next</b> if all players have gone <b>OUT</b>.</li>
        <li>Tap <b>TUP!</b> for the player that yells Tally Up! first. This will add 200 points to their score, and then adds 100 points to the scores for all other players still <b>IN</b>. <em>A Tally Up! occurs when 3 stars are rolled in the Main roll.</em></li>
        <li>Tap <b>Undo</b> to revert the last action.</li>
        <li>Tap <b>Clear</b> to reset all scores to 0 for a new game.</li>
      </ul>
      ${this.showClose ? html`<button @click=${this._onClose}>Close</button>` : ''}
    `;
  }

  _onClose() {
    this.dispatchEvent(new CustomEvent('close-help', {
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('help-card', HelpCard);
