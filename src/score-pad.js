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
      padding: 0px;
      display: grid;
      height: 100%;
      width: 100%;
      min-width: 218px;
      gap: 0px;
      background-color: #f0eff5;
      touch-action: manipulation; /* Helps prevent double tap zoom on iOS */
      isolation: isolate;
    }
 
    @media (orientation: portrait), (max-width: 599px) {
      :host {
        grid-template-columns: 1fr;
        grid-template-rows: auto 1fr auto auto;
        grid-template-areas:
          "header"
          "board"
          "pending"
          "pad";
      }
      header-view {
        box-shadow: 0 0px 6px rgba(0, 0, 0, 0.15);
      }
      pending-score {
        box-shadow: 0 0px 6px rgba(0, 0, 0, 0.15);
      }
    }
    @media (orientation: landscape) and (min-width: 600px) {
      :host {
        grid-template-columns: minmax(0, 1.25fr) 1fr;
        grid-template-rows: auto 1fr auto auto;
        grid-template-areas:
          "board header"
          "board filler"
          "board pending"
          "board pad";
      }
    }

    header-view {
      z-index: 2;
    }

    score-board {
      grid-area: board;
      min-height: 64px;
      min-width: 0;
      z-index: 1;
    }

    pending-score {
      width: 100%;
      grid-area: pending;
      align-self: end;
      z-index: 2;
    }

    button-pad {
      grid-area: pad;
      z-index: 3;
    }

    .filler {
      grid-area: filler;
      background: linear-gradient(0, #fcb948 0%, #ffe465 100%);
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
      <div class="filler"></div>
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
