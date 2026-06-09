import { LitElement, html, css } from 'lit';
import './modal-dialog.js';
import { t } from './i18n.js';

const PLAYER_NAME_MAX_LENGTH = 50;

// Base class for player modals
class PlayerOptionsModal extends LitElement {
  static properties = {
    open: { type: Boolean },
    player: { type: Object },
  };

  static styles = css`
    modal-dialog {
      --modal-max-width: 694px;
    }
    .modal-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding-left: 4px;
      padding-right: 4px;
    }
    .modal-buttons {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }
    .modal-buttons button {
      padding: 8px 16px;
      border: none;
      border-radius: 16px;
      cursor: pointer;
      font-size: 1em;
    }
    .modal-buttons .primary {
      background: #1976d2;
      color: white;
    }
    .modal-buttons .danger {
      background: #d32f2f;
      color: white;
    }
    .modal-buttons .secondary {
      background: #e7e7e7;
      color: #333;
    }
    /* Default order for row layout: Cancel, Delete, Save */
    .modal-buttons .secondary {
      order: 1;
    }
    .modal-buttons .danger {
      order: 2;
    }
    .modal-buttons .primary {
      order: 3;
    }
    @media (max-width: 404px) {
      .modal-buttons {
        flex-direction: column;
        align-items: center;
        width: max-content;
        margin-left: auto;
        margin-right: auto;
      }
      .modal-buttons button {
        width: 100%;
      }
      /* Override order for column layout: Cancel, Save, Delete */
      .modal-buttons .primary {
        order: 1;
      }
      .modal-buttons .danger {
        order: 2;
      }
      .modal-buttons .secondary {
        order: 3;
      }
    }
    .name-input {
      box-sizing: border-box;
      width: 100%;
      padding: 8px;
      margin-top: 4px;
      font-size: 1em;
      border: 2px solid #ccc;
      border-radius: 4px;
      justify-content: center;
      display: block;
      margin-left: auto;
      margin-right: auto;
    }
    .score-input {  
      box-sizing: border-box;
      width: 100%;
      padding: 8px;
      margin-top: 4px;
      font-size: 1em;
      border: 2px solid #ccc;
      border-radius: 4px;
      justify-content: center;
      display: block;
      margin-left: auto;
      margin-right: auto;
    }
  `;

  constructor() {
    super();
    this.open = false;
    this.player = null;
    this._resolver = null;
  }

  _resolve(value) {
    if (this._resolver) {
      this._resolver(value);
      this._resolver = null;
    }
  }

  updated(changedProperties) {
    if (changedProperties.has('open') && this.open) {
      this.updateComplete.then(() => {
        const input = this.shadowRoot.querySelector(this.getInputSelector());
        if (input) {
          input.focus();
          input.select();
        }
      });
    }
  }

  getInputSelector() {
    // Subclasses should override this
    return '';
  }

  getTitle() {
    // Subclasses should override this
    return "";
  }

  renderContent() {
    // Subclasses should override this
    return html``;
  }

  // Subclasses must implement _onClose
  render() {
    return html`
      <modal-dialog
        ?open=${this.open}
        title=${this.getTitle()}
        @modal-close=${this._onClose}
      >
        <div class="modal-content">
          ${this.renderContent()}
        </div>
      </modal-dialog>
    `;
  }

  // Subclasses must implement _onEnter() and _onEscape()
  _onKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      this._onEnter();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this._onEscape();
    }
  }
}

class PlayerNameModal extends PlayerOptionsModal {
  static properties = {
    ...super.properties,
    tempName: { type: String },
  }

  constructor() {
    super();
    this.tempName = '';
  }

  updated(changedProperties) {
    super.updated(changedProperties);

    if ((changedProperties.has('tempName') || changedProperties.has('open')) && typeof this.tempName === 'string') {
      const clippedName = this.tempName.slice(0, PLAYER_NAME_MAX_LENGTH);
      if (clippedName !== this.tempName) {
        this.tempName = clippedName;
      }
    }
  }

  getInputSelector() {
    return '.name-input';
  }

  _renderPlayerName() {
    return html`
      <div>
        <label>${t('label.playerName')}</label>
        <input 
          type="text" 
          class="name-input"
          .value=${this.tempName}
          maxlength=${PLAYER_NAME_MAX_LENGTH}
          @input=${this._onNameInput}
          @keydown=${this._onKeydown}
        />
      </div>`;
  }

  _onNameInput(e) {
    this.tempName = e.target.value.slice(0, PLAYER_NAME_MAX_LENGTH);
    e.target.value = this.tempName;
  }
  
  _onClose() {
    this.close();
  }
}


// Subclass for editing player name only
class EditNameModal extends PlayerNameModal {
  static properties = {
    ...super.properties,
    confirmDelete: { type: Boolean },
  };

