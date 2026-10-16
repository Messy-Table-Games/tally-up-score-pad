import { LitElement, html, css } from 'lit';

const TOAST_DURATION_MS = 1000;

/**
 * Brief, non-blocking message describing what an undo or redo just did,
 * so an accidental tap is noticed.
 */
export class UndoToast extends LitElement {
  static properties = {
    _message: { state: true },
    _visible: { state: true },
  };

  static styles = css`
    :host {
      display: block;
      pointer-events: none;
    }

    .toast {
      max-width: calc(100vw - 32px);
      margin: 0 16px;
      padding: 8px 14px;
      border-radius: 8px;
      background: #fffadd;
      color: #1a1310;
      border: 1px solid #f3dc92;
      font-size: 14px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      opacity: 0;
      transform: translateY(6px);
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .toast.visible {
      opacity: 1;
      transform: none;
    }
  `;

  constructor() {
    super();
    this._message = '';
    this._visible = false;
    this._timer = null;
  }

  show(message) {
    this._message = message;
    this._visible = true;
    clearTimeout(this._timer);
    this._timer = setTimeout(() => { this._visible = false; }, TOAST_DURATION_MS);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    clearTimeout(this._timer);
  }

  render() {
    return html`
      <div class="toast ${this._visible ? 'visible' : ''}" role="status" aria-live="polite">
        ${this._message}
      </div>
    `;
  }
}

customElements.define('undo-toast', UndoToast);
