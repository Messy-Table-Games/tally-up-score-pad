import { makeAutoObservable, makeObservable, observable, action, computed } from 'mobx';

const DEFAULT_STORAGE_KEY = 'TallyUpModel';
const PLAYER_NAME_MAX_LENGTH = 50;

/**
 * Persists JSON data to localStorage under the provided key.
 * @param {object} data - The JSON-serializable data to store.
 * @param {string} storageKey - The localStorage key to write to.
 */
function saveToStorage(data, storageKey) {
  if (!storageKey) {
    return;
  }

  const text = JSON.stringify(data);
  localStorage.setItem(storageKey, text);
}

/**
 * Loads previously persisted application state JSON from localStorage.
 * Returns null if nothing is stored or the payload is empty.
 * @param {string} storageKey - The localStorage key to read from.
 * @returns {object|null} Parsed serialized state or null.
 */
function loadFromStorage(storageKey) {
  if (!storageKey) {
    return null;
  }

  const text = localStorage.getItem(storageKey);
  return text ? JSON.parse(text) : null;
}

/**
 * Removes any persisted application state associated with the given key.
 * @param {string} storageKey - The localStorage key to clear.
 */
function clearStorage(storageKey) {
  if (!storageKey) {
    return null;
  }

  localStorage.removeItem(storageKey);
}

/**
 * Generates a random UUID v4 compliant identifier
 * @returns {string} A randomly generated UUID string
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Computes the total score from an array of dice rolls, handling special values like 'x2'
 * @param {Array} rolls - Array of roll values (numbers, 'x2')
 * @returns {number} The calculated score after applying all modifiers
 */
export function ComputePendingRollScore(rolls) {
  let sum = 0;
  for (const roll of rolls) {
    if (typeof roll === 'string') {
      const txt = roll.trim().toLowerCase();
      if (txt === 'x2') {
        sum *= 2;
        continue;
      }
    }
    const val = Number(roll);
    if (!isNaN(val)) {
      sum += val;
    }
  }
  return sum;
}

/**
 * Command serialization and deserialization registry.
 * Maintains a global registry of command deserializers for reconstructing
 * command objects from stored JSON data during undo/redo operations.
 */
const gCommandDeserializers = {};

function registerCommandDeserializer(type, deserializer) {
  gCommandDeserializers[type] = deserializer;
}

function getCommandDeserializer(type) {
  return gCommandDeserializers[type];
}

function serializeCommand(cmd) {
  return cmd.serialize();
}

function deserializeCommand(cmdData, game) {
  const { type, data } = cmdData;

  const deserializer = getCommandDeserializer(type);
  if (deserializer) {
    return deserializer(data, game);
  } else {
    throw new Error(`Unknown command type: ${type}`);
  }
}

/**
 * Represents a player in the game including:
 *  - identity (id, name)
 *  - score (total score)
 *  - round participation status ('in' or 'out')
 *  - an in-progress pending score for the current round
 * Computed getters expose bankedScore (excluding pending if out) and totalScore.
 */
export class Player {
  constructor(name, score = 0, status = 'in', pendingScore = 0, id = null) {
    this.id = id || generateUUID();
    this.name = name;
    this.score = score;
    this.status = status;
    this.pendingScore = pendingScore;
    makeAutoObservable(this);
  }
  
  get bankedScore() {
    return this.status === 'out' ? this.score + Number(this.pendingScore || 0) : this.score;
  }

  get pendingTotalScore() {
    return this.score + Number(this.pendingScore || 0);
  }

  get hasPendingScore() {
    return Number(this.pendingScore) != 0;
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      status: this.status,
      pendingScore: this.pendingScore,
      score: this.score
    };
  }

  deserialize(data) {
    this.id = data.id;
    this.name = data.name;
    this.status = data.status;
    this.pendingScore = data.pendingScore;
    this.score = data.score;
  }
}

/**
 * Aggregates the current game state:
 *  - active dice rolls for the in-progress round (rolls)
 *  - player roster (players)
 * Provides helpers to compute pending roll score and detect if a round has no changes
 * (used to disable bust/end actions when nothing has happened).
 */
export class Game {
  constructor(players = [], rolls = []) {
    this.rolls = rolls;
    this.players = players;
    makeAutoObservable(this);
  }

