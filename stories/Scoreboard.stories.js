import { html } from 'lit-html';
import { Player } from '../src/model.js';
import '../src/score-board.js';

export default {
  title: 'Scoreboard',
  component: 'score-board',
};

export const Default = () => {
  const game = {
    players: [
      new Player('Alice', 100),
      new Player('Bob', 80),
      new Player('Charlie', 150),
      new Player('Dana', 550),
    ],
    rolls: [],
  };

  return html`
    <score-board .game=${game}></score-board>
  `;
};

export const EmptyGame = () => {
  const game = {
    players: [],
    rolls: [],
  };
  return html`
    <score-board .game=${game}></score-board>
  `;
};
