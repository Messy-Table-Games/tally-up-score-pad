// Mock localStorage for Node.js
const gLocalStorage = new Map();

global.localStorage = {
  setItem: (key, value) => {
    //console.log(`localStorage.setItem: key=${key}, value=${value}`);
    gLocalStorage.set(key, value);
  },
  getItem: (key) => {
    const value = gLocalStorage.get(key) || null;
    //console.log(`localStorage.getItem: key=${key}, value=${value}`);
    return value;
  },
  removeItem: (key) => {
    //console.log(`localStorage.removeItem: key=${key}`);
    gLocalStorage.delete(key);
  }
};

import { ComputePendingRollScore, Player, Game, AddPlayerCommand, RemovePlayerCommand, ChangePlayerNameCommand, ChangePlayerStatusCommand, SetPendingScoreCommand, BankPendingScoreCommand, TallyUpCommand, AddScoreCommand, AddGameRollCommand, EndRoundCommand, BustRoundCommand, AppState } from '../src/model.js';

let gTestResults = {
  total: 0,
  passed: 0,
  failed: 0
};

function TestCondition(condition, message) {
  if (condition) {
    console.log(`${message}: \x1b[32mPASS\x1b[0m`);
    gTestResults.passed++;
  } else {
    console.log(`${message}: \x1b[31mFAIL\x1b[0m`);
    gTestResults.failed++;
  }
  gTestResults.total++;
}

// Map to store tests
const gTests = new Map();

// Function to register a test
function registerTest(name, func) {
  gTests.set(name, func);
}

// Test for ComputePendingRollScore
registerTest('testComputePendingRollScore', function() {
  const rolls = [1, 2, 3];
  const result = ComputePendingRollScore(rolls);
  TestCondition(result === 6, 'testComputePendingRollScore');
});

// Test for AddPlayerCommand
registerTest('testAddPlayerCommand', function() {
  const game = new Game();
  const cmd = new AddPlayerCommand(game);
  cmd.execute();
  TestCondition(game.players.length === 1 && game.players[0].name === 'Player 1', 'testAddPlayerCommand execute');
  // Test undo
  cmd.undo();
  TestCondition(game.players.length === 0, 'testAddPlayerCommand undo');
  // Test redo
  cmd.redo();
  TestCondition(game.players.length === 1 && game.players[0].name === 'Player 1', 'testAddPlayerCommand redo');
});

// Test for RemovePlayerCommand
registerTest('testRemovePlayerCommand', function() {
  const game = new Game();
  const player = new Player('Test Player');
  game.players.push(player);
  const cmd = new RemovePlayerCommand(game, player.id);
  cmd.execute();
  TestCondition(game.players.length === 0, 'testRemovePlayerCommand execute');
  // Test undo
  cmd.undo();
  TestCondition(game.players.length === 1 && game.players[0] === player, 'testRemovePlayerCommand undo');
  // Test redo
  cmd.redo();
  TestCondition(game.players.length === 0, 'testRemovePlayerCommand redo');
});

// Test for ChangePlayerNameCommand
registerTest('testChangePlayerNameCommand', function() {
  const player = new Player('Old Name');
  const cmd = new ChangePlayerNameCommand(player, 'New Name');
  cmd.execute();
  TestCondition(player.name === 'New Name', 'testChangePlayerNameCommand execute');
  // Test undo
  cmd.undo();
  TestCondition(player.name === 'Old Name', 'testChangePlayerNameCommand undo');
  // Test redo
  cmd.redo();
  TestCondition(player.name === 'New Name', 'testChangePlayerNameCommand redo');
});

// Test for ChangePlayerStatusCommand
registerTest('testChangePlayerStatusCommand', function() {
  const player = new Player('Test');
  const cmd = new ChangePlayerStatusCommand(player, 'out');
  cmd.execute();
  TestCondition(player.status === 'out', 'testChangePlayerStatusCommand execute');
  // Test undo
  cmd.undo();
  TestCondition(player.status === 'in', 'testChangePlayerStatusCommand undo');
  // Test redo
  cmd.redo();
  TestCondition(player.status === 'out', 'testChangePlayerStatusCommand redo');
});

