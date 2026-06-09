import '../src/in-out-button.js';

export default {
  title: 'InOutButton',
  component: 'in-out-button',
  tags: ['autodocs'],
  argTypes: {
    status: {
      control: { type: 'radio' },
      options: ['in', 'out'],
    },
  },
};

const Template = ({ status }) => {
  const el = document.createElement('in-out-button');
  el.status = status;
  el.addEventListener('inout-click', e => {
    alert(`Button clicked: status is ${e.detail.status}`);
  });
  return el;
};

export const In = Template.bind({});
In.args = {
  status: 'in',
};

export const Out = Template.bind({});
Out.args = {
  status: 'out',
};
