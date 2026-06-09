import { html } from 'lit';
import { Player } from '../src/model.js';
import '../src/player-modals.js';

const mockPlayer = new Player('Alice', 100);

export default {
  title: 'PlayerModals',
};

export const EditName = () => html`
  <edit-name-modal
    .open=${true}
    .player=${mockPlayer}
    .tempName=${'Alice'}
  ></edit-name-modal>
`;

export const EditNameConfirmDelete = () => html`
  <edit-name-modal
    .open=${true}
    .player=${mockPlayer}
    .tempName=${'Alice'}
    .confirmDelete=${true}
  ></edit-name-modal>
`;

export const AddPlayer = () => html`
  <add-player-modal
    .open=${true}
  ></add-player-modal>
`;

export const EditScore = () => html`
  <edit-score-modal
    .open=${true}
    .player=${mockPlayer}
    .tempScore=${100}
  ></edit-score-modal>
`;
