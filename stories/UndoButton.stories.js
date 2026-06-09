import { html } from 'lit';
import '../src/undo-button.js';

export default {
  title: 'UndoButton',
  tags: ['autodocs'],
  render: (args) => html`<undo-button ?disabled=${args.disabled}></undo-button>`,
  argTypes: {
    disabled: { control: { type: 'boolean' } },
  },
  args: { disabled: false },
};

export const Default = {};

export const Disabled = {
  args: { disabled: true },
};