  get pendingRollScore() {
    return ComputePendingRollScore(this.rolls);
  }

  get hasPendingRollScore() {
    return this.rolls.length > 0;
  }

  get noChanges() {
    if (this.rolls.length > 0 ) {
      return false;
    }

    for (const player of this.players) {
      if (player.hasPendingScore || player.status === 'out') {
        return false;
      }
    }

    return true;
  }

  get canBust() {
    if (this.players.length === 0) {
      return true; // Let's someone just use the scorepad without players
    }
    
    if (this.players.every(player => player.status === 'out')) {
      return false;
    }

    if (this.rolls.length > 0 ) {
      return true;
    }
    
    return false;
  }

  get canNext() {
    if (this.players.length === 0) {
      return true; // Let's someone just use the scorepad without players
    }
    return this.players.every(player => player.status === 'out');
  }

  get canRoll() {
    if (this.players.length === 0) {
      return true; // Let's someone just use the scorepad without players
    }
    return this.players.some(player => player.status === 'in');
  }
}

/**
 * Adds a new player to the game at the specified index or at the end
 * @param {Game} game - The game instance to add the player to
 * @param {Player} newPlayer - The player to add (optional, creates default if null)
 * @param {number} atIndex - Index to insert at (-1 for end)
 * @returns {Object} Object containing the index and player that was added
 */
function AddPlayer(game, newPlayer = null, atIndex = -1) {
  if (!newPlayer) {
    const defaultName = `Player ${game.players.length + 1}`;
    newPlayer = new Player(defaultName);
  }
  if (atIndex === -1) {
    game.players.push(newPlayer);
    atIndex = game.players.length - 1;
  } else {
    game.players.splice(atIndex, 0, newPlayer);
  }
  return { index: atIndex, player: newPlayer };
}

/**
 * Removes a player from the game by their ID
 * @param {Game} game - The game instance to remove the player from
 * @param {string} playerId - The ID of the player to remove
 * @returns {Object} Object containing the index and player that was removed
 */
function RemovePlayer(game, playerId) {
  const index = game.players.findIndex(p => p.id === playerId);
  let player = null;
  if (index > -1) {
    player = game.players.splice(index, 1)[0];
  }
  return { index, player };
}

/**
 * Maintains history for undo using a simple command pattern stack.
 */
class CommandStack {
  static MAX_LENGTH = 20;

  constructor(game, storagePrefix, afterCallback = null) {
    this.game = game;
    this._startIndex = 0;
    this._length = 0;
    this._storagePrefix = storagePrefix;
    this.afterCallback = afterCallback;

    if (this._storagePrefix) {
      try {
        this.loadState();
      } catch (error) {
        console.warn('Failed to load CommandStack:', error);
        this.clear();
      }
    } 

    makeObservable(this, {
      _length: observable,
      canUndo: computed,
      canRedo: computed,
    });
  }

  clear() {
    const numItems = Math.max(this._length, CommandStack.MAX_LENGTH);

    for (let n = this._startIndex; n < numItems; n++ ) {
      this.deleteCommand(n);
   }

   this._length = 0;
   this._startIndex = 0;

   this.saveState();
  }

  getStorageKey() {
    if (!this._storagePrefix) {
      return null;
    }
    return this._storagePrefix + '_cmd_stack';
  }

  saveState() {
    saveToStorage(this.serialize(), this.getStorageKey());
  }

  loadState() {
    const data = loadFromStorage(this.getStorageKey());
    if (data) {
      this.deserialize(data, this.game);
    }
  }


  get canUndo() {
    return this._length > 0;
  }

  get canRedo() {
    return false;
  }

  get undoConfirmationMessage() {
    if (this._length < 1) {
      return '';
    }

    try {
      const cmdIndex = this.getHeadIndex();
      const command = this.loadCommand(cmdIndex);
      return command?.undoConfirmationMessage || null;
    } catch (err) {
      //console.warn(`Error occurred getting undo description: ${err}`);
      return '';
    }
  }
  
  execute(command) {
    command.execute();

    const nextIndex = this.getNextIndexAndUpdate();
    this.saveCommand(nextIndex, command);
    this.afterCallback?.();
    this.saveState();
  }

