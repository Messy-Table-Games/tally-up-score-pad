import { LitElement, html, css, nothing } from 'lit';
import './modal-dialog.js';
import { t } from './i18n.js';

export class ConfirmDialog extends LitElement {
  static properties = {
    open: { type: Boolean, reflect: true },
    title: { type: String },
    message: { type: String },
    confirmLabel: { type: String, attribute: 'confirm-label' },
    cancelLabel: { type: String, attribute: 'cancel-label' },
    variant: { type: String },
    showCancel: { type: Boolean, attribute: 'show-cancel' },
  };

  static styles = css`
    modal-dialog {
      --modal-max-width: 480px;
    }

    .dialog-content {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 0;
    }

    .message {
      margin: 0;
      line-height: 1.4;
    }

    .actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      flex-wrap: wrap;
    }

    button {
      min-width: 120px;
      padding: 8px 16px;
      border: none;
      border-radius: 16px;
      font-size: 1em;
      cursor: pointer;
    }

    .secondary {
      background: #e7e7e7;
      color: #333;
    }

    .primary {
      background: #1976d2;
      color: #fff;
    }

    .danger {
      background: #d32f2f;
      color: #fff;
    }

    @media (max-width: 420px) {
      .actions {
        flex-direction: column-reverse;
        align-items: center;
        width: max-content;
        margin-left: auto;
        margin-right: auto;
      }

      button {
        width: 100%;
      }
    }
  `;

  constructor() {
    super();
    this.open = false;
    this.title = '';
    this.message = '';
    this.confirmLabel = t('button.ok');
    this.cancelLabel = t('button.cancel');
    this.variant = 'primary';
    this.showCancel = true;
    this._resolver = null;
    this._closeReason = null;
  }

  render() {
    return html`
      <modal-dialog
        ?open=${this.open}
        .mfs=${false}
        title=${this.title}
        @modal-close=${this._onModalClose}
      >
        <div class="dialog-content">
          ${this.message
            ? html`<p class="message">${this.message}</p>`
            : nothing}
          <slot></slot>
          <div class="actions">
            ${this.showCancel
              ? html`<button class="secondary" @click=${this._handleCancel}>${this.cancelLabel}</button>`
              : nothing}
            <button class=${this._confirmButtonClass()} @click=${this._handleConfirm}>
              ${this.confirmLabel}
            </button>
          </div>
        </div>
      </modal-dialog>
    `;
  }

  async show(options = {}) {
    this._closeReason = null;
    if (options.title) this.title = options.title;
    if (options.message !== undefined) this.message = options.message;
    if (options.confirmLabel) this.confirmLabel = options.confirmLabel;
    if (options.cancelLabel) this.cancelLabel = options.cancelLabel;
    if (options.variant) this.variant = options.variant;
    if (options.showCancel !== undefined) this.showCancel = options.showCancel;

    this.open = true;
    return new Promise(resolve => {
      this._resolver = resolve;
    });
  }

  close(result = false) {
    if (!this.open) return;
    this.open = false;
    this._resolve(result);
  }

  _handleConfirm() {
    this._closeReason = 'confirm';
    this.dispatchEvent(new CustomEvent('confirm-dialog-confirm', {
      bubbles: true,
      composed: true,
    }));
    this.close(true);
  }

  _handleCancel() {
    this._closeReason = 'cancel';
    this.dispatchEvent(new CustomEvent('confirm-dialog-cancel', {
      bubbles: true,
      composed: true,
    }));
    this.close(false);
  }

  _onModalClose() {
    if (this.open) {
      this.open = false;
    }
    if (this._closeReason === null) {
      this.dispatchEvent(new CustomEvent('confirm-dialog-dismissed', {
        bubbles: true,
        composed: true,
      }));
    }
    this._resolve(false);
    this._closeReason = null;
  }

  _confirmButtonClass() {
    return this.variant === 'danger' ? 'danger' : 'primary';
  }

  _resolve(value) {
    if (this._resolver) {
      this._resolver(value);
      this._resolver = null;
    }
  }
}

customElements.define('confirm-dialog', ConfirmDialog);
