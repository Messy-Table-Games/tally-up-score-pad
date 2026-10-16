import '../src/button-pad.js';

export default {
  title: 'ButtonPad',
  component: 'button-pad',
};

export const Default = () => '<button-pad></button-pad>';

export const AllEnabled = () => '<button-pad canundo canredo canbust cannext canroll></button-pad>';