  undo() {
    if (this._length < 1) 
      return;

    const cmdIndex = this.getHeadIndex();
    //console.log(`undo: cmdIndex = ${cmdIndex}`);
    try {
      const command = this.loadCommand(cmdIndex);
      this.deleteCommand(cmdIndex);
      this._length--;

      if (command) {
        command.undo();
      }

      this.afterCallback?.();
      this.saveState();
    } catch (err) {
      console.warn(`Error occurred during undo: ${err}`);
      this.clear();
    }
  }

  redo() {
    // Not implemented
  } 

  getHeadIndex() {
    return (this._startIndex + this._length - 1) % CommandStack.MAX_LENGTH; 
  }

  getNextIndexAndUpdate() {
    const nextIndex = (this._startIndex + this._length) % CommandStack.MAX_LENGTH;
    //console.log(`getNextIndexAndUpdate start: startIndex = ${this._startIndex}, length = ${this._length}, nextIndex = ${nextIndex}`);

    if (this._length < CommandStack.MAX_LENGTH) {
      this._length++;
    } else {
      this._startIndex = (nextIndex + 1) % CommandStack.MAX_LENGTH;
    }
    
    //console.log(`getNextIndexAndUpdate end: startIndex = ${this._startIndex}, length = ${this._length}`);
    return nextIndex;
  }

  getCmdStorageKey(cmdKey) {
    if (!this._storagePrefix) {
      return null;
    }

    return this._storagePrefix + '_cmd_' + cmdKey;
  }

  saveCommand(cmdIndex, cmd) {
    saveToStorage(serializeCommand(cmd), this.getCmdStorageKey(cmdIndex));
  }

  loadCommand(cmdIndex) {
    const data = loadFromStorage(this.getCmdStorageKey(cmdIndex));
    return deserializeCommand(data, this.game);
  }

  deleteCommand(cmdIndex) {
    clearStorage(this.getCmdStorageKey(cmdIndex));
  }

  serialize() {
    //console.log('serializing command stack');
    //console.log(`startIndex: ${this._startIndex}, length: ${this._length}`);
    return {
      startIndex: this._startIndex,
      length: this._length
    };
  }

  deserialize(data, game) {
    //console.log('deserializing command stack');
    //console.log(`startIndex: ${data.startIndex}, length: ${data.length}`);
    this._startIndex = data.startIndex;
    this._length = data.length;
  }
}

/**
 * Composite command container enabling grouped execute/undo/redo semantics,
 * preserving internal command ordering.
 */
export class CommandList {
  constructor() {
    this.commands = [];
  }

  execute(command) {
    command.execute();
    this.commands.push(command);
  }

  undoAll() {
    for (let i = this.commands.length - 1; i >= 0; i--) {
      this.commands[i].undo();
    }
  }

  redoAll() {
    for (const command of this.commands) {
      command.redo();
    }
  }

  serialize() {
    return this.commands.map(cmd => serializeCommand(cmd));
  }

  static deserialize(data, game) {
    const commandList = new CommandList();
    commandList.commands = data.map(cmdData => deserializeCommand(cmdData, game));
    return commandList;
  }
}

/**
 * Root observable application state. Coordinates:
 *  - Game domain model (players, rolls)
 *  - Command history (undo/redo via CommandStack)
 *  - Persistence to localStorage (optional via storageKey)
 * Exposes serialized state helpers and high-level intent methods (add player, add roll, end/bust round, etc.).
 */
export class AppState {
  constructor({ storageKey = DEFAULT_STORAGE_KEY } = {}) {
    this.game = new Game();
    this._storageKey = storageKey;
    this._commandStack = new CommandStack(this.game, this._storageKey, () => this.saveState());

    if (this._storageKey) {
      try {
        this.loadState();
      } catch (error) {
        console.warn('Failed to load AppState:', error);
        this.clear();
      }
    }
    
    makeObservable(this, {
      game: observable,
      clear: action,
      addPlayer: action,
      removePlayer: action,
      changePlayerName: action,
      setPlayerStatus: action,
      tallyUp: action,
      addPlayerScore: action,
      addGameRoll: action,
      bustGameRound: action,
      endGameRound: action,
      undo: action,
      redo: action,
      canUndo: computed,
      canRedo: computed,
      canBust: computed,
      canNext: computed,
      canRoll: computed
    });
  }

