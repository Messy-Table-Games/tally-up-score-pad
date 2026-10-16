import { LitElement, html, css } from 'lit';
import { AppState } from './model.js';
import './score-pad.js';
import './player-modals.js';
import './confirm-dialog.js';
import { LogEvent } from './log-event.js';
import { i18nStore, t } from './i18n.js';

const KEY_TO_DICE_VALUE = {
  '1': '10',
  '2': '20',
  '3': '30',
  '4': '40',
  '5': '50',
  '6': '60',
  '7': '70',
  '0': '100',
  '+': '100',
  '-': '-100',
  '*': 'x2',
  b: 'Bust',
  n: 'Next',
  u: 'Undo',
  arrowleft: 'Undo',
  r: 'Redo',
  arrowright: 'Redo',
};

class AppView extends LitElement {
  static properties = {
    appState: { type: Object },
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
    this._confirmDialogOpen = false;
    this._addPlayerDialogOpen = false;
    this._editNameDialogOpen = false;
    this._editScoreDialogOpen = false;
    this._handleKeyDown = this._handleKeyDown.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('dice-button-click', this._onDiceButtonClick);
    window.addEventListener('keydown', this._handleKeyDown);
    this.addEventListener('undo-click', this._onUndo);
    this.addEventListener('reset-click', this._onReset);
    this.addEventListener('add-player-click', this._onAddPlayer);
    this.addEventListener('player-name-click', this._onPlayerNameClick);
    this.addEventListener('player-score-click', this._onPlayerScoreClick);
    this.addEventListener('inout-click', this._onInOutClick);
    this.addEventListener('tup-click', this._onTUPClick);
  }

  disconnectedCallback() {
    this.removeEventListener('dice-button-click', this._onDiceButtonClick);
    window.removeEventListener('keydown', this._handleKeyDown);
    this.removeEventListener('undo-click', this._onUndo);
    this.removeEventListener('reset-click', this._onReset);
    this.removeEventListener('add-player-click', this._onAddPlayer);
    this.removeEventListener('player-name-click', this._onPlayerNameClick);
    this.removeEventListener('player-score-click', this._onPlayerScoreClick);
    this.removeEventListener('inout-click', this._onInOutClick);
    this.removeEventListener('tup-click', this._onTUPClick);

    super.disconnectedCallback();
  }

  render() {
    return html`
      <score-pad
        .appState=${this.appState}
      ></score-pad>

      <edit-name-modal id="edit-name-dialog"></edit-name-modal>
      <edit-score-modal id="edit-score-dialog"></edit-score-modal>

      <confirm-dialog id="confirm-dialog"></confirm-dialog>
      <add-player-modal id="add-player-dialog"></add-player-modal>
    `;
  }

  _onDiceButtonClick(e) {
    this._applyDiceValue(e.detail.value);
  }

  _applyDiceValue(value) {
    if (value === 'Undo') {
      this._onUndo();
    } else if (value === 'Redo') {
      this._onRedo();
    } else if (value === 'Next') {
      LogEvent('next_click');
      this.appState.endGameRound();
    } else if (value === 'Bust') {
      LogEvent('bust_click');
      this.appState.bustGameRound();
    } else {
      this.appState.addGameRoll(value);
    }
  }

  _handleKeyDown(e) {
    if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    if (this._confirmDialogOpen || this._addPlayerDialogOpen ||
        this._editNameDialogOpen || this._editScoreDialogOpen) return;
    // Covers dialogs app-view does not open itself, such as the language picker
    if (e.composedPath().some(el => el.localName === 'dialog')) return;

    const value = KEY_TO_DICE_VALUE[e.key.toLowerCase()];
    if (!value) return;

    const enabled = value === 'Bust' ? this.appState.canBust
                  : value === 'Next' ? this.appState.canNext
                  : value === 'Undo' ? this.appState.canUndo
                  : value === 'Redo' ? this.appState.canRedo
                  : this.appState.canRoll;
    if (!enabled) return;

    e.preventDefault();
    this._applyDiceValue(value);
  }

  _onUndo() {
    LogEvent('undo_click');
    this._showToast(this.appState.undo());
  }

  _onRedo() {
    LogEvent('redo_click');
    this._showToast(this.appState.redo());
  }

  _showToast(description) {
    if (description) {
      this.renderRoot?.querySelector('score-pad')?.showUndoToast(description);
    }
  }

  async _onReset() {
    if (this._confirmDialogOpen) return;

    const dialog = this.renderRoot?.querySelector('#confirm-dialog');
    if (!dialog) return;

    this._confirmDialogOpen = true;
    try {
      const confirmed = await dialog.show({
        title: '',
        message: t('dialog.clearConfirm'),
        confirmLabel: t('dialog.clearConfirmLabel'),
        cancelLabel: t('button.cancel'),
        variant: 'danger',
        showCancel: true,
      });

      if (confirmed) {
        this.appState.clear();
        LogEvent('reset_click', { locale: i18nStore.locale });
      }
    } finally {
      this._confirmDialogOpen = false;
    }
  }

  async _onAddPlayer() {
    if (this._addPlayerDialogOpen) return;

    const dialog = this.renderRoot?.querySelector('#add-player-dialog');
    if (!dialog) return;

    this._addPlayerDialogOpen = true;
    try {
      const result = await dialog.show();
      if (result.add) {
        this.appState.addPlayer(result.name);
      }
    } finally {
      this._addPlayerDialogOpen = false;
    }
  }

  async _onPlayerNameClick(e) {
    if (this._editNameDialogOpen) return;
    const modal = this.renderRoot?.querySelector('#edit-name-dialog');
    if (!modal) return;
    this._editNameDialogOpen = true;
    try {
      const result = await modal.show({ player: e.detail.player });
      if (result?.action === 'save') {
        if (result.newName !== e.detail.player.name) {
          this.appState.changePlayerName(e.detail.player, result.newName);
        }
      } else if (result?.action === 'delete') {
        this.appState.removePlayer(result.playerId);
      }
    } finally {
      this._editNameDialogOpen = false;
    }
  }

  async _onPlayerScoreClick(e) {
    if (this._editScoreDialogOpen) return;
    const modal = this.renderRoot?.querySelector('#edit-score-dialog');
    if (!modal) return;
    this._editScoreDialogOpen = true;
    try {
      const result = await modal.show({ player: e.detail.player });
      if (result?.action === 'save') {
        const player = e.detail.player;
        if (result.newScore !== player.bankedScore) {
          this.appState.addPlayerScore(player, result.newScore - player.bankedScore);
          LogEvent('player_score_changed');
        }
      }
    } finally {
      this._editScoreDialogOpen = false;
    }
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
