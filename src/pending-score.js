import { LitElement, html, css } from 'lit';
import { autorun } from 'mobx';
import { ComputePendingRollScore } from './model.js';

export class PendingScore extends LitElement {
  static properties = {
    game: { type: Object },
    _rolls: { type: Array },
    _rollsToDraw: { type: Array }
  }

  static styles = css`
    :host {
      box-sizing: border-box;
      height: 34px;
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
    }

    #hiddenRolls {
      position: absolute;
      visibility: hidden;
      pointer-events: none;
      left: 0;
      top: 0;
      display: flex;
      gap: 0px;
      white-space: nowrap;
    }

    .sum {
      box-sizing: border-box;
      height: 100%;
      width: 100%;
      overflow: hidden;
      font-weight: bold;
      display: inline-flex;
      align-items: center;
      justify-content: flex-end;
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
      padding: 0px 6px;
      margin-right: 4px;
      border: 1px solid #444;
      border-radius: 4px;
      background: #fff;
      color: #333;
      height: 20px;
    }
  `;

  constructor() {
    super();
    this.game = null;
    this._rolls = [];
    this._rollsToDraw = [];
    this._disposeAutorun = null;
    this._animationTimeout = null;
    this._resizeObserver = null;
    this._boundHandleTouchStart = this._handleTouchStart.bind(this);
    this._boundHandleTouchEnd = this._handleTouchEnd.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    let connecting = true;
    this._resizeObserver = new ResizeObserver(() => this._onResize());
    this._resizeObserver.observe(this);
    
    this._disposeAutorun = autorun(() => {
      if (this.game) {
        const currentLength = this.game.rolls.length;
        
        if (connecting && this._rolls.length === 0) {
          this._rolls = [...this.game.rolls];
          this._setRollsToDraw(this._rolls.length);
          connecting = false;
        } 
        else if (currentLength > this._rolls.length) {
          const rollsAdded = currentLength - this._rolls.length;
          this._rolls = [...this.game.rolls];
          this._animateNewRolls(rollsAdded);
        } 
        else if (currentLength < this._rolls.length) {
          const rollsRemoved = this._rolls.length - currentLength;
          this._animateRemovedRolls(rollsRemoved);
        }

        this.game.rolls;
      }
      this.requestUpdate();
    });
    
    // Prevent double tap zoom (touch-action manipulation does not work in this element for some reason)
    this.addEventListener('touchstart', this._boundHandleTouchStart, { passive: false });
    this.addEventListener('touchend', this._boundHandleTouchEnd, { passive: false });
  }

  disconnectedCallback() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    if (this._disposeAutorun) {
      this._disposeAutorun();
      this._disposeAutorun = null;
    }
    if (this._animationTimeout) {
      clearTimeout(this._animationTimeout);
      this._animationTimeout = null;
    }
    this.removeEventListener('touchstart', this._boundHandleTouchStart);
    this.removeEventListener('touchend', this._boundHandleTouchEnd);
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

  _onResize() {
    if (!this.shadowRoot) return;

    const rollsDiv = this.shadowRoot.querySelector('.rolls');
    if (!rollsDiv) return;

    const numPillsThatFit = this._computeNumPillsThatFit(rollsDiv.offsetWidth);
    if (this._rollsToDraw.length != numPillsThatFit) {
      this._setRollsToDraw(numPillsThatFit);
    }
  }

  _setRollsToDraw(numRolls) {
    this._rollsToDraw = this._rolls.slice(-numRolls);
  }

  get sum() {
    return ComputePendingRollScore(this.game?.rolls || []);
  }

  _computePillWidth(pill) {
    // const pillStyles = getComputedStyle(pill);
    // return pill.offsetWidth + 
    //     parseFloat(pillStyles.marginLeft || 0) + 
    //     parseFloat(pillStyles.marginRight || 0);
    return pill.offsetWidth + 4; // Avoids getComputedStyle and must match margin in .pill CSS
  }

  _computeNumPillsThatFit(widthToFit) {
    const hiddenRollsDiv = this.shadowRoot.querySelector('#hiddenRolls');
    if (!hiddenRollsDiv) return 0;

    const pills = hiddenRollsDiv.querySelectorAll('.pill');
    let pillsWidth = 0;
    let numPillsThatFit = 0;
    for (let i = pills.length - 1; i >= 0; i--) {
      pillsWidth += this._computePillWidth(pills[i]);

      numPillsThatFit++;
      if (pillsWidth > widthToFit) {
        break;
      }
    }

    return numPillsThatFit;
  }

  _computeWidthOfEndPills(numPills) {
    const hiddenRollsDiv = this.shadowRoot.querySelector('#hiddenRolls');
    if (!hiddenRollsDiv) return 0;

    const pills = hiddenRollsDiv.querySelectorAll('.pill');
    let pillsWidth = 0;
    let endIndex = Math.max(pills.length - numPills, 0);
    for (let i = pills.length - 1; i >= endIndex; i--) {
      pillsWidth += this._computePillWidth(pills[i]);
    }

    return pillsWidth;
  }

