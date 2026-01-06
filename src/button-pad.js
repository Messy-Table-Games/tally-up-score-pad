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
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-rows: repeat(3, 1fr);
      gap: 4px;
      width: 100%;
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
      <dice-button value='10' ?disabled=${!this.canRoll}></dice-button>
      <dice-button value='20' ?disabled=${!this.canRoll}></dice-button>
      <dice-button value='30' ?disabled=${!this.canRoll}></dice-button>
      <dice-button value='x2' ?disabled=${!this.canRoll}></dice-button>
      <dice-button value='40' ?disabled=${!this.canRoll}></dice-button>
      <dice-button value='50' ?disabled=${!this.canRoll}></dice-button>
      <dice-button value='60' ?disabled=${!this.canRoll}></dice-button>
      <dice-button value='Bust' ?disabled=${!this.canBust}></dice-button>
      <dice-button value='70' ?disabled=${!this.canRoll}></dice-button>
      <dice-button value='100' ?disabled=${!this.canRoll}></dice-button>
      <dice-button value='-100' ?disabled=${!this.canRoll}></dice-button>
      <dice-button value='Next' ?disabled=${!this.canNext}></dice-button>
    `;
  }
}

customElements.define('button-pad', ButtonPad);
