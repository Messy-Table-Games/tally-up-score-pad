import { LitElement, html, css } from 'lit';
import './modal-dialog.js';

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
        order: 2;
      }
      .modal-buttons .danger {
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

  _onSave() {
    // Subclasses should override this
  }

  _onClose() {
    // Subclasses should override this
  }
}

// Subclass for editing player name only
class PlayerNameModal extends PlayerOptionsModal {
  static properties = {
    ...super.properties,
    tempName: { type: String },
    confirmDelete: { type: Boolean },
  };

  constructor() {
    super();
    this.tempName = '';
    this.confirmDelete = false;
  }

  getInputSelector() {
    return '.name-input';
  }

  getTitle() {
    return "";
  }

  renderContent() {
    return html`
      <div>
        <label>Player Name:</label>
        <input 
          type="text" 
          class="name-input"
          .value=${this.tempName}
          @input=${this._onNameInput}
          @keydown=${this._onKeydown}
        />
      </div>
      <div class="modal-buttons">
        ${this.confirmDelete
          ? html`
              <button class="secondary" @click=${this._onCancelDelete}>Cancel</button>
              <button class="danger" @click=${this._onConfirmDelete}>Confirm Delete</button>
            `
          : html`
              <button class="secondary" @click=${this._onClose}>Cancel</button>
              <button class="primary" @click=${this._onSave}>Save Changes</button>
              <button class="danger" @click=${this._onDelete}>Delete Player</button>
            `}
      </div>
    `;
  }

  _onNameInput(e) {
    this.tempName = e.target.value;
  }

  _onKeydown(e) {
    if (e.key === 'Enter') {
      this._onSave();
    } else if (e.key === 'Escape') {
      if (this.confirmDelete) {
        this._onCancelDelete();
      } else {
        this._onClose();
      }
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
    this.dispatchEvent(new CustomEvent('player-delete', {
      detail: { playerId: this.player.id },
      bubbles: true,
      composed: true,
    }));
    this._onClose();
  }

  _onSave() {
    const newName = this.tempName.trim();
    if (this.player && newName) {
      this.dispatchEvent(new CustomEvent('player-name-save', {
        detail: { player: this.player, newName }, 
        bubbles: true,
        composed: true,
      }));
    }
    this._onClose();
  }

  _onClose() {
    this.confirmDelete = false;
    this.dispatchEvent(new CustomEvent('player-name-close', {
      bubbles: true,
      composed: true,
    }));
  }
}

// Subclass for editing player score only
class PlayerScoreModal extends PlayerOptionsModal {
  static properties = {
    ...super.properties,
    tempScore: { type: Number },
  };

  constructor() {
    super();
    this.tempScore = 0;
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
        <label>Player Score:</label>
        <input 
          type="number" 
          class="score-input"
          .value=${String(this.tempScore)}
          @input=${this._onScoreInput}
          @keydown=${this._onKeydown}
          placeholder="Score"
          min="0"
        />
      </div>
      <div class="modal-buttons">
        <button class="secondary" @click=${this._onClose}>Cancel</button>
        <button class="primary" @click=${this._onSave}>Save Changes</button>
      </div>
    `;
  }

  _onScoreInput(e) { 
    this.tempScore = e.target.value;
  }

  _onKeydown(e) {
    if (e.key === 'Enter') {
      this._onSave();
    } else if (e.key === 'Escape') {
      this._onClose();
    }
  }

  _onSave() {
    const newScore = this.tempScore;
    if (this.player) {
      this.dispatchEvent(new CustomEvent('player-score-save', {
        detail: { player: this.player, newScore }, 
        bubbles: true,
        composed: true,
      }));
    }
    this._onClose();
  }

  _onClose() {
    this.dispatchEvent(new CustomEvent('player-score-close', {
      bubbles: true,
      composed: true,
    }));
  }
}

customElements.define('player-name-modal', PlayerNameModal);
customElements.define('player-score-modal', PlayerScoreModal);