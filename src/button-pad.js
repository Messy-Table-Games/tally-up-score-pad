import { LitElement, html, css } from 'lit';
import './dice-button.js';

export class ButtonPad extends LitElement {
  static properties = {
    canBust: { type: Boolean },
    canNext: { type: Boolean },
    canRoll: { type: Boolean },
  };

  static styles = css`
    :host {
      display: block;
      width: 100%;
      background: linear-gradient(180deg, #fcb948 0%, #f05023 100%);
      container-type: inline-size;
      container-name: button-pad;
    }

    .pad {
      width: 100%;
      min-width: 0;
      box-sizing: border-box;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .top-grid {
      display: grid;
      grid-template-columns: repeat(5, minmax(50px, 1fr));
      gap: 8px;
    }

    .bottom-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    @container button-pad (max-width: 300px) {
      .top-grid {
        grid-template-columns: repeat(4, minmax(50px, 1fr));
      }
    }

    @container button-pad (max-width: 240px) {
      .top-grid {
        grid-template-columns: repeat(3, minmax(50px, 1fr));
      }
    }
  `;

  constructor() {
    super();
    this.canBust = false;
    this.canNext = false;
    this.canRoll = false;
  }

  render() {
    return html`
    <div class="pad">
      <div class="top-grid">
        <dice-button value='10' ?disabled=${!this.canRoll}></dice-button>
        <dice-button value='20' ?disabled=${!this.canRoll}></dice-button>
        <dice-button value='30' ?disabled=${!this.canRoll}></dice-button>
        <dice-button value='40' ?disabled=${!this.canRoll}></dice-button>
        <dice-button value='50' ?disabled=${!this.canRoll}></dice-button>
        <dice-button value='60' ?disabled=${!this.canRoll}></dice-button>
        <dice-button value='70' ?disabled=${!this.canRoll}></dice-button>
        <dice-button value='100' ?disabled=${!this.canRoll}></dice-button>
        <dice-button value='-100' ?disabled=${!this.canRoll}></dice-button>
        <dice-button value='x2' ?disabled=${!this.canRoll}></dice-button>
      </div>
      <div class="bottom-row">
        <dice-button value='Bust' ?disabled=${!this.canBust}></dice-button>
        <dice-button value='Next' ?disabled=${!this.canNext}></dice-button>
      </div>
    </div>
    `;
  }
}

customElements.define('button-pad', ButtonPad);
