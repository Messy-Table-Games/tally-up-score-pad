import { html } from 'lit-html';
import { AppState, Game, Player } from '../src/model.js';
import '../src/score-pad.js';

export default {
  title: 'ScorePad',
  component: 'score-pad',
};

export const Default = () => {
  const appState = new AppState();
  appState.game = new Game([
      new Player('Alice', 400),
      new Player('Bob', 120),
      new Player('Charlie', 80),
      new Player('Dana', 140),
      new Player('Eve', 110),
      new Player('Frank', 90),
      new Player('Grace', 1200)
    ],
    []
  );

  return html`
    <div style="height: 90vh; width: 90vw; display: flex;">
      <score-pad .appState=${appState}></score-pad>
    </div>
  `;
}