  constructor() {
    super();
    this.tempName = '';
    this.confirmDelete = false;
  }

  async show({ player }) {
    this.player = player;
    this.tempName = player.name;
    this.confirmDelete = false;
    this.open = true;
    return new Promise(resolve => { this._resolver = resolve; });
  }

  close(result = null) {
    if (!this.open) return;
    this.open = false;
    this.confirmDelete = false;
    this.tempName = '';
    this._resolve(result);
  }

  renderContent() {
    return html`
      ${this._renderPlayerName()}
      <div class="modal-buttons">
        ${this._renderButtons()}
      </div>
    `;
  }

  _renderButtons() {
    if (this.confirmDelete) {
      return html`
        <button class="secondary" @click=${this._onCancelDelete}>${t('button.cancel')}</button>
        <button class="danger" @click=${this._onConfirmDelete}>${t('button.confirmDelete')}</button>
      `;
    } else {
      return html`
        <button class="secondary" @click=${this._onClose}>${t('button.cancel')}</button>
        <button class="primary" @click=${this._onSave}>${t('button.saveChanges')}</button>
        <button class="danger" @click=${this._onDelete}>${t('button.deletePlayer')}</button>
      `;
    }
  }

  _onEnter() {
    this._onSave();
  }

  _onEscape() {
    if (this.confirmDelete) {
      this._onCancelDelete();
    } else {
      this._onClose();
    }
  }

  _onDelete() {
    this.confirmDelete = true;
  }

  _onCancelDelete() {
    this.confirmDelete = false;
  }

  _onConfirmDelete() {
    if (!this.player) return;
    this.close({ action: 'delete', playerId: this.player.id });
  }

  _onSave() {
    const newName = this.tempName.trim().slice(0, PLAYER_NAME_MAX_LENGTH);
    if (this.player && newName) {
      this.close({ action: 'save', newName });
    } else {
      this.close(null);
    }
  }
}

class AddPlayerModal extends PlayerNameModal {
  static properties = {
    ...super.properties,
  };

  constructor() {
    super();
    this.tempName = '';
  }

  async show() {
    this.open = true;
    return new Promise(resolve => {
      this._resolver = resolve;
    });
  }

  close(result = {add: false, name: null}) {
    if (!this.open) return;
    this.open = false;
    this._resolve(result);
    this.tempName = '';
  }

  renderContent() {
    return html`
      ${this._renderPlayerName()}
      <div class="modal-buttons">
        <button class="secondary" @click=${this._onCancel}>${t('button.cancel')}</button>
        <button class="primary" @click=${this._onAdd}>${t('label.addPlayer')}</button>
      </div>
    `;
  }

  _onEnter() {
    this._onAdd();
  }

  _onEscape() {
    this._onClose();
  }

  _onCancel() {
    this.close();
  }

  _onAdd() {
    const name = this.tempName.trim().slice(0, PLAYER_NAME_MAX_LENGTH);
    this.close({ add: true, name: name });
  }
}

// Subclass for editing player score only
class EditScoreModal extends PlayerOptionsModal {
  static properties = {
    ...super.properties,
    tempScore: { type: Number },
  };

  constructor() {
    super();
    this.tempScore = 0;
  }

  async show({ player }) {
    this.player = player;
    this.tempScore = player.bankedScore;
    this.open = true;
    return new Promise(resolve => { this._resolver = resolve; });
  }

  close(result = null) {
    if (!this.open) return;
    this.open = false;
    this.tempScore = 0;
    this._resolve(result);
  }

  getInputSelector() {
    return '.score-input';
  }

  getTitle() {
    return "";
  }

  renderContent() {
    return html`
      <div>  
        <label>${t('label.playerScore')}</label>
        <input
          type="number"
          class="score-input"
          .value=${String(this.tempScore)}
          @input=${this._onScoreInput}
          @keydown=${this._onKeydown}
          placeholder=${t('label.scoreInputPlaceholder')}
          min="0"
        />
      </div>
      <div class="modal-buttons">
        <button class="secondary" @click=${this._onClose}>${t('button.cancel')}</button>
        <button class="primary" @click=${this._onSave}>${t('button.saveChanges')}</button>
      </div>
    `;
  }

  _onScoreInput(e) { 
    this.tempScore = e.target.value;
  }

  _onEnter() {
    this._onSave();
  }

  _onEscape() {
    this._onClose();
  }

  _onSave() {
    this.close({ action: 'save', newScore: Number(this.tempScore) });
  }

  _onClose() {
    this.close(null);
  }
}

customElements.define('edit-name-modal', EditNameModal);
customElements.define('edit-score-modal', EditScoreModal);
customElements.define('add-player-modal', AddPlayerModal);