  serialize() {
    return {
      players: this.game.players.map(player => player.serialize()),
      rolls: this.game.rolls.slice()
    };
  }

  deserialize(state) {
    this.game.players = state.players.map(data => {
      const player = new Player();
      player.deserialize(data);
      return player;
    });
    this.game.rolls = state.rolls || [];
  }

  saveState() {
    saveToStorage(this.serialize(), this._storageKey);
  }

  loadState() {
    const data = loadFromStorage(this._storageKey);
    if (data) {
      this.deserialize(data);
    }
  }

  clear() {
    this.game.rolls = [];
    this.game.players.forEach(player => {
      player.score = 0;
      player.pendingScore = 0;
      player.status = 'in';
    });
    this._commandStack.clear();
    this.saveState();
  }

  addPlayer() {
    const command = new AddPlayerCommand(this.game);
    this._commandStack.execute(command);
  }

  removePlayer(playerId) {
    const command = new RemovePlayerCommand(this.game, playerId);
    this._commandStack.execute(command);
  }

  changePlayerName(player, newName) {
    const normalizedName = String(newName || '').trim().slice(0, PLAYER_NAME_MAX_LENGTH);
    if (!normalizedName || normalizedName === player.name) {
      return;
    }

    const command = new ChangePlayerNameCommand(player, normalizedName);
    this._commandStack.execute(command);
  }

  setPlayerStatus(player, newStatus) {
    const command = new ChangePlayerStatusCommand(player, newStatus);
    this._commandStack.execute(command);
  }

  tallyUp(player) {
    const command = new TallyUpCommand(this.game, player);
    this._commandStack.execute(command);
  }

  addPlayerScore(player, score) {
    const command = new AddScoreCommand(player, score);
    this._commandStack.execute(command);
  }

  addGameRoll(roll) {
    const command = new AddGameRollCommand(this.game, roll);
    this._commandStack.execute(command);
  }

  bustGameRound() {
    if (this.game.noChanges) {
      return; 
    }
    const command = new BustRoundCommand(this.game);
    this._commandStack.execute(command);
  }

  endGameRound() {
    if (this.game.noChanges) {
      return; 
    }
    const command = new EndRoundCommand(this.game);
    this._commandStack.execute(command);
  }

  undo() {
    this._commandStack.undo();
  }

  redo() {
    this._commandStack.redo();
  }

  get canUndo() {
    return this._commandStack.canUndo;
  }

  get canRedo() {
    return this._commandStack.canRedo;
  }

  get undoConfirmationMessage() {
    return this._commandStack.undoConfirmationMessage;
  }

  get canBust() {
    return this.game.canBust;
  }

  get canNext() {
    return this.game.canNext;
  }

  get canRoll() {
    return this.game.canRoll;
  }
}

/**
 * Command to add a new player to the game
 */
export class AddPlayerCommand {
  static name = 'AddPlayerCommand';

  constructor(game) {
    this.game = game;
    this.player = null;
    this.playerIndex = -1;
  }

  execute() {
    const playerInfo = AddPlayer(this.game);
    this.player = playerInfo.player;
    this.player.pendingScore = this.game.pendingRollScore;
    this.playerIndex = playerInfo.index;
  }

  undo() {
    const playerInfo = RemovePlayer(this.game, this.player.id);
    this.playerIndex = playerInfo.index;
  }

  redo() {
    AddPlayer(this.game, this.player, this.playerIndex);
  }

  get undoConfirmationMessage() {
    if (!this.player?.name) {
      return 'Undo adding a player?';
    }
    return `Undo adding ${this.player.name}?`;
  }

  serialize() {
    return {
      type: AddPlayerCommand.name,
      data: {
        playerId: this.player?.id,
        playerIndex: this.playerIndex
      }
    };
  }

  static deserialize(data, game) {
    const player = game.players.find(p => p.id === data.playerId);
    if (!player) return null;

    const cmd = new AddPlayerCommand(game);
    cmd.player = player;
    cmd.playerIndex = data.playerIndex;

    return cmd;
  }
}

registerCommandDeserializer(AddPlayerCommand.name, AddPlayerCommand.deserialize);

/**
 * Command to remove a player from the game
 */
export class RemovePlayerCommand {
  static name = 'RemovePlayerCommand';

