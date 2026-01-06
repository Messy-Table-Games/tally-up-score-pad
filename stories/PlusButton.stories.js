import '../src/plus-button.js';

export default {
  title: 'PlusButton',
  component: 'plus-button',
};

const Template = () => {
  const el = document.createElement('plus-button');
  el.addEventListener('plus-click', () => {
    alert('Plus button clicked!');
  });
  return el;
};

export const Default = Template.bind({});
Default.storyName = 'Default';
