import { AppState } from '../src/model.js';
import { TestCondition, registerTest } from './test_harness.js';

// Each test gets its own storage map so corrupt data cannot leak into other tests
function withStorage(storageMap, func, { failWrites = false } = {}) {
  const previous = global.localStorage;
  const previousWarn = console.warn;
  global.localStorage = {
    setItem: (key, value) => {
      if (failWrites) throw new Error('QuotaExceededError');
      storageMap.set(key, value);
    },
    getItem: (key) => storageMap.get(key) ?? null,
    removeItem: (key) => storageMap.delete(key),
  };
  // Recovery paths log warnings by design; keep test output readable
  console.warn = () => {};
  try {
    func();
  } finally {
    global.localStorage = previous;
    console.warn = previousWarn;
  }
}

const KEY = 'StorageTest';
const STACK_KEY = `${KEY}_cmd_stack`;
const cmdKey = (index) => `${KEY}_cmd_${index}`;

// Saves a small game: Alice and Bob, rolls 50 and 30, Bob renamed to Robert
function savedGame() {
  const storageMap = new Map();
  withStorage(storageMap, () => {
    const appState = new AppState({ storageKey: KEY });
    appState.addPlayer('Alice');
    appState.addPlayer('Bob');
    appState.addGameRoll('50');
    appState.addGameRoll('30');
    appState.changePlayerName(appState.game.players[1], 'Robert');
  });
  return storageMap;
}

function stackHeader(storageMap) {
  return JSON.parse(storageMap.get(STACK_KEY));
}

function setStackHeader(storageMap, header) {
  storageMap.set(STACK_KEY, JSON.stringify(header));
}

function gameJson(appState) {
  return JSON.stringify(appState.serialize());
}

registerTest('testStorageMalformedGame', function() {
  for (const [label, text] of [['malformed JSON', '{not json'], ['players not an array', '{"players": 5, "rolls": []}']]) {
    const storageMap = savedGame();
    storageMap.set(KEY, text);
    withStorage(storageMap, () => {
      let appState = null;
      try {
        appState = new AppState({ storageKey: KEY });
      } catch (err) {
        // Reported by the condition below
      }
      TestCondition(appState !== null, `testStorageMalformedGame - ${label} loads without throwing`);
      TestCondition(appState?.game.players.length === 0, `testStorageMalformedGame - ${label} gives an empty game`);
      TestCondition(appState && !appState.canUndo && !appState.canRedo, `testStorageMalformedGame - ${label} clears undo/redo`);
    });
  }
});

registerTest('testStorageMissingPlayerFields', function() {
  const storageMap = new Map();
  storageMap.set(KEY, JSON.stringify({ players: [{ id: 'p1', name: 'Alice', status: 'in' }], rolls: [] }));
  withStorage(storageMap, () => {
    const appState = new AppState({ storageKey: KEY });
    const player = appState.game.players[0];
    TestCondition(player.score === 0, 'testStorageMissingPlayerFields - missing score defaults to 0');
    TestCondition(player.pendingScore === 0, 'testStorageMissingPlayerFields - missing pendingScore defaults to 0');
  });
});

registerTest('testStorageMalformedStackHeader', function() {
  const storageMap = savedGame();
  storageMap.set(STACK_KEY, '{not json');
  withStorage(storageMap, () => {
    const appState = new AppState({ storageKey: KEY });
    TestCondition(appState.game.players.length === 2, 'testStorageMalformedStackHeader - game kept');
    TestCondition(!appState.canUndo && !appState.canRedo, 'testStorageMalformedStackHeader - no undo/redo');
  });
});

registerTest('testStorageMissingUndoSlot', function() {
  for (const [label, corrupt] of [
    ['missing slot', (storageMap, head) => storageMap.delete(cmdKey(head))],
    ['unknown command type', (storageMap, head) => storageMap.set(cmdKey(head), JSON.stringify({ type: 'NoSuchCommand', data: {} }))],
  ]) {
    const storageMap = savedGame();
    const header = stackHeader(storageMap);
    corrupt(storageMap, header.startIndex + header.length - 1);
    withStorage(storageMap, () => {
      const appState = new AppState({ storageKey: KEY });
      const before = gameJson(appState);
      let threw = false;
      try {
        appState.undo();
      } catch (err) {
        threw = true;
      }
      TestCondition(!threw, `testStorageMissingUndoSlot - ${label}: undo does not throw`);
      TestCondition(gameJson(appState) === before, `testStorageMissingUndoSlot - ${label}: game unchanged`);
      TestCondition(!appState.canUndo && !appState.canRedo, `testStorageMissingUndoSlot - ${label}: history cleared`);
    });
  }
});

