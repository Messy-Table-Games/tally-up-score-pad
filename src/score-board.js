import { LitElement, html, css } from 'lit';
import { autorun } from 'mobx';
import { keyed } from 'lit/directives/keyed.js';
import { APP_BUILD_NUMBER } from './build-number.js';
import './player-card.js';
import './plus-button.js';
import './help-button.js';
import './help-card.js';

export class Scoreboard extends LitElement {
  static properties = {
    game: { type: Object },
    _showHelp: { type: Boolean }
  };

  static styles = [
    css`
      :host {
        font-size: 16px;
        box-sizing: border-box;
        padding: 8px;
        display: flex;
        flex-direction: column;
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.5);
        gap: 8px;
        width: 100%;
        min-width: 301px;
        overflow: auto;
        max-height: 100%;
      }

      .add-player-btn {
        margin-top: 8px;
        align-self: center;
      }

      help-button {
        align-self: center;
      }

      .help-card {
        align-self: center;
        box-shadow: 0 0px 6px rgba(0, 0, 0, 0.15);
      }

      .build-number {
        align-self: center;
        font-size: 10px;
        color: #999;
      }
    `
  ];

  constructor() {
    super();
    this.game = null;
    this._disposeAutorun = null;
    this._showHelp = false;
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
    return html`
      ${this.game.players.map(
        (player) => keyed(player.id, html`
          <player-card .player=${player}></player-card>
        `)
      )}
      <plus-button
        radius="16"
        @plus-click=${this._onAddPlayerClick}
        title="Add Player"
        aria-label="Add Player"
        class="add-player-btn"
      ></plus-button>
      ${this.renderHelpCard()}
      ${this.renderBuildNumber()}
    `;
  }

  renderHelpCard() {
    return html`<help-card class="help-card" ?show-close=${false}></help-card>`;

    // if (this.game.players.length < 2) {
    //   return html`<help-card class="help-card" ?show-close=${false}></help-card>`;
    // }

    // if (this._showHelp) {
    //   return html`<help-card class="help-card" ?show-close=${true} @close-help=${this._onCloseHelp}></help-card>`;
    // }

    // return html`<help-button @click=${this._onHelpClick}>Help</help-button>`;
  }

  renderBuildNumber() {
    return html`<div class="build-number">Build ${APP_BUILD_NUMBER}</div>`;
  }

  _onAddPlayerClick() {
    this.dispatchEvent(new CustomEvent('add-player-click', {
      bubbles: true,
      composed: true
    }));
  }

  _onHelpClick() {
    this._showHelp = !this._showHelp;
  }

  _onCloseHelp() {
    this._showHelp = false;
  }
}

customElements.define('score-board', Scoreboard);
