import { html } from 'lit';
import '../src/app-view.js';
import { AppState } from '../src/model.js';

export default {
  title: 'AppView',
  component: 'app-view',
};

export const Default = () => {
  const appState = new AppState({ storageKey: 'TUPModelStorybook' });
  return html`
    <div style="height: 90vh; width: 90vw; display: flex;">
      <app-view .appState=${appState}></app-view>
    </div>
  `;
}