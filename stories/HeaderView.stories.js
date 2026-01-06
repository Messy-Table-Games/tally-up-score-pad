import { html } from 'lit';
import '../src/header-view.js';

export default {
  title: 'HeaderView',
  component: 'header-view',
};

export const Default = () => html`
  <div style="width: 100%; border: 1px solid #ccc; background: lightblue;">
    <header-view></header-view>
  </div>
`;
