import { LitElement, html, css } from 'lit';
import { AppState } from './model.js';
import './score-pad.js';
import './player-modals.js';
import { LogEvent } from './log-event.js';

class AppView extends LitElement {
  static properties = {
    appState: { type: Object },
    showPlayerNameModal: { type: Boolean },
    showPlayerScoreModal: { type: Boolean },
    editingPlayer: { type: Object },
    tempPlayerName: { type: String },
    tempPlayerScore: { type: Number },
  };

  static styles = css`
    :host {
      font-size: 16px;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      height: 100%;
      width: 100%;
      justify-content: flex-start;
      background-color: #31333a;
      overflow-y: auto;
    }
    * {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }

    @media (orientation: portrait), (max-width: 519px) {
      :host {
        padding-bottom: env(safe-area-inset-bottom);
      }
    }
    @media (orientation: landscape) and (min-width: 520px) {
      :host {
        padding-left: env(safe-area-inset-left);
        padding-right: env(safe-area-inset-right);
      }
    }

  `;

  constructor() {
    super();
    this.appState = new AppState();
    this.showPlayerNameModal = false;
    this.showPlayerScoreModal = false;
    this.editingPlayer = null;
    this.tempPlayerName = '';
    this.tempPlayerScore = 0;
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('dice-button-click', this._onDiceButtonClick);
    this.addEventListener('undo-click', this._onUndo);
    this.addEventListener('redo-click', this._onRedo);
    this.addEventListener('reset-click', this._onReset);
    this.addEventListener('add-player-click', this._onAddPlayer);
    this.addEventListener('player-name-click', this._onPlayerNameClick);
    this.addEventListener('player-score-click', this._onPlayerScoreClick);
    this.addEventListener('inout-click', this._onInOutClick);
    this.addEventListener('tup-click', this._onTUPClick);

    this.addEventListener('player-name-save', this._onPlayerNameSave);
    this.addEventListener('player-delete', this._onPlayerDelete);
    this.addEventListener('player-name-close', this._onPlayerNameModalClose);

    this.addEventListener('player-score-save', this._onPlayerScoreSave);
    this.addEventListener('player-score-close', this._onPlayerScoreModalClose);

    LogEvent('app_view_connected');
  }

  disconnectedCallback() {
    this.removeEventListener('dice-button-click', this._onDiceButtonClick);
    this.removeEventListener('undo-click', this._onUndo);
    this.removeEventListener('redo-click', this._onRedo);
    this.removeEventListener('reset-click', this._onReset);
    this.removeEventListener('add-player-click', this._onAddPlayer);
    this.removeEventListener('player-name-click', this._onPlayerNameClick);
    this.removeEventListener('player-score-click', this._onPlayerScoreClick);
    this.removeEventListener('inout-click', this._onInOutClick);
    this.removeEventListener('tup-click', this._onTUPClick);

    this.removeEventListener('player-name-save', this._onPlayerNameSave);
    this.removeEventListener('player-delete', this._onPlayerDelete);
    this.removeEventListener('player-name-close', this._onPlayerNameModalClose);

    this.removeEventListener('player-score-save', this._onPlayerScoreSave);
    this.removeEventListener('player-score-close', this._onPlayerScoreModalClose);

    super.disconnectedCallback();
  }

  render() {
    return html`
      <score-pad
        .appState=${this.appState}
      ></score-pad>

      <player-name-modal
        ?open=${this.showPlayerNameModal}
        .player=${this.editingPlayer}
        .tempName=${this.tempPlayerName}
      ></player-name-modal>

      <player-score-modal
        ?open=${this.showPlayerScoreModal}
        .player=${this.editingPlayer}
        .tempScore=${this.tempPlayerScore}
      ></player-score-modal>
    `;
  }

  _onDiceButtonClick(e) {
    if (e.detail.value === 'Next') {
      LogEvent('next_click');
      this.appState.endGameRound();
    } else if (e.detail.value === 'Bust') {
      LogEvent('bust_click');
      this.appState.bustGameRound();
    } else {
      LogEvent('dice_click', { value: e.detail.value });
      this.appState.addGameRoll(e.detail.value);
    }
  }

  _onUndo() {
    const undoConfirmationMessage = this.appState.undoConfirmationMessage;
    const message = undoConfirmationMessage 
      ? `${undoConfirmationMessage}`
      : 'Do you want to undo the last action?';
    
    if (confirm(message)) {
      LogEvent('undo_click');
      this.appState.undo();
    }
  }

  _onRedo() {
    this.appState.redo();
  }

  _onReset() {
   if (confirm(`Are you sure you want to clear the game scores? This cannot be undone.`)) {
    this.appState.clear();
    LogEvent('reset_click');
   }
  }

  _onAddPlayer() {
    this.appState.addPlayer();
  }

  _onPlayerNameClick(e) {
    this.editingPlayer = e.detail.player;
    this.tempPlayerName = this.editingPlayer.name;
    this.showPlayerNameModal = true;
    this.requestUpdate();
  }

  _onPlayerNameModalClose() {
    this.showPlayerNameModal = false;
    this.editingPlayer = null;
    this.tempPlayerName = '';
  }

  _onPlayerNameSave(e) {
    //console.log(`Saving player ${e.detail.player.id} with name ${e.detail.newName}`);
    if (e.detail.newName !== this.editingPlayer.name) {
      this.appState.changePlayerName(e.detail.player, e.detail.newName);
    }

    this._onPlayerNameModalClose();
  }

  _onPlayerDelete(e) {
    this.appState.removePlayer(e.detail.playerId);
    this._onPlayerNameModalClose();
  }

  _onPlayerScoreClick(e) {
    this.editingPlayer = e.detail.player;
    this.tempPlayerScore = this.editingPlayer.bankedScore;
    this.showPlayerScoreModal = true;
    this.requestUpdate();
  }

  _onPlayerScoreModalClose() {
    this.showPlayerScoreModal = false;
    this.editingPlayer = null;
    this.tempPlayerScore = 0;
  }

  _onPlayerScoreSave(e) {
    //console.log(`Saving player ${e.detail.player.id} with score ${e.detail.newScore}`);
    if (e.detail.newScore !== this.editingPlayer.bankedScore) {
      const scoreToAdd = e.detail.newScore - this.editingPlayer.bankedScore;
      this.appState.addPlayerScore(e.detail.player, scoreToAdd);
      LogEvent('player_score_changed');
    }

    this._onPlayerScoreModalClose();
  }

  _onInOutClick(e) {
    const player = e.detail.player;
    if (player.status === 'in') {
      this.appState.setPlayerStatus(player, 'out');
    } else {
      this.appState.setPlayerStatus(player, 'in');
    }
  }

  _onTUPClick(e) {
    const player = e.detail.player;
    this.appState.tallyUp(player);
    LogEvent('tup_click');
  }
}

customElements.define('app-view', AppView);