  _getElementXTransform(element) {
    const currentTransform = getComputedStyle(element).transform;
    let elementXTransform = 0;
    if (currentTransform && currentTransform !== 'none') {
      const matrix = new DOMMatrix(currentTransform);
      elementXTransform = matrix.m41; // Get the X translation value
    }
    return elementXTransform;
  }

  async _animateNewRolls(rollsAdded) {
    await this.updateComplete;
    let newPillsWidth = this._computeWidthOfEndPills(rollsAdded)
    if (newPillsWidth === 0) return;
    
    // Clear any existing animation timeout
    if (this._animationTimeout) {
      clearTimeout(this._animationTimeout);
      this._animationTimeout = null;
    }

    const rollsDiv = this.shadowRoot.querySelector('.rolls');

    // If there's an ongoing animation, get the current transform value
    let currentRollsXOffset = this._getElementXTransform(rollsDiv);
    
    // Calculate the new starting position
    const rollsXOffset = currentRollsXOffset + newPillsWidth;
    const rollsDivWidth = rollsDiv.offsetWidth;
    const rollsWidthNeeded = rollsDivWidth + rollsXOffset;

    const numPillsThatFit = this._computeNumPillsThatFit(rollsWidthNeeded);
    this._setRollsToDraw(numPillsThatFit);

    // Apply the new offset immediately without transition
    rollsDiv.style.transition = 'none';
    rollsDiv.style.transform = `translateX(${rollsXOffset}px)`;
    
    // Force reflow
    rollsDiv.offsetHeight;
    
    // Animate sliding
    rollsDiv.style.transition = 'transform 0.3s ease-out';
    rollsDiv.style.transform = 'translateX(0)';
    
    // Clean up after animation
    this._animationTimeout = setTimeout(() => {
      rollsDiv.style.transition = '';
      rollsDiv.style.transform = '';
      this._animationTimeout = null;
    }, 300);
  }

  async _animateRemovedRolls(rollsRemoved) {
    await this.updateComplete;
    let removedPillsWidth = this._computeWidthOfEndPills(rollsRemoved)
    if (removedPillsWidth === 0) return;
    
    // Clear any existing animation timeout
    if (this._animationTimeout) {
      clearTimeout(this._animationTimeout);
      this._animationTimeout = null;
    }

    const rollsDiv = this.shadowRoot.querySelector('.rolls');

    // Get the current transform value if there's an ongoing animation
    let currentRollsXOffset = this._getElementXTransform(rollsDiv);
    
    // For removal animation, we want to simulate the pills sliding right by the width of removed pills
    // Start from a position that's offset to the right by the width of the removed pills
    const endX = removedPillsWidth;
    const rollsDivWidth = rollsDiv.offsetWidth;
    const rollsWidthNeeded = rollsDivWidth + removedPillsWidth;

    let numPillsThatFit = this._computeNumPillsThatFit(rollsWidthNeeded);
    this._setRollsToDraw(numPillsThatFit);

    // Apply the starting position immediately without transition
    rollsDiv.style.transition = 'none';
    rollsDiv.style.transform = `translateX(${currentRollsXOffset}px)`;
    
    // Force reflow
    rollsDiv.offsetHeight;
    
    // Animate sliding
    rollsDiv.style.transition = 'transform 0.3s ease-out';
    rollsDiv.style.transform = `translateX(${endX}px)`;
    
    // Clean up after animation and reset position
    this._animationTimeout = setTimeout(() => {
      rollsDiv.style.transition = '';
      rollsDiv.style.transform = '';
      this._animationTimeout = null;
      this._rolls = [...this.game.rolls];
      numPillsThatFit = this._computeNumPillsThatFit(rollsDiv.offsetWidth);
      this._setRollsToDraw(numPillsThatFit);
    }, 300);
  }

  render() {
    const rollsArr = this.game?.rolls || [];

    return html`
      <div class="content" role="region" aria-label="Pending score">
        <div id="hiddenRolls" aria-hidden="true">
          ${this._rolls.map((val) => html`<span class="pill">${val}</span>`)}
        </div>
        <div class="rolls-container" aria-label="Pending rolls">
          <div class="bg-text ${rollsArr.length > 0 ? 'hidden' : ''}" aria-hidden="true">Rolls</div>
          <div class="roll-fade">
            <div class="rolls">
              ${this._rollsToDraw.map((val) => html`<span class="pill">${val}</span>`)}
            </div>
          </div>
        </div>
        <div class="sum" aria-live="polite" aria-label="Total: ${this.sum}">${this.sum}</div>
      </div>
    `;
  }
}

customElements.define('pending-score', PendingScore);
