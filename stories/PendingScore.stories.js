import { html } from 'lit';
import { Game, Player } from '../src/model.js';
import '../src/pending-score.js';

export default {
  title: 'PendingScore',
  component: 'pending-score',
  tags: ['autodocs'],
  argTypes: {
    game: { control: false, description: 'Game model instance with players and rolls arrays' },
  },
};

export const Default = () => {
  const game = new Game([
    new Player('Player 1')
  ], ['2', '5', '3', '-100', '20', '70', 'TUP!', '40', '100', '-100']);
  return html`
    <div style="height: 90vh; width: 90vw; display: flex;">
      <pending-score .game=${game}></pending-score>
    </div>`;
};

export const Empty = () => {
  const game = new Game([
    new Player('Player 1')
  ], []);
  return html`
    <div style="height: 90vh; width: 90vw; display: flex;">
      <pending-score .game=${game}></pending-score>
    </div>`;
};

export const MixedValues = () => {
  const game = new Game([
    new Player('Player 1')
  ], ['1', '4', 'x2', '7']);
  return html`
    <div style="height: 90vh; width: 90vw; display: flex;">
      <pending-score .game=${game}></pending-score>
    </div>`;
};
