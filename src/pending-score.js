import { LitElement, html, css } from 'lit';
import { autorun } from 'mobx';
import { ComputePendingRollScore } from './model.js';

export class PendingScore extends LitElement {
  static properties = {
    game: { type: Object },
    _rolls: { type: Array }
  }

  static styles = css`
    :host {
      box-sizing: border-box;
      height: 34.5px;
      font-size: 16px;
      min-width: 100%;
    }

    .content {
      height: 100%;
      width: 100%;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-areas:
          "rolls rolls rolls sum";
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
      z-index: 1;
    }

    .bg-text {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
      user-select: none;
      font-weight: 800;
      font-size: 16px;
      letter-spacing: 0.06em;
      color: #000;
      opacity: 0.2;
      z-index: 0;
      text-align: center;
      transition: opacity 0.25s ease;
    }

    .bg-text.hidden {
      opacity: 0;
    }

    .rolls-container {
      box-sizing: border-box;
      height: 100%;
      overflow: hidden;
      align-content: center;
      padding: 0px 0px;
      border: 2px solid #e1e1e1;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.95);
      position: relative;
      grid-area: rolls;
    }

    .roll-fade {
      -webkit-mask-image: linear-gradient(to right, transparent 4px, black 16px);
      mask-image: linear-gradient(to right, transparent 4px, black 16px);
    }
    
    .rolls {
      display: flex;
      gap: 0px;
      justify-content: flex-end;
      will-change: transform;
    }

    .sum {
      box-sizing: border-box;
      height: 100%;
      width: 100%;
      overflow: hidden;
      font-weight: bold;
      align-content: center;
      text-align: right;
      padding: 0 6px 0 0;
      border: 2px solid #e1e1e1;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.95);
      grid-area: sum;
    }
    
    .pill {
      font-weight: bold;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0px 4px;
      margin-right: 4px;
      border: 1px solid #444;
      border-radius: 4px;
      background: #fff;
      color: #222;
    }
  `;

  constructor() {
    super();
    this.game = null;
    this._rolls = [];
    this._disposeAutorun = null;
    this._animationTimeout = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._disposeAutorun = autorun(() => {
      if (this.game) {
        const currentLength = this.game.rolls.length;
        
        // Check if new rolls were added
        if (currentLength > this._rolls.length) {
          const rollsAdded = currentLength - this._rolls.length;
          this._rolls = [...this.game.rolls];
          // Use requestAnimationFrame to ensure DOM is updated
          requestAnimationFrame(() => {
            this._animateNewRolls(rollsAdded);
          });
        }
        // Check if rolls were removed (undo)
        else if (currentLength < this._rolls.length) {
          const rollsRemoved = this._rolls.length - currentLength;
          // Use requestAnimationFrame to ensure DOM is updated
          requestAnimationFrame(() => {
            this._animateRemovedRolls(rollsRemoved);
          });
        }

        this.game.rolls;
      }
      this.requestUpdate();
    });
    
    // Prevent double tap zoom (touch-action manipulation does not work in this element for some reason)
    this.addEventListener('touchstart', this._handleTouchStart.bind(this), { passive: false });
    this.addEventListener('touchend', this._handleTouchEnd.bind(this), { passive: false });
  }

  disconnectedCallback() {
    if (this._disposeAutorun) {
      this._disposeAutorun();
      this._disposeAutorun = null;
    }
    if (this._animationTimeout) {
      clearTimeout(this._animationTimeout);
      this._animationTimeout = null;
    }
    this.removeEventListener('touchstart', this._handleTouchStart);
    this.removeEventListener('touchend', this._handleTouchEnd);
    super.disconnectedCallback();
  }

  // Prevent double tap zoom
  _handleTouchStart(event) {
    event.preventDefault();
  }

  // Prevent double tap zoom
  _handleTouchEnd(event) {
    event.preventDefault();
  }

  get sum() {
    //const rollsArr = this.game && Array.isArray(this.game.rolls) ? this.game.rolls : [];
    return ComputePendingRollScore(this.game.rolls);
  }

