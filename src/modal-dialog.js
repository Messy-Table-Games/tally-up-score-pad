import { LitElement, html, css } from 'lit';
import { t } from './i18n.js';

class ModalDialog extends LitElement {
  static properties = {
    open: { type: Boolean, reflect: true },
    title: { type: String },
    mfs: { type: Boolean, reflect: true }
  };

  static styles = css`
    dialog {
      padding: 0;
      border: none;
      border-radius: 12px;
      max-width: min(90vw, var(--modal-max-width, 90vw));
      max-height: 90vh;
      width: 100%;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }

    dialog::backdrop {
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(2px);
    }

    .modal-content {
      padding: var(--modal-content-padding, 20px);
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #eee;
      padding-bottom: 12px;
    }

    .modal-header h2 {
      margin: 0;
      padding-left: 4px;
      font-size: 1rem;
      font-weight: bold;
    }

    .close-button {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      padding: 0 0 0 4px;
      border-radius: 4px;
      min-height: 44px; /* iOS touch target minimum */
      min-width: 44px;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      transition: background-color 0.2s;
    }

    .close-button:hover {
      background-color: #f5f5f5;
    }

    .close-button:active {
      background-color: #e5e5e5;
    }

    .close-button:focus {
      outline: none;
    }

    .close-button:focus-visible {
      outline: 2px solid #0b5fff;
      outline-offset: 2px;
    }

    @media (hover: none) and (pointer: coarse) {
      .close-button:focus-visible {
        outline: none;
      }
    }

    .modal-body {
      flex: 1;
      overflow-y: auto;
    }

    /* Mobile-specific optimizations */
    @media (max-width: 768px) {
      :host([mfs]) dialog {
        margin: 0;
        max-width: 100vw;
        max-height: 100vh;
        border-radius: 0;
      }

      :host([mfs]) .modal-content {
        min-height: 100vh;
      }
    }
  `;

  get _dialog() {
    return this.renderRoot?.querySelector('dialog');
  }

  constructor() {
    super();
    this.open = false;
    this.title = '';
    this.mfs = true;
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.open) queueMicrotask(() => this._applyOpen());
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  updated(changed) {
    if (changed.has('open')) this._applyOpen();
  }

  _applyOpen() {
    const dlg = this._dialog;
    if (!dlg) return;
    if (this.open) {
      if (!dlg.open) {
        try {
          dlg.showModal();
        } catch {
          if (!dlg.open) dlg.setAttribute('open', '');
        }
      }
    } else {
      if (dlg.open) dlg.close();
    }
  }

  render() {
    const showHeader = Boolean(this.title && this.title.trim());
    return html`
      <dialog @click=${this._onBackdropClick} @close=${this._onClose}>
        <div class="modal-content" @click=${this._stopPropagation}>
          ${showHeader
            ? html`
                <div class="modal-header">
                  <h2>${this.title}</h2>
                  <button class="close-button" @click=${this.close} aria-label=${t('button.close')}>×</button>
                </div>
              `
            : null}
          <div class="modal-body">
            <slot></slot>
          </div>
        </div>
      </dialog>
    `;
  }

  openModal() {
    this.open = true;
  }

  close() {
    if (!this.open) return;
    this.open = false;
    this.dispatchEvent(new CustomEvent('modal-close'));
  }

  _onBackdropClick(e) {
    if (e.target === this._dialog) this.close();
  }

  _onClose() {
    // Ensure property reflects native user actions (ESC, etc.)
    if (this.open) this.open = false;
  }

  _stopPropagation(e) {
    e.stopPropagation();
  }
}

customElements.define('modal-dialog', ModalDialog);
