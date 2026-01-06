import '../src/player-card.js';
import { Player } from '../src/model.js';

export default {
  title: 'PlayerCard',
  component: 'player-card',
  argTypes: {
    player: { control: 'object' },
  },
};


const Template = ({ player }) => {
  const el = document.createElement('player-card');
  el.player = player;
  return el;
};


export const Default = Template.bind({});
Default.args = {
  player: new Player('Alice', 300),
};


export const EmptyScores = Template.bind({});
EmptyScores.args = {
  player: new Player('Bob', 0),
};


export const ManyScores = Template.bind({});
ManyScores.args = {
  player: new Player('Charlie', 150),
};

export const PendingScore = Template.bind({});
PendingScore.args = {
  player: new Player('Dana', 1270, 'in', 30),
};


