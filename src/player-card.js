import { LitElement, html, css } from 'lit';
import { autorun } from 'mobx';
import { arrowSvg } from './shared-styles.js';
import './in-out-button.js';
import './tally-up-button.js';

// const arrowTriangleHeadSvg = html`
// <svg viewBox="0 0 26 16" xmlns="http://www.w3.org/2000/svg">
//   <polygon points="0,7 20,7 20,9 0,9"/>
//   <polygon points="26,8 17,4 17,12"/>
// </svg>`;

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
      padding: 8px 12px;
      background: #ffffff;
      box-shadow: 0 0px 6px rgba(0, 0, 0, 0.15);
      gap: 8px;
      width: 100%;
      border: none;
    }
    .player-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .player-name {
      font-weight: bold;
      padding: 0;
      margin: 0;
      text-align: left;
      overflow: hidden;
      cursor: pointer;
      color: #2d3748;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .player-name:active {
      background-color: rgba(25, 118, 210, 0.1);
    }
    .score-row {
      font-size: 18px;
      display: flex;
      flex-direction: row;
      gap: 0;
      padding: 0;
      align-items: center;
    }
    .banked-score {
      font-weight: normal;
      color: #222222;
    }
    .pending-score {
      font-weight: bold;
      color: #3182ce;
    }
    .pending-arrow {
      height: 1em;
      padding-left: 6px;
      padding-right: 6px;
    }
    .pending-arrow svg {
      height: 100%;
      fill: #3182ce;
    }
    @media (resolution: 1dppx) {
      .pending-arrow svg {
        transform: translateY(-0.5px);
      }
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
    
    .buttons {
      flex: 0 0 auto;
      display: flex;
      flex-direction: row;
      gap: 10px;
      align-items: center;
      justify-content: right;
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
      <div class="player-info">
        <div class="player-name" @click=${this._onNameClick}>${this.player.name}</div>
        <div class="score-row">
          <div class="${bankedScoreClass}" @click=${this._onScoreClick}>
            ${this.player.bankedScore}
          </div>
          ${showPendingTotal ? html`
            <span class="pending-arrow">${arrowSvg}</span>
            <span class="pending-score">${this.player.pendingTotalScore}</span>` 
            : ''}   
        </div>
      </div>
      <div class="buttons">
        <tally-up-button @tally-up-button-click=${this._onTUP}></tally-up-button>
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