// Test for SetPendingScoreCommand
registerTest('testSetPendingScoreCommand', function() {
  const player = new Player('Test');
  const cmd = new SetPendingScoreCommand(player, 50);
  cmd.execute();
  TestCondition(player.pendingScore === 50, 'testSetPendingScoreCommand execute');
  // Test undo
  cmd.undo();
  TestCondition(player.pendingScore === 0, 'testSetPendingScoreCommand undo');
  // Test redo
  cmd.redo();
  TestCondition(player.pendingScore === 50, 'testSetPendingScoreCommand redo');
});

// Test for BankPendingScoreCommand
registerTest('testBankPendingScoreCommand', function() {
  const player = new Player('Test', 0, 'in', 100);
  const cmd = new BankPendingScoreCommand(player);
  cmd.execute();
  TestCondition(player.bankedScore === 100 && player.pendingScore === 0, 'testBankPendingScoreCommand execute');
  // Test undo
  cmd.undo();
  TestCondition(player.bankedScore === 0 && player.pendingScore === 100, 'testBankPendingScoreCommand undo');
  // Test redo
  cmd.redo();
  TestCondition(player.bankedScore === 100 && player.pendingScore === 0, 'testBankPendingScoreCommand redo');
});

// Test for TallyUpCommand
registerTest('testTallyUpCommand', function() {
  const game = new Game();
  const player1 = new Player('Player1');
  const player2 = new Player('Player2');
  const player3 = new Player('Player3', 0, 'out');
  game.players.push(player1, player2, player3);
  const cmd = new TallyUpCommand(game, player1);
  cmd.execute();
  TestCondition(player1.bankedScore === 200 && player2.bankedScore === 100 && player3.bankedScore === 0 && game.rolls.includes('TUP!'), 'testTallyUpCommand execute');
  // Test undo
  cmd.undo();
  TestCondition(player1.bankedScore === 0 && player2.bankedScore === 0 && player3.bankedScore === 0 && !game.rolls.includes('TUP!'), 'testTallyUpCommand undo');
  // Test redo
  cmd.redo();
  TestCondition(player1.bankedScore === 200 && player2.bankedScore === 100 && player3.bankedScore === 0 && game.rolls.includes('TUP!'), 'testTallyUpCommand redo');
});

// Test for AddScoreCommand
registerTest('testAddScoreCommand', function() {
  const player = new Player('Test');
  const cmd = new AddScoreCommand(player, 25);
  cmd.execute();
  TestCondition(player.bankedScore === 25, 'testAddScoreCommand execute');
  // Test undo
  cmd.undo();
  TestCondition(player.bankedScore === 0, 'testAddScoreCommand undo');
  // Test redo
  cmd.redo();
  TestCondition(player.bankedScore === 25, 'testAddScoreCommand redo');
});

// Test for AddGameRollCommand
registerTest('testAddGameRollCommand', function() {
  const game = new Game();
  const player = new Player('Test');
  game.players.push(player);
  const cmd = new AddGameRollCommand(game, 5);
  cmd.execute();
  TestCondition(game.rolls.includes(5) && player.pendingScore === 5, 'testAddGameRollCommand execute');
  // Test undo
  cmd.undo();
  TestCondition(!game.rolls.includes(5) && player.pendingScore === 0, 'testAddGameRollCommand undo');
  // Test redo
  cmd.redo();
  TestCondition(game.rolls.includes(5) && player.pendingScore === 5, 'testAddGameRollCommand redo');
});

// Test for EndRoundCommand
registerTest('testEndRoundCommand', function() {
  const game = new Game();
  const player = new Player('Test', 0, 'in', 50);
  game.players.push(player);
  const cmd = new EndRoundCommand(game);
  cmd.execute();
  TestCondition(player.bankedScore === 50 && player.pendingScore === 0 && player.status === 'in' && game.rolls.length === 0, 'testEndRoundCommand execute');
  // Test undo
  cmd.undo();
  TestCondition(player.bankedScore === 0 && player.pendingScore === 50 && player.status === 'in' && game.rolls.length === 0, 'testEndRoundCommand undo');
  // Test redo
  cmd.redo();
  TestCondition(player.bankedScore === 50 && player.pendingScore === 0 && player.status === 'in' && game.rolls.length === 0, 'testEndRoundCommand redo');
});

