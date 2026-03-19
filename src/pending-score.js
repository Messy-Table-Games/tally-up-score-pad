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
      height: 34px;
      font-size: 16px;
      min-width: 100%;
    }

    .content {
      height: 100%;
      width: 100%;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-template-areas: "rolls rolls rolls sum";
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
      display: flex;
      justify-content: flex-end;
      align-items: center;
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
      width: 100%;
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }

    /* The new track that moves BOTH the real rolls and the ghosts */
    .moving-track {
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }
    
    .rolls {
      display: flex;
      gap: 0px;
      justify-content: flex-end;
      align-items: center;
    }

    /* Ghosts sit perfectly flush against the real rolls */
    #ghosts {
      display: flex;
      gap: 0px;
      justify-content: flex-start;
      align-items: center;
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
      flex-shrink: 0; 
    }
  `;

  constructor() {
    super();
    this.game = null;
    this._rolls = [];
    this._disposeAutorun = null;
    this._boundHandleTouchStart = this._handleTouchStart.bind(this);
    this._boundHandleTouchEnd = this._handleTouchEnd.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();
    let connecting = true;
    
    this._disposeAutorun = autorun(async () => {
      if (!this.game) return;
      
      const currentLength = this.game.rolls.length;
      
      if (connecting && this._rolls.length === 0) {
        this._rolls = [...this.game.rolls];
        connecting = false;
      } 
      else if (currentLength > this._rolls.length) {
        const rollsAdded = currentLength - this._rolls.length;
        this._rolls = [...this.game.rolls];
        await this.updateComplete; 

        const addedWidth = this._computeWidthOfEndPills(rollsAdded);
        if (addedWidth > 0) {
          const track = this.shadowRoot.querySelector('.moving-track');
          track.animate([
            { transform: `translateX(${addedWidth}px)` },
            { transform: 'translateX(0px)' }
          ], { duration: 300, easing: 'ease-out', composite: 'add' });
        }
      } 
      else if (currentLength < this._rolls.length) {
        const rollsRemoved = this._rolls.length - currentLength;
        
        // 1. Grab the pills BEFORE Lit destroys them
        const rollsDiv = this.shadowRoot.querySelector('.rolls');
        const ghostsDiv = this.shadowRoot.querySelector('#ghosts');
        const pills = Array.from(rollsDiv.querySelectorAll('.pill'));
        const removedPills = pills.slice(-rollsRemoved);

        // 2. Clone them, measure them, and put them in the ghost container
        let removedWidth = 0;
        const clones = removedPills.map(pill => {
          removedWidth += pill.offsetWidth + 4; // match margin-right
          return pill.cloneNode(true);
        });
        ghostsDiv.prepend(...clones);

        // 3. NOW tell Lit to update the DOM (it deletes the real pills)
        this._rolls = [...this.game.rolls];
        await this.updateComplete;

        // 4. Slide the entire track right (pushing the ghosts off screen)
        if (removedWidth > 0) {
          const track = this.shadowRoot.querySelector('.moving-track');
          const animation = track.animate([
            { transform: 'translateX(0px)' },
            { transform: `translateX(${removedWidth}px)` }
          ], { duration: 300, easing: 'ease-out', composite: 'add' });

          // 5. Delete the ghosts once the animation finishes
          animation.finished.then(() => {
            clones.forEach(clone => clone.remove());
          });
        }
      }
    });
    
    this.addEventListener('touchstart', this._boundHandleTouchStart, { passive: false });
    this.addEventListener('touchend', this._boundHandleTouchEnd, { passive: false });
  }

  disconnectedCallback() {
    if (this._disposeAutorun) {
      this._disposeAutorun();
      this._disposeAutorun = null;
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
  get sum() {
    return ComputePendingRollScore(this.game?.rolls || []);
  }

  _computeWidthOfEndPills(numPills) {
    const rollsDiv = this.shadowRoot.querySelector('.rolls');
    if (!rollsDiv) return 0;

    const pills = rollsDiv.querySelectorAll('.pill');
    let pillsWidth = 0;
    let endIndex = Math.max(pills.length - numPills, 0);
    for (let i = pills.length - 1; i >= endIndex; i--) {
      pillsWidth += pills[i].offsetWidth + 4; 
    }
    return pillsWidth;
  }

  render() {
    const hasRolls = this._rolls.length > 0;

    // Arbitrarily constrain to drawing only 30 rolls. This limits
    // rendering and the only time it would be noticeable is if someone
    // stretched the window across and ultrawide monitor and had more
    // then 50 rolls before a bust or everyone was out. Sinc it is removing
    // from the start, the most recent rolls are still visible
    const rollsToDraw = this._rolls.slice(-30);

    return html`
      <div class="content" role="region" aria-label="Pending score">
        <div class="rolls-container" aria-label="Pending rolls">
          <div class="bg-text ${hasRolls ? 'hidden' : ''}" aria-hidden="true">Rolls</div>
          <div class="roll-fade">
            <div class="moving-track">
              <div class="rolls">
                ${rollsToDraw.map((val) => html`<span class="pill">${val}</span>`)}
              </div>
              <div id="ghosts" aria-hidden="true"></div>
            </div>
          </div>
        </div>
        <div class="sum" aria-live="polite" aria-label="Total: ${this.sum}">${this.sum}</div>
      </div>
    `;
  }
}

customElements.define('pending-score', PendingScore);