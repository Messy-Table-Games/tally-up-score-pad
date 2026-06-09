import '../src/tally-up-button.js';

export default {
  title: 'TallyUpButton',
  component: 'tally-up-button',
};

const Template = () => {
  const el = document.createElement('tally-up-button');
  el.addEventListener('tup-click', () => alert('TUP clicked!'));
  return el;
};

export const Default = Template.bind({});
Default.storyName = 'Default';
