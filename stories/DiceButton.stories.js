import { html } from 'lit';
import '../src/dice-button.js';

export default {
  title: 'DiceButton',
  tags: ['autodocs'],
  render: (args) => html`<dice-button .value=${args.value}></dice-button>`,
  argTypes: {
    value: {
      control: { type: 'text' },
      defaultValue: '10',
    },
  },
  args: { value: '10' },
};

export const Ten = {
  args: {
    value: '10',
  },
};

export const Seventy = {
  args: {
    value: '70',
  },
};

export const Hundred = {
  args: {
    value: '100',
  },
};
