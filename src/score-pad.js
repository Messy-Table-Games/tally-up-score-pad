import { LitElement, html, css } from 'lit';
import { autorun } from 'mobx';
import './model.js';
import './score-board.js';
import './button-pad.js';
import './pending-score.js';
import './header-view.js';

export class ScorePad extends LitElement {
  static properties = {
    appState: { type: Object },
  };

  static styles = css`
    :host {
      font-size: 16px;
      box-sizing: border-box;
      padding: 8px;
      display: grid;
      height: 100%;
      width: 100%;
      gap: 8px;
      background: linear-gradient(135deg, #ff9a56 0%, #ffdd00 30%, #ffdd00 70%, #ff6b9d 100%);
      touch-action: manipulation; /* Helps prevent double tap zoom on iOS */
    }
 
    @media (orientation: portrait), (max-width: 519px) {
      :host {
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr auto auto;
        grid-template-areas:
          "header"
          "board"
          "pending"
          "pad";
      }
    }
    @media (orientation: landscape) and (min-width: 520px) {
      :host {
        grid-template-columns: 2fr 1fr;
        grid-template-rows: auto 1fr auto;
        grid-template-areas:
          "board header"
          "board pending"
          "board pad";
      }
    }
    
    score-board {
      grid-area: board;
      min-height: 64px;
    }

    pending-score {
      width: 100%;
      grid-area: pending;
      align-self: end;
    }

    button-pad {
      grid-area: pad;
    }
  `;

  constructor() {
    super();
    this.appState = null;
    this._disposeAutorun = null;
  }


  connectedCallback() {
    super.connectedCallback();
    this._disposeAutorun = autorun(() => {
      if (this.appState) {
        this.appState.canUndo;
        this.appState.canRedo;
        this.appState.canBust;
        this.appState.canNext;
      }
      this.requestUpdate();
    });
  }

  disconnectedCallback() {
    if (this._disposeAutorun) {
      this._disposeAutorun();
      this._disposeAutorun = null;
    }

    super.disconnectedCallback();
  }

  render() {
    return html`
      <header-view .canUndo=${this.appState.canUndo}></header-view>
      <score-board .game=${this.appState.game}></score-board>
      <pending-score .game=${this.appState.game}></pending-score>
      <button-pad
        .canUndo=${this.appState.canUndo}
        .canRedo=${this.appState.canRedo}
        .canBust=${this.appState.canBust}
        .canNext=${this.appState.canNext}
        .canRoll=${this.appState.canRoll}
        ></button-pad>
    `;
  }
}

customElements.define('score-pad', ScorePad);
