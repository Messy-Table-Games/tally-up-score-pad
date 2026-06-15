import { LitElement, html, css } from 'lit';
import { autorun } from 'mobx';
import { keyed } from 'lit/directives/keyed.js';
import { APP_BUILD_NUMBER } from './build-number.js';
import './player-card.js';
import './help-card.js';
import './locale-selector.js';
import { t } from './i18n.js';

const SHOW_HELP_KEY = 'TallyUpShowHelp';

export class Scoreboard extends LitElement {
  static properties = {
    game: { type: Object },
    _showHelp: { state: true }
  };

  static styles = [
    css`
      :host {
        font-size: 16px;
        box-sizing: border-box;
        padding: 8px;
        display: flex;
        flex-direction: column;
        background: #f0eff5;
        gap: 8px;
        width: 100%;
        min-width: 0;
        overflow: auto;
        max-height: 100%;
      }

      .btn-group {
        margin-top: 8px;
        display: flex;
        flex-direction: column;
        align-self: center;
        gap: 8px;
      }

      .add-player-btn {
        font-size: 14px;
        padding: 8px 20px;
        border-radius: 16px;
        border: none;
        background: #1976d2;
        color: #ffffff;
        cursor: pointer;
        touch-action: manipulation;
        box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.2);
      }

      .add-player-btn:active {
        filter: brightness(92%);
      }

      .show-help-btn {
        font-size: 14px;
        padding: 6px 18px;
        border-radius: 16px;
        border: none;
        background: #faf9fc;
        color: #333;
        cursor: pointer;
        touch-action: manipulation;
        box-shadow: 0px 0px 6px rgba(0, 0, 0, 0.2);
      }

      .t-space {
        margin-top: 16px;
      }      

      .show-help-btn:active {
        filter: brightness(92%);
      }

      .help-card {
        align-self: center;
      }

      .locale-selector {
        align-self: center;
      }

      .build-info {
        margin-top: auto;
        align-self: center;
        display: flex;
        flex-direction: column;
      }

      .build-number {
        font-size: 10px;
        color: #999;
        align-self: center;
      }

      .env-badge {
        align-self: center;
        color: #e31717;
        font-weight: bold;
        font-size: 14px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    `
  ];

  constructor() {
    super();
    this.game = null;
    const saved = localStorage.getItem(SHOW_HELP_KEY);
    this._showHelp = saved !== null ? saved === 'true' : false;
    this._disposeAutorun = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._disposeAutorun = autorun(() => {
      if (this.game) {
        this.game;
        this.game.players;
        this.game.players.length;
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
    let btnGroupClass = 'btn-group';
    if (this.game.players.length < 1) {
      btnGroupClass += ' t-space';
    }

    return html`
      ${this.game.players.map(
        (player) => keyed(player.id, html`
          <player-card .player=${player}></player-card>
        `)
      )}
      <div class=${btnGroupClass}>
        <button
          class="add-player-btn"
          @click=${this._onAddPlayerClick}
          title=${t('label.addPlayer')}
          aria-label=${t('label.addPlayer')}
        >${t('label.addPlayer')}</button>
        <button
          class="show-help-btn"
          @click=${this._onToggleHelp}
        >${this._showHelp ? t('button.hideHelp') : t('button.showHelp')}</button>
      </div>
      ${this._showHelp ? this.renderHelpCard() : ''}
      <locale-selector class="locale-selector"></locale-selector>
      ${this.renderBuildNumber()}
    `;
  }

  renderHelpCard() {
    return html`<help-card class="help-card"></help-card>`;
  }

  renderBuildNumber() {
    let envBadge = '';
    if (APP_ENV === 'development') {
      envBadge = html`<span class="env-badge">DEVELOPMENT</span>`
    } else if (APP_ENV === 'staging') {
      envBadge = html`<span class="env-badge">STAGING</span>`
    }

    return html`<div class="build-info">${envBadge}<span class="build-number">${APP_BUILD_NUMBER}</span></div>`;
  }

  _onToggleHelp() {
    this._showHelp = !this._showHelp;
    localStorage.setItem(SHOW_HELP_KEY, this._showHelp ? 'true' : 'false');
  }

  _onAddPlayerClick() {
    this.dispatchEvent(new CustomEvent('add-player-click', {
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('score-board', Scoreboard);