// Test for BustRoundCommand
registerTest('testBustRoundCommand', function() {
  const game = new Game();
  const player = new Player('Test', 0, 'in', 50);
  game.players.push(player);
  const cmd = new BustRoundCommand(game);
  cmd.execute();
  TestCondition(player.pendingScore === 0 && player.status === 'in' && game.rolls.length === 0, 'testBustRoundCommand execute');
  // Test undo
  cmd.undo();
  TestCondition(player.pendingScore === 50 && player.status === 'in' && game.rolls.length === 0, 'testBustRoundCommand undo');
  // Test redo
  cmd.redo();
  TestCondition(player.pendingScore === 0 && player.status === 'in' && game.rolls.length === 0, 'testBustRoundCommand redo');
});

// Test for full AppState game flow with undo/redo
registerTest('testAppStateFullGameFlow', function() {
  const appState = new AppState({ storageKey: 'TUPTests' }); 

  const states = [];

  // Initial state
  states.push(appState.serialize());
  TestCondition(!appState.canUndo, 'testAppStateFullGameFlow - !canUndo at initial state');
  TestCondition(appState.canNext, 'testAppStateFullGameFlow - canNext at initial state');
  TestCondition(appState.canBust, 'testAppStateFullGameFlow - canBust at initial state');
  TestCondition(appState.canRoll, 'testAppStateFullGameFlow - canRoll at initial state');

  // Add three players
  appState.addPlayer();
  states.push(appState.serialize());
  TestCondition(appState.canUndo, 'testAppStateFullGameFlow - canUndo after appPlayer()');
  TestCondition(!appState.canNext, 'testAppStateFullGameFlow - !canNext after appPlayer()');
  TestCondition(!appState.canBust, 'testAppStateFullGameFlow - !canBust after appPlayer()');
  TestCondition(appState.canRoll, 'testAppStateFullGameFlow - canRoll after appPlayer()');

  appState.addPlayer();
  states.push(appState.serialize());
  appState.addPlayer();
  states.push(appState.serialize());

  // Add some rolls
  appState.addGameRoll(50);
  states.push(appState.serialize());
  TestCondition(!appState.canNext, 'testAppStateFullGameFlow - !canNext after addGameRoll(50)');
  TestCondition(appState.canBust, 'testAppStateFullGameFlow - canBust after addGameRoll(50)');
  TestCondition(appState.canRoll, 'testAppStateFullGameFlow - canRoll after addGameRoll(50)');
  appState.addGameRoll(30);
  states.push(appState.serialize());
  appState.addGameRoll(20);
  states.push(appState.serialize());

  // check scores after rolls
  TestCondition(appState.game.players[0].pendingScore === 100 && appState.game.players[1].pendingScore === 100 && appState.game.players[2].pendingScore === 100, 'testAppStateFullGameFlow - Pending scores after rolls');

  // Mark two players out
  appState.setPlayerStatus(appState.game.players[0], 'out');
  states.push(appState.serialize());
  appState.setPlayerStatus(appState.game.players[1], 'out');
  states.push(appState.serialize());

  // check banked scores
  TestCondition(appState.game.players[0].bankedScore === 100 && appState.game.players[1].bankedScore === 100 && appState.game.players[2].bankedScore === 0, 'testAppStateFullGameFlow - Banked scores after rolls');

  // Do a bust
  appState.bustGameRound();
  states.push(appState.serialize());
  TestCondition(!appState.canNext, 'testAppStateFullGameFlow - !canNext after bustGameRound()');
  TestCondition(!appState.canBust, 'testAppStateFullGameFlow - !canBust after bustGameRound()');
  TestCondition(appState.canRoll, 'testAppStateFullGameFlow - canRoll after bustGameRound()');

  // check scores after bust
  TestCondition(appState.game.players[0].bankedScore === 100 && appState.game.players[1].bankedScore === 100 && appState.game.players[2].bankedScore === 0, 'testAppStateFullGameFlow - Banked scores after bust');
  TestCondition(appState.game.players[0].pendingScore === 0 && appState.game.players[1].pendingScore === 0 && appState.game.players[2].pendingScore === 0, 'testAppStateFullGameFlow - Pending scores after bust');

  // Add a few more rolls
  appState.addGameRoll(40);
  states.push(appState.serialize());
  appState.addGameRoll(10);
  states.push(appState.serialize());

  // Mark everyone out
  appState.setPlayerStatus(appState.game.players[0], 'out');
  states.push(appState.serialize());
  appState.setPlayerStatus(appState.game.players[1], 'out');
  states.push(appState.serialize());
  appState.setPlayerStatus(appState.game.players[2], 'out');
  states.push(appState.serialize());
  TestCondition(appState.canNext, 'testAppStateFullGameFlow - canNext after set all players out');
  TestCondition(!appState.canBust, 'testAppStateFullGameFlow - !canBust after set all players out');
  TestCondition(!appState.canRoll, 'testAppStateFullGameFlow - !canRoll after set all players out');

  // Do next (end round)
  appState.endGameRound();
  states.push(appState.serialize());
  TestCondition(!appState.canNext, 'testAppStateFullGameFlow - !canNext after endGameRound()');
  TestCondition(!appState.canBust, 'testAppStateFullGameFlow - !canBust after endGameRound()');
  TestCondition(appState.canRoll, 'testAppStateFullGameFlow - canRoll after endGameRound()');

  // Add a roll
  appState.addGameRoll(60);
  states.push(appState.serialize());

  // Make one player out
  appState.setPlayerStatus(appState.game.players[0], 'out');
  states.push(appState.serialize());

  // check scores
  TestCondition(appState.game.players[0].bankedScore === 210 && appState.game.players[1].bankedScore === 150 && appState.game.players[2].bankedScore === 50, 'testAppStateFullGameFlow - Banked scores before Tally Up');
  TestCondition(appState.game.players[0].pendingScore === 60 && appState.game.players[1].pendingScore === 60 && appState.game.players[2].pendingScore === 60, 'testAppStateFullGameFlow - Pending scores before Tally Up');

  // Do a tally up
  appState.tallyUp(appState.game.players[0]);
  states.push(appState.serialize());

  // Verify final state
  TestCondition(appState.game.players.length === 3, 'testAppStateFullGameFlow - Expected 3 players');
  TestCondition(appState.game.players[0].bankedScore === 410 && appState.game.players[1].bankedScore === 250 && appState.game.players[2].bankedScore === 150, 'testAppStateFullGameFlow - Banked scores');
  TestCondition(appState.game.players[0].pendingScore === 60 && appState.game.players[1].pendingScore === 60 && appState.game.players[2].pendingScore === 60, 'testAppStateFullGameFlow - Pending scores');
  TestCondition(appState.game.players[0].status === 'out' && appState.game.players[1].status === 'in' && appState.game.players[2].status === 'in', 'testAppStateFullGameFlow - Player statuses');
  TestCondition(appState.game.rolls.length === 2 && appState.game.rolls[1] === 'TUP!', 'testAppStateFullGameFlow - Rolls');

  // End the round -- Note that in the UI this is prevented until all players are marked out.
  appState.endGameRound();
  states.push(appState.serialize());

  // check scores
  TestCondition(appState.game.players[0].bankedScore === 410 && appState.game.players[1].bankedScore === 310 && appState.game.players[2].bankedScore === 210, 'testAppStateFullGameFlow - Banked scores after endGameRound()');
  TestCondition(appState.game.players[0].pendingScore === 0 && appState.game.players[1].pendingScore === 0 && appState.game.players[2].pendingScore === 0, 'testAppStateFullGameFlow - Pending scores after endGameRound()');

  // Undo everything
  let stateIndex = states.length - 1;
  while (appState.canUndo) {
    appState.undo();
    stateIndex--;
    TestCondition(JSON.stringify(appState.serialize()) === JSON.stringify(states[stateIndex]), 'testAppStateFullGameFlow - state after undo');
    if (JSON.stringify(appState.serialize()) !== JSON.stringify(states[stateIndex])) return;
  }

  // redo not yet fully implemented
  // // Redo everything
  // while (appState.canRedo) {
  //   appState.redo();
  // }

  // // Check back to final state
  // const afterRedoState = appState.serialize();
  // if (JSON.stringify(afterRedoState) !== JSON.stringify(finalState)) {
  //   console.log('testAppStateFullGameFlow: \x1b[31mFAIL\x1b[0m - After redo, state not final');
  //   return;
  // }
});


// Run all tests
for (let [name, func] of gTests) {
  func();
}

// Pretty print test summary
console.log('\n\x1b[1mTest Results:\x1b[0m');
console.log(`  Total:  ${gTestResults.total}`);
console.log(`  Passed: \x1b[32m${gTestResults.passed}\x1b[0m`);
if (gTestResults.failed > 0) {
  console.log(`  Failed: \x1b[31m${gTestResults.failed}\x1b[0m\n`);
} else {
  console.log(`  Failed: ${gTestResults.failed}\n`);
}

