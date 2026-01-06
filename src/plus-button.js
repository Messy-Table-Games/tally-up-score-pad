import { LitElement, html, css } from 'lit';

export class PlusButton extends LitElement {
  static properties = {
    radius: { type: Number },
  };

  constructor() {
    super();
    this.radius = 16; // Default radius
  }
  static styles = css`
    .svg-btn {
      cursor: pointer;
      display: inline-block;
      border-radius: 50%;
      transition: filter 0.2s;
      outline: none;
      border: none;
      background: none;
      padding: 0;
    }
    .svg-btn:active {
      filter: brightness(0.8);
    }
    svg {
      display: block;
    }
  `;

  render() {
    const diameter = this.radius * 2;
    const plusThickness = Math.max(4, Math.round(this.radius * 0.24));
    const plusLength = Math.round(this.radius * 1.1);
    const center = this.radius;
    const rectOffset = center - plusThickness / 2;
    const rectStart = center - plusLength / 2;
    return html`
      <button
        class="svg-btn"
        style="width:${diameter}px;height:${diameter}px;"
        @click=${this._onClick}
        title="Add"
        aria-label="Add"
      >
        <svg
          viewBox="0 0 ${diameter} ${diameter}"
          width="${diameter}"
          height="${diameter}"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="${center}" cy="${center}" r="${this.radius}" fill="#1976d2" />
          <rect x="${rectOffset}" y="${rectStart}" width="${plusThickness}" height="${plusLength}" rx="${plusThickness/2}" fill="#fff" />
          <rect x="${rectStart}" y="${rectOffset}" width="${plusLength}" height="${plusThickness}" rx="${plusThickness/2}" fill="#fff" />
        </svg>
      </button>
    `;
  }

  _onClick() {
    this.dispatchEvent(new CustomEvent('plus-click', {
      bubbles: true,
      composed: true
    }));
  }
}

customElements.define('plus-button', PlusButton);
