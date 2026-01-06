import { LitElement, html, css } from 'lit';
import { autorun } from 'mobx';
import './in-out-button.js';

export class PlayerCard extends LitElement {
  static properties = {
    player: { type: Object }
  };

  static styles = css`
    :host {
      font-size: 16px;
      box-sizing: border-box;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      border-radius: 12px;
      padding: 8px 8px;
      background: rgba(255, 255, 255, 0.95);
      box-shadow: 0 0px 6px rgba(0, 0, 0, 0.15);
      gap: 0px;
      min-width: 100%;
      width: max-content;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .player-name {
      width: 30px;
      flex: 1 1 0;
      font-weight: 600;
      padding: 4px 8px;
      margin: 0px;
      text-align: left;
      overflow: hidden;
      cursor: pointer;
      border-radius: 6px;
      color: #2d3748;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .player-name:active {
      background-color: rgba(25, 118, 210, 0.1);
    }
    .pending-score {
      font-weight: 700;
      color: #3182ce;
      text-align: right;
      min-width: 2.4em;
    }
    .banked-score {
      font-weight: 700;
      color: #2d3748;
      text-align: right;
      min-width: 2.4em;
    }
    .banked-score.increased {
      animation: scoreIncreased .75s ease-out forwards;
    }
    .banked-score.decreased {
      animation: scoreDecreased .25s ease-out forwards;
    }

    @keyframes scoreIncreased {
      0% {
        color: #0084ff;
        transform: scale(1.15);
      }
      100% {
        color: #2d3748;
        transform: scale(1);
      }
    }

    @keyframes scoreDecreased {
      0% {
        color: #c9d4e8;
      }
      100% {
        color: #2d3748;
      }
    }
    
    .scoresbuttons {
      flex: 2 1 0;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      gap: 10px;
      align-items: center;
    }
    .score-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: row;
      gap: 8px;
      text-align: left;
    }
    .score-list li {
      padding: 2px 6px;
      border-radius: 4px;
    }
    .tup-button {
      font-size: 14px;
      font-weight: bold;
      width: 4em;
      height: 2em;
      border-radius: 16px;
      border: 2px solid #ffa8a5;
      background: #fff;
      color: #f05422;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
      touch-action: manipulation; /* Helps prevent double tap zoom on iOS */
    }
    .tup-button:active {
      background: #ddd;
      border-color: #ccc;
    }
  `;

  constructor() {
    super();
    this.player = null;
    this._disposeAutorun = null;
    this._lastBankedScore = null;
    this._bankedScoreChanged = '';
    this._animationTimeout = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._disposeAutorun = autorun(() => {
      if (this.player) {
        const currentBankedScore = this.player.bankedScore;
        
        if (this._lastBankedScore !== null && currentBankedScore !== this._lastBankedScore) {
          this._triggerScoreAnimation(currentBankedScore > this._lastBankedScore);
        }

        this._lastBankedScore = currentBankedScore;

        this.player.status;
        this.player.pendingScore;
        this.player.pendingBankedScore;
        this.player.name;
      }
      this.requestUpdate();
    });
  }

  disconnectedCallback() {
    if (this._disposeAutorun) {
      this._disposeAutorun();
      this._disposeAutorun = null;
    }
    if (this._animationTimeout) {
      clearTimeout(this._animationTimeout);
    }
    super.disconnectedCallback();
  }

  _triggerScoreAnimation(increased) {
    if (this._animationTimeout) {
      clearTimeout(this._animationTimeout);
    }

    if (increased) {
      this._bankedScoreChanged = ' increased';
    } else {
      this._bankedScoreChanged = ' decreased';
    }

    this.requestUpdate();

    this._animationTimeout = setTimeout(() => {
      this._bankedScoreChanged = '';
      this.requestUpdate();
    }, 1000);
  }

  render() {
    const showPendingTotal = this.player.hasPendingScore && this.player.status === 'in';
    const bankedScoreClass = 'banked-score' + this._bankedScoreChanged;
    
    return html`
      <div class="player-name" @click=${this._onNameClick}>${this.player.name}</div>
      <div class="scoresbuttons">
        <div class="${bankedScoreClass}" @click=${this._onScoreClick}>
          ${this.player.bankedScore}
        </div>
        <div class="pending-score">${showPendingTotal ? this.player.pendingTotalScore : ''}</div>
        <button class="tup-button" @click=${this._onTUP}>TUP!</button>
        <in-out-button
          .status=${this.player.status}
          @inout-button-click=${this._onInOut}
        ></in-out-button>
      </div>
    `;
  }

  _onNameClick() {
    this.dispatchEvent(new CustomEvent('player-name-click', { 
      detail: { player: this.player },
      bubbles: true,
      composed: true 
    }));
  }

  _onScoreClick() {
    this.dispatchEvent(new CustomEvent('player-score-click', { 
      detail: { player: this.player },
      bubbles: true,
      composed: true 
    }));
  }

  _onInOut() {
    this.dispatchEvent(new CustomEvent('inout-click', { 
      detail: { player: this.player },
      bubbles: true,
      composed: true 
    }));
  }

  _onTUP() {
    this.dispatchEvent(new CustomEvent('tup-click', { 
      detail: { player: this.player },
      bubbles: true,
      composed: true 
    }));
  }
}

customElements.define('player-card', PlayerCard);