  constructor(game, playerId, player = null, playerIndex = -1) {
    this.game = game;
    this.playerId = playerId;
    this.player = player;
    this.playerIndex = playerIndex;
  }

  execute() {
    const playerInfo = RemovePlayer(this.game, this.playerId);
    this.player = playerInfo.player;
    this.playerIndex = playerInfo.index;
  }

  undo() {
    if (this.player) {
      AddPlayer(this.game, this.player, this.playerIndex);
    }
  }

  redo() {
    if (this.player) {
      RemovePlayer(this.game, this.playerId);
    }
  }

  get undoConfirmationMessage() {
    if (!this.player?.name) {
      return 'Undo deleting a player?';
    }
    return `Undo deleting ${this.player.name}?`;
  }

  serialize() {
    return {
      type: RemovePlayerCommand.name,
      data: {
        playerId: this.playerId,
        playerIndex: this.playerIndex,
        player: this.player?.serialize()
      }
    };
  }

  static deserialize(data, game) {
    let player = game.players.find(p => p.id === data.playerId);
    if (!player) {
      player = new Player();
      player.deserialize(data.player);
    }

    return new RemovePlayerCommand(game, data.playerId, player, data.playerIndex);
  }
}

registerCommandDeserializer(RemovePlayerCommand.name, RemovePlayerCommand.deserialize);

/**
 * Command to change a player's name
 */
export class ChangePlayerNameCommand {
  static name = 'ChangePlayerNameCommand';

  constructor(player, newName) {
    this.player = player;
    this.oldName = player.name;
    this.newName = newName;
  }

  execute() {
    this.player.name = this.newName;
  }

  undo() {
    this.player.name = this.oldName;
  }

  redo() {
    this.execute();
  }

  get undoConfirmationMessage() {
    return `Undo setting player name to ${this.newName}?`;
  }

  serialize() {
    return {
      type: ChangePlayerNameCommand.name,
      data: {
        playerId: this.player.id,
        oldName: this.oldName,
        newName: this.newName
      }
    };
  }

  static deserialize(data, game) {
    const player = game.players.find(p => p.id === data.playerId);
    if (!player) return null;
    
    const cmd = new ChangePlayerNameCommand(player, data.newName);
    cmd.oldName = data.oldName;
    return cmd;
  }
}

registerCommandDeserializer(ChangePlayerNameCommand.name, ChangePlayerNameCommand.deserialize);

/**
 * Command to change a player's status (in/out)
 */
export class ChangePlayerStatusCommand {
  static name = 'ChangePlayerStatusCommand';

  constructor(player, newStatus) {
    this.player = player;
    this.newStatus = newStatus;
  }

  execute() {
    this.oldStatus = this.player.status;
    this.player.status = this.newStatus;
  }

  undo() {
    this.player.status = this.oldStatus;
  }

  redo() {
    this.execute();
  }

  get undoConfirmationMessage() {
    if (!this.player?.name) {
      return `Undo setting player status to ${this.newStatus.toUpperCase()}?`;
    }
    return `Undo setting ${this.player.name} to ${this.newStatus.toUpperCase()}?`;
  }

  serialize() {
    return {
      type: ChangePlayerStatusCommand.name,
      data: {
        playerId: this.player.id,
        oldStatus: this.oldStatus,
        newStatus: this.newStatus
      }
    };
  }

  static deserialize(data, game) {
    const player = game.players.find(p => p.id === data.playerId);
    if (!player) return null;
    
    const cmd = new ChangePlayerStatusCommand(player, data.newStatus);
    cmd.oldStatus = data.oldStatus;
    return cmd;
  }
}

registerCommandDeserializer(ChangePlayerStatusCommand.name, ChangePlayerStatusCommand.deserialize);

/**
 * Command to set a player's pending score
 */
export class SetPendingScoreCommand {
  static name = 'SetPendingScoreCommand';

  constructor(player, newPendingScore) {
    this.player = player;
    this.newPendingScore = newPendingScore;
  }

  execute() {
    this.oldPendingScore = this.player.pendingScore;
    this.player.pendingScore = this.newPendingScore;
  }

  undo() {
    this.player.pendingScore = this.oldPendingScore;
  }

  redo() {
    this.execute();
  }