registerTest('testStorageCommandForMissingPlayer', function() {
  const storageMap = savedGame();
  const header = stackHeader(storageMap);
  const head = header.startIndex + header.length - 1;
  const rename = JSON.parse(storageMap.get(cmdKey(head)));
  rename.data.playerId = 'no-such-player';
  storageMap.set(cmdKey(head), JSON.stringify(rename));
  withStorage(storageMap, () => {
    const appState = new AppState({ storageKey: KEY });
    const before = gameJson(appState);
    appState.undo();
    // The unloadable command is skipped; the rest of the history still works
    TestCondition(gameJson(appState) === before, 'testStorageCommandForMissingPlayer - skipped command changes nothing');
    TestCondition(appState.game.players[1].name === 'Robert', 'testStorageCommandForMissingPlayer - rename not reverted');
    appState.undo();
    TestCondition(appState.game.rolls.length === 1, 'testStorageCommandForMissingPlayer - next undo reverts the previous roll');
  });
});

registerTest('testStorageMissingRedoSlot', function() {
  const storageMap = savedGame();
  withStorage(storageMap, () => {
    new AppState({ storageKey: KEY }).undo();
  });
  const header = stackHeader(storageMap);
  storageMap.delete(cmdKey(header.startIndex + header.length));
  withStorage(storageMap, () => {
    const appState = new AppState({ storageKey: KEY });
    TestCondition(appState.canRedo, 'testStorageMissingRedoSlot - redo offered from header');
    const before = gameJson(appState);
    let threw = false;
    try {
      appState.redo();
    } catch (err) {
      threw = true;
    }
    TestCondition(!threw, 'testStorageMissingRedoSlot - redo does not throw');
    TestCondition(gameJson(appState) === before, 'testStorageMissingRedoSlot - game unchanged');
    TestCondition(!appState.canRedo, 'testStorageMissingRedoSlot - redo cleared');
  });
});

registerTest('testStorageStackHeaderOutOfRange', function() {
  const variants = [
    ['negative length', { startIndex: 0, length: -1, redoLength: 0 }],
    ['length above max', { startIndex: 0, length: 21, redoLength: 0 }],
    ['startIndex at max', { startIndex: 20, length: 1, redoLength: 0 }],
    ['negative startIndex', { startIndex: -1, length: 1, redoLength: 0 }],
    ['negative redoLength', { startIndex: 0, length: 1, redoLength: -1 }],
    ['length plus redoLength above max', { startIndex: 0, length: 15, redoLength: 6 }],
    ['fractional length', { startIndex: 0, length: 1.5, redoLength: 0 }],
    ['string length', { startIndex: 0, length: '3', redoLength: 0 }],
  ];
  for (const [label, header] of variants) {
    const storageMap = savedGame();
    setStackHeader(storageMap, header);
    withStorage(storageMap, () => {
      const appState = new AppState({ storageKey: KEY });
      TestCondition(appState.game.players.length === 2, `testStorageStackHeaderOutOfRange - ${label}: game kept`);
      TestCondition(!appState.canUndo && !appState.canRedo, `testStorageStackHeaderOutOfRange - ${label}: treated as corrupt`);
    });
  }
});

registerTest('testStorageClearAfterWrap', function() {
  const storageMap = new Map();
  withStorage(storageMap, () => {
    const appState = new AppState({ storageKey: KEY });
    for (let i = 0; i < 25; i++) {
      appState.addGameRoll('10');
    }
    TestCondition(appState._commandStack._startIndex !== 0, 'testStorageClearAfterWrap - stack wrapped');
    appState.clear();
  });
  const leftovers = [...storageMap.keys()].filter(key => /_cmd_\d+$/.test(key));
  TestCondition(leftovers.length === 0, `testStorageClearAfterWrap - clear removes every command slot (left: ${leftovers.length})`);
});

registerTest('testStorageWritesFail', function() {
  withStorage(new Map(), () => {
    let appState = null;
    let threw = false;
    try {
      appState = new AppState({ storageKey: KEY });
      appState.addPlayer('Alice');
      appState.addGameRoll('50');
      appState.undo();
    } catch (err) {
      threw = true;
    }
    TestCondition(!threw, 'testStorageWritesFail - actions do not throw when storage cannot be written');
    TestCondition(appState?.game.players.length === 1, 'testStorageWritesFail - game still updates in memory');
  }, { failWrites: true });
});