  _animateNewRolls(rollsAdded) {
    const rollsContainer = this.shadowRoot.querySelector('.rolls-container');
    const rollsDiv = this.shadowRoot.querySelector('.rolls');
    
    if (!rollsContainer || !rollsDiv) return;
    
    // Calculate total width of all new pills
    let totalWidth = 0;
    const pills = rollsDiv.querySelectorAll('.pill');
    
    // Get width of the newly added pills (they are at the end)
    for (let i = pills.length - 1; i >= pills.length - rollsAdded; i--) {
      const pill = pills[i];
      const pillStyles = getComputedStyle(pill);
      totalWidth += pill.offsetWidth + 
        parseFloat(pillStyles.marginLeft || 0) + 
        parseFloat(pillStyles.marginRight || 0);
    }
    
    // Add gap width between pills (except for the last one)
    // if (rollsAdded > 0) {
    //   totalWidth += (rollsAdded - 1) * 2; // 2px gap between pills
    // }
    
    if (totalWidth === 0) return;
    
    // Clear any existing animation timeout
    if (this._animationTimeout) {
      clearTimeout(this._animationTimeout);
      this._animationTimeout = null;
    }
    
    // If there's an ongoing animation, get the current transform value
    const currentTransform = getComputedStyle(rollsDiv).transform;
    let currentX = 0;
    if (currentTransform && currentTransform !== 'none') {
      const matrix = new DOMMatrix(currentTransform);
      currentX = matrix.m41; // Get the X translation value
    }
    
    // Calculate the new starting position
    const newStartX = -currentX - totalWidth;

    // Apply the new offset immediately without transition
    rollsDiv.style.transition = 'none';
    rollsDiv.style.transform = `translateX(${-newStartX}px)`;
    
    // Force reflow
    rollsDiv.offsetHeight;
    
    // Animate to show all new pills
    rollsDiv.style.transition = 'transform 0.3s ease-out';
    rollsDiv.style.transform = 'translateX(0)';
    
    // Clean up after animation
    this._animationTimeout = setTimeout(() => {
      rollsDiv.style.transition = '';
      rollsDiv.style.transform = '';
      this._animationTimeout = null;
    }, 300);
  }

  _animateRemovedRolls(rollsRemoved) {
    const rollsContainer = this.shadowRoot.querySelector('.rolls-container');
    const rollsDiv = this.shadowRoot.querySelector('.rolls');
    
    if (!rollsContainer || !rollsDiv) return;
    
    // Clear any existing animation timeout
    if (this._animationTimeout) {
      clearTimeout(this._animationTimeout);
      this._animationTimeout = null;
    }

    let totalWidth = 0;
    const pills = rollsDiv.querySelectorAll('.pill');
    
    // Check if pills is a valid NodeList or array-like object
    if (!pills || typeof pills.length !== 'number' || pills.length === 0) return;

    // Get width of the removed pills (they are at the end)
    for (let i = pills.length - 1; i >= pills.length - rollsRemoved; i--) {
      const pill = pills[i];
      const pillStyles = getComputedStyle(pill);
      totalWidth += pill.offsetWidth + 
        parseFloat(pillStyles.marginLeft || 0) + 
        parseFloat(pillStyles.marginRight || 0);
    }
    
    if (totalWidth === 0) return;
    
    // Get the current transform value if there's an ongoing animation
    const currentTransform = getComputedStyle(rollsDiv).transform;
    let currentX = 0;
    if (currentTransform && currentTransform !== 'none') {
      const matrix = new DOMMatrix(currentTransform);
      currentX = matrix.m41; // Get the X translation value
    }
    
    // For removal animation, we want to simulate the pills sliding left by the width of removed pills
    // Start from a position that's offset to the right by the width of the removed pills
    const startX = totalWidth;

    // Apply the starting position immediately without transition
    rollsDiv.style.transition = 'none';
    rollsDiv.style.transform = `translateX(${currentX}px)`;
    
    // Force reflow
    rollsDiv.offsetHeight;
    
    // Animate sliding to the left to the natural position
    rollsDiv.style.transition = 'transform 0.3s ease-out';
    rollsDiv.style.transform = `translateX(${startX}px)`;
    
    // Clean up after animation and reset position
    this._animationTimeout = setTimeout(() => {
      rollsDiv.style.transition = '';
      rollsDiv.style.transform = '';
      this._animationTimeout = null;
      this._rolls = [...this.game.rolls];
    }, 300);
  }

  render() {
    return html`
      <div class="content">
        <div class="rolls-container">
          <div class="bg-text ${this.game.rolls.length > 0 ? 'hidden' : ''}" aria-hidden="true">Rolls</div>
          <div class="roll-fade">
            <div class="rolls">
              ${this._rolls.map((_, i, arr) => {
                const idx = i;
                const val = arr[idx];
                return html`<span class="pill" key="${idx}">${val}</span>`;
              })}
            </div>
          </div>
        </div>
        <div class="sum">${this.sum}</div>
      </div>
    `;
  }
}

customElements.define('pending-score', PendingScore);