  get undoConfirmationMessage() {
    return ''; // never shown to user because this command is called internally
  }

  serialize() {
    return {
      type: SetPendingScoreCommand.name,
      data: {
        playerId: this.player.id,
        oldPendingScore: this.oldPendingScore,
        newPendingScore: this.newPendingScore
      }
    };
  }

  static deserialize(data, game) {
    const player = game.players.find(p => p.id === data.playerId);
    if (!player) return null;
    
    const cmd = new SetPendingScoreCommand(player, data.newPendingScore);
    cmd.oldPendingScore = data.oldPendingScore;
    return cmd;
  }
}

registerCommandDeserializer(SetPendingScoreCommand.name, SetPendingScoreCommand.deserialize);

/**
 * Command to move a player's pending score to their banked scores
 */
export class BankPendingScoreCommand {
  static name = 'BankPendingScoreCommand';

  constructor(player) {
    this.player = player;
  }

  execute() {
    this.oldPendingScore = this.player.pendingScore;
    this.player.score += this.player.pendingScore;
    this.player.pendingScore = 0;
  }

  undo() {
    this.player.pendingScore = this.oldPendingScore;
    this.player.score -= this.oldPendingScore;
  }

  redo() {
    this.execute();
  }

  get undoConfirmationMessage() {
    return ''; // never shown to user because this command is called internally
  }

  serialize() {
    return {
      type: BankPendingScoreCommand.name,
      data: {
        playerId: this.player.id,
        oldPendingScore: this.oldPendingScore
      }
    };
  }

  static deserialize(data, game) {
    const player = game.players.find(p => p.id === data.playerId);
    if (!player) return null;

    const cmd = new BankPendingScoreCommand(player);
    cmd.oldPendingScore = data.oldPendingScore;
    return cmd;
  }
}

registerCommandDeserializer(BankPendingScoreCommand.name, BankPendingScoreCommand.deserialize);

/**
 * Command to handle Tally Up!
 */
export class TallyUpCommand {
  static name = 'TallyUpCommand';

  constructor(game, player) {
    this.game = game;
    this.player = player;
    this.commands = new CommandList();
  }

  execute() {
    let cmd = new AddScoreCommand(this.player, 200);
    this.commands.execute(cmd);

    this.game.players.forEach(player => {
      if (player.status === 'in' && player.id !== this.player.id) {
        cmd = new AddScoreCommand(player, 100);
        this.commands.execute(cmd);
      }
    });

    this.game.rolls.push('TUP!');
  }

  undo() {
    this.game.rolls.pop();
    this.commands.undoAll();
  }

  redo() {
    this.commands.redoAll();
    this.game.rolls.push('TUP!');
  }

  get undoConfirmationMessage() {
    return 'Undo Tally Up?';
  }

  serialize() {
    return {
      type: TallyUpCommand.name,
      data: {
        playerId: this.player.id,
        commands: this.commands.serialize()
      }
    };
  }

  static deserialize(data, game) {
    const player = game.players.find(p => p.id === data.playerId);
    if (!player) return null;
    
    const cmd = new TallyUpCommand(game, player);
    cmd.commands = CommandList.deserialize(data.commands, game);
    return cmd;
  }
}

registerCommandDeserializer(TallyUpCommand.name, TallyUpCommand.deserialize);

/**
 * Command to add a score directly to a player's banked scores
 */
export class AddScoreCommand {
  static name = 'AddScoreCommand';

  constructor(player, score) {
    this.player = player;
    this.score = score;
  }

  execute() {
    this.player.score += this.score;
  }

  undo() {
    this.player.score -= this.score;
  }
  
  redo() {
    this.execute();
  }

  get undoConfirmationMessage() {
    if (!this.player?.name) {
      return `Undo setting player's score?`;
    }
    return `Undo setting the score for ${this.player.name} to ${this.player.pendingTotalScore}?`;
  }

  serialize() {
    return {
      type: AddScoreCommand.name,
      data: {
        playerId: this.player.id,
        score: this.score
      }
    };
  }

  static deserialize(data, game) {
    const player = game.players.find(p => p.id === data.playerId);
    if (!player) return null;
    
    return new AddScoreCommand(player, data.score);
  }
}

registerCommandDeserializer(AddScoreCommand.name, AddScoreCommand.deserialize);

/**
 * Command to add a dice roll to the game and update all active players' pending scores
 */
export class AddGameRollCommand {
  static name = 'AddGameRollCommand';

  constructor(game, roll) {
    this.game = game;
    this.roll = roll;
    this.commands = new CommandList();
  }

  execute() {
    this.game.rolls.push(this.roll);
    const newPendingScore = this.game.pendingRollScore;
    this.game.players.forEach(player => {
      if (player.status === 'in') {
        const setPendingScoreCommand = new SetPendingScoreCommand(player, newPendingScore);
        this.commands.execute(setPendingScoreCommand);
      }
    });
  }

  undo() {
    this.commands.undoAll();
    this.game.rolls.pop();
  }

  redo() {
    this.game.rolls.push(this.roll);
    this.commands.redoAll();
  }

  get undoConfirmationMessage() {
    return `Undo dice roll of ${this.roll}?`;
  }

  serialize() {
    return {
      type: AddGameRollCommand.name,
      data: {
        roll: this.roll,
        commands: this.commands.serialize()
      }
    };
  }

  static deserialize(data, game) {
    const cmd = new AddGameRollCommand(game, data.roll);
    cmd.commands = CommandList.deserialize(data.commands, game);
    return cmd;
  }
}

registerCommandDeserializer(AddGameRollCommand.name, AddGameRollCommand.deserialize);

/**
 * Command to end the current round by banking all pending scores and resetting player statuses
 */
export class EndRoundCommand {
  static name = 'EndRoundCommand';

  constructor(game) {
    this.game = game;
    this.commands = new CommandList();
  }

  // Note on the rolls array: In order for Lit to update and mobx to track correctly,
  // we need to ensure that the rolls array is modified in a way that triggers reactivity
  // This is done by pushing new values rather than replacing the array entirely.

  execute() {
    this.oldRolls = [...this.game.rolls];
    
    this.game.players.forEach(player => {
      const bankPendingScoreCommand = new BankPendingScoreCommand(player);
      this.commands.execute(bankPendingScoreCommand);

      const changePlayerStatusCommand = new ChangePlayerStatusCommand(player, 'in');
      this.commands.execute(changePlayerStatusCommand);
    });

    this.game.rolls.length = 0;
  }

  undo() {
    this.game.rolls.length = 0;
    this.game.rolls.push(...this.oldRolls);
    this.commands.undoAll();
  }

  redo() {
    this.commands.redoAll();
    this.game.rolls.length = 0;
  }

  get undoConfirmationMessage() {
    return `Undo Next?`;
  }

  serialize() {
    return {
      type: EndRoundCommand.name,
      data: {
        oldRolls: this.oldRolls,
        commands: this.commands.serialize()
      }
    };
  }

  static deserialize(data, game) {
    const cmd = new EndRoundCommand(game);
    cmd.oldRolls = data.oldRolls || [];
    cmd.commands = CommandList.deserialize(data.commands, game);
    return cmd;
  }
}

registerCommandDeserializer(EndRoundCommand.name, EndRoundCommand.deserialize);


/**
 * Command to bust the current round by clearing pending scores for active players and ending the round
 */
export class BustRoundCommand {
  static name = 'BustRoundCommand';

  constructor(game) {
    this.game = game;
    this.commands = new CommandList();
  }

  execute() {
    this.game.players.forEach(player => {
      if (player.hasPendingScore && player.status === 'in') {
        const bustPendingScoreCommand = new SetPendingScoreCommand(player, 0);
        this.commands.execute(bustPendingScoreCommand);
      }
    });

    const endRoundCommand = new EndRoundCommand(this.game);
    this.commands.execute(endRoundCommand);
  }

  undo() {
    this.commands.undoAll();
  }

  redo() {
    this.commands.redoAll();
  }

  get undoConfirmationMessage() {
    return `Undo Bust?`;
  }

  serialize() {
    return {
      type: BustRoundCommand.name,
      data: {
        commands: this.commands.serialize()
      }
    };
  }

  static deserialize(data, game) {
    const cmd = new BustRoundCommand(game);
    cmd.commands = CommandList.deserialize(data.commands, game);
    return cmd;
  }
}

registerCommandDeserializer(BustRoundCommand.name, BustRoundCommand.deserialize);
