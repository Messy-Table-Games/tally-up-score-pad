import { ComputePendingRollScore, Player, Game, AddPlayerCommand, RemovePlayerCommand, ChangePlayerNameCommand, ChangePlayerStatusCommand, SetPendingScoreCommand, BankPendingScoreCommand, TallyUpCommand, AddScoreCommand, AddGameRollCommand, EndRoundCommand, BustRoundCommand, AppState } from '../src/model.js';
import { isValidBuildNumber } from '../src/build-checker.js';
import { TestCondition, registerTest } from './test_harness.js';
import fs from 'fs';

// Mock localStorage for Node.js
const gLocalStorage = new Map();

function injectLocalStorage(storageMap) {
  global.localStorage = {
    setItem: (key, value) => {
      //console.log(`localStorage.setItem: key=${key}, value=${value}`);
      storageMap.set(key, value);
    },
    getItem: (key) => {
      const value = storageMap.get(key) || null;
      //console.log(`localStorage.getItem: key=${key}, value=${value}`);
      return value;
    },
    removeItem: (key) => {
      //console.log(`localStorage.removeItem: key=${key}`);
      storageMap.delete(key);
    }
  };  
}

injectLocalStorage(gLocalStorage);

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

registerTest('testAddPlayerCommandWithName', function() {
  const game = new Game();
  const cmd = new AddPlayerCommand(game, 'Alice');
  cmd.execute();
  TestCondition(game.players.length === 1, 'testAddPlayerCommandWithName execute length');
  TestCondition(game.players[0].name === 'Alice', 'testAddPlayerCommandWithName execute name');
  cmd.undo();
  TestCondition(game.players.length === 0, 'testAddPlayerCommandWithName undo');
  cmd.redo();
  TestCondition(game.players.length === 1 && game.players[0].name === 'Alice', 'testAddPlayerCommandWithName redo');
});

registerTest('testAddPlayerCommandNullName', function() {
  const game = new Game();
  const cmd = new AddPlayerCommand(game, null);
  cmd.execute();
  TestCondition(game.players.length === 1, 'testAddPlayerCommandNullName execute length');
  TestCondition(game.players[0].name === 'Player 1', 'testAddPlayerCommandNullName default name');
});

registerTest('testAddPlayerCommandViaAppState', function() {
  const appState = new AppState({ storageKey: 'testAddPlayerCommandViaAppState' });
  appState.addPlayer('Bob');
  TestCondition(appState.game.players.length === 1, 'testAddPlayerCommandViaAppState length');
  TestCondition(appState.game.players[0].name === 'Bob', 'testAddPlayerCommandViaAppState name');
  appState.undo();
  TestCondition(appState.game.players.length === 0, 'testAddPlayerCommandViaAppState undo');
});

registerTest('testAddPlayerCommandSerializeDeserialize', function() {
  const game = new Game();
  const cmd = new AddPlayerCommand(game, 'Carol');
  cmd.execute();
  TestCondition(game.players[0].name === 'Carol', 'testAddPlayerCommandSerializeDeserialize execute name');
  const serialized = cmd.serialize();
  const restored = AddPlayerCommand.deserialize(serialized.data, game);
  TestCondition(restored !== null, 'testAddPlayerCommandSerializeDeserialize deserialize non-null');
  restored.undo();
  TestCondition(game.players.length === 0, 'testAddPlayerCommandSerializeDeserialize undo after deserialize');
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

registerTest('testChangePlayerNameMaxLength', function() {
  const appState = new AppState({ storageKey: 'testChangePlayerNameMaxLength' });
  appState.addPlayer();

  const player = appState.game.players[0];
  const longName = '12345678901234567890123456789012345678901234567890EXTRA';
  appState.changePlayerName(player, longName);

  TestCondition(player.name.length === 50, 'testChangePlayerNameMaxLength length');
  TestCondition(player.name === '12345678901234567890123456789012345678901234567890', 'testChangePlayerNameMaxLength value');
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

// Test for ComputePendingRollScore with various roll combinations
registerTest('testComputePendingRoll', function() {
  TestCondition(ComputePendingRollScore([]) === 0, 'testComputePendingRoll - empty rolls');
  TestCondition(ComputePendingRollScore([1, 2, 3]) === 6, 'testComputePendingRoll - basic integers');
  TestCondition(ComputePendingRollScore([50]) === 50, 'testComputePendingRoll - num 50');
  TestCondition(ComputePendingRollScore(['50']) === 50, 'testComputePendingRoll - string 50');
  TestCondition(ComputePendingRollScore(['10', '20', '30']) === 60, 'testComputePendingRoll - numeric strings');
  TestCondition(ComputePendingRollScore([' 10 ', ' 20 ', '30 ']) === 60, 'testComputePendingRoll - trimmed numeric strings');
  TestCondition(ComputePendingRollScore(['20','30', '-100']) === -50, 'testComputePendingRoll - negative');
  TestCondition(ComputePendingRollScore([100, 'junk', null, undefined, {}, []]) === 100, 'testComputePendingRoll - ignores non-numeric values');
  TestCondition(ComputePendingRollScore(['70', '100', 'X2']) === 340, 'testComputePendingRoll - x2');
  TestCondition(ComputePendingRollScore([50, 'X2']) === 100, 'testComputePendingRoll - x2 uppercase modifier');
  TestCondition(ComputePendingRollScore([50, ' x2 ']) === 100, 'testComputePendingRoll - x2 with surrounding spaces');
  TestCondition(ComputePendingRollScore(['x2', 25]) === 25, 'testComputePendingRoll - x2 before first numeric roll');
  TestCondition(ComputePendingRollScore([10, 'x2', 'x2']) === 40, 'testComputePendingRoll - multiple x2 modifiers');
  TestCondition(ComputePendingRollScore(['70', '100', 'x2', '-100']) === 240, 'testComputePendingRoll - mixed sequence');
  TestCondition(ComputePendingRollScore(['10', '20', '30', '40', '50', '60', '70', '100', 'X2', '-100']) === 660, 'testComputePendingRoll - everything');
});

registerTest('testRemovePlayerRestoresScores', function() {
  const appState = new AppState({ storageKey: 'testRemovePlayerRestoresScores' });
  appState.addPlayer();
  const player = appState.game.players[0];
  
  appState.addGameRoll(50);
  TestCondition(player.bankedScore === 0 && player.pendingScore === 50, 'testRemovePlayerRestoresScores - pending score after roll');
  
  appState.setPlayerStatus(player, 'out');
  TestCondition(player.bankedScore === 50 && player.pendingScore === 50, 'testRemovePlayerRestoresScores - scores after marking out');
  
  appState.removePlayer(player.id);
  TestCondition(appState.game.players.length === 0, 'testRemovePlayerRestoresScores - player removed');
  
  appState.undo();
  TestCondition(appState.game.players.length === 1, 'testRemovePlayerRestoresScores - player restored after undo remove');
  const restoredPlayer = appState.game.players[0];
  TestCondition(restoredPlayer.bankedScore === 50 && restoredPlayer.pendingScore === 50, 'testRemovePlayerRestoresScores - scores restored after undo remove');
  
  appState.undo();
  TestCondition(restoredPlayer.bankedScore === 0 && restoredPlayer.pendingScore === 50, 'testRemovePlayerRestoresScores - scores restored after undo out');
});

registerTest('testNOPBustAndNext', function() {
  const appState = new AppState({ storageKey: 'testNOPBustAndNext' }); 
  appState.bustGameRound();
  TestCondition(appState._commandStack._length === 0, 'testNOPBustAndNext - bustGameRound with no changes');
  appState.endGameRound();
  TestCondition(appState._commandStack._length === 0, 'testNOPBustAndNext - endGameRound with no changes');
  appState.addPlayer();
  appState.bustGameRound();
  TestCondition(appState._commandStack._length === 1, 'testNOPBustAndNext - bustGameRound with no changes');
  appState.endGameRound();
  TestCondition(appState._commandStack._length === 1, 'testNOPBustAndNext - endGameRound with no changes');
});

registerTest('testCan', function() {
  const appState = new AppState({ storageKey: 'testCan' }); 
  // The game explicitly allows for next and bust to work with no players
  // effectively making the score pad a simple pending roll calculator
  TestCondition(appState.game.noChanges, 'testCan - noChanges at initial state');
  TestCondition(!appState.canUndo, 'testCan - canUndo at initial state');
  TestCondition(appState.canNext, 'testCan - canNext at initial state');
  TestCondition(appState.canBust, 'testCan - canBust at initial state');
  TestCondition(appState.canRoll, 'testCan - canRoll at initial state');
  appState.addPlayer();
  appState.addPlayer();
  TestCondition(appState.game.noChanges, 'testCan - noChanges after add player');
  TestCondition(appState.canUndo, 'testCan - canUndo after addPlayer');
  TestCondition(!appState.canNext, 'testCan - !canNext after addPlayer');
  TestCondition(!appState.canBust, 'testCan - !canBust after addPlayer');
  TestCondition(appState.canRoll, 'testCan - canRoll after addPlayer');
  appState.setPlayerStatus(appState.game.players[0], 'out');
  appState.setPlayerStatus(appState.game.players[1], 'out');
  TestCondition(appState.canNext, 'testCan - canNext after set player 1 and 2 to out no rolls');
  TestCondition(!appState.canBust, 'testCan - !canBust after set player 1 and 2 to out no rolls');
  TestCondition(!appState.canRoll, 'testCan - !canRoll after set player 1 and 2 to out no rolls');
  appState.undo();
  appState.undo();
  appState.tallyUp(appState.game.players[0]);
  TestCondition(!appState.game.noChanges, 'testCan - !noChanges after Tally Up');
  TestCondition(!appState.canNext, 'testCan - !canNext after Tally Up');
  TestCondition(appState.canBust, 'testCan - canBust after Tally Up');
  TestCondition(appState.canRoll, 'testCan - canRoll after Tally Up');
  appState.addGameRoll(50);
  TestCondition(!appState.game.noChanges, 'testCan - !noChanges after add roll');
  TestCondition(!appState.canNext, 'testCan - !canNext after addGameRoll');
  TestCondition(appState.canBust, 'testCan - canBust after addGameRoll');
  TestCondition(appState.canRoll, 'testCan - canRoll after addGameRoll');
  appState.setPlayerStatus(appState.game.players[0], 'out');
  TestCondition(!appState.game.noChanges, 'testCan - !noChanges after setPlayer 0 Status');
  TestCondition(!appState.canNext, 'testCan - !canNext after setPlayer 0 Status');
  TestCondition(appState.canBust, 'testCan - canBust after setPlayer 0 Status');
  TestCondition(appState.canRoll, 'testCan - canRoll after setPlayer 0 Status');
  appState.setPlayerStatus(appState.game.players[1], 'out');
  TestCondition(!appState.game.noChanges, 'testCan - !noChanges after setPlayer 1 Status');
  TestCondition(appState.canNext, 'testCan - canNext after setPlayer 1 Status');
  TestCondition(!appState.canBust, 'testCan - !canBust after setPlayer 1 Status');
  TestCondition(!appState.canRoll, 'testCan - !canRoll after setPlayer 1 Status');
});

registerTest('testSchema', function() {
  const rollsFile = 'tests/v1_rolls.json';
  const bustedFile = 'tests/v1_busted.json';
  const endedFile = 'tests/v1_ended.json';

  function loadTestJson(file) {
    if (fs.existsSync(file)) {
      const loadedStorage = new Map();
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      Object.entries(data).forEach(([key, value]) => {
        loadedStorage.set(key, value);
      });
      return loadedStorage;
    }

    return null;
  }

  function saveTestJson(dataMap, file) {
    const dataObj = Object.fromEntries(dataMap);
    fs.writeFileSync(file, JSON.stringify(dataObj, null, 2), 'utf8');
  }
  
  let rollsMap = loadTestJson(rollsFile);
  if (!rollsMap) {
    rollsMap = new Map();
    injectLocalStorage(rollsMap);

    const appState = new AppState();
    appState.addPlayer();
    appState.addPlayer();
    appState.changePlayerName(appState.game.players[0], 'Alice');
    appState.changePlayerName(appState.game.players[1], 'Bob');
    appState.addGameRoll('10');
    appState.addGameRoll('20');
    appState.addGameRoll('30');
    appState.setPlayerStatus(appState.game.players[1], 'out');
    appState.addGameRoll('40');
    appState.addGameRoll('50');
    appState.addGameRoll('60');
    appState.addGameRoll('70');
    appState.addGameRoll('100');
    appState.addGameRoll('x2');
    appState.addGameRoll('-100');
    appState.tallyUp(appState.game.players[1]);
    appState.addPlayerScore(appState.game.players[0], 100);

    saveTestJson(rollsMap, rollsFile);
    rollsMap = loadTestJson(rollsFile);

    injectLocalStorage(rollsMap);
  } else {
    injectLocalStorage(rollsMap);
  }

  TestCondition(rollsMap !== null, 'testSchema - loaded rollsMap is not null');
  let appState = new AppState();

  TestCondition(appState._storageKey === 'TallyUpModel', 'testSchema - test schema has expected storage key');
  TestCondition(appState.game, 'testSchema - test schema has game');
  TestCondition(appState.game.players.length === 2, 'testSchema - test schema game has expected number of players');
  TestCondition(appState.game.players[0].status === 'in', 'testSchema - player 0 is in');
  TestCondition(appState.game.players[1].status === 'out', 'testSchema - player 1 is out');
  TestCondition(appState.game.rolls.length === 11, 'testSchema - game has expected number of rolls');
  TestCondition(appState.game.rolls[0] === '10', 'testSchema - game rolls[0] is 10');
  TestCondition(appState.game.rolls[1] === '20', 'testSchema - game rolls[1] is 20');
  TestCondition(appState.game.rolls[2] === '30', 'testSchema - game rolls[2] is 30');
  TestCondition(appState.game.rolls[3] === '40', 'testSchema - game rolls[3] is 40');
  TestCondition(appState.game.rolls[4] === '50', 'testSchema - game rolls[4] is 50');
  TestCondition(appState.game.rolls[5] === '60', 'testSchema - game rolls[5] is 60');
  TestCondition(appState.game.rolls[6] === '70', 'testSchema - game rolls[6] is 70');
  TestCondition(appState.game.rolls[7] === '100', 'testSchema - game rolls[7] is 100');
  TestCondition(appState.game.rolls[8] === 'x2', 'testSchema - game rolls[8] is x2');
  TestCondition(appState.game.rolls[9] === '-100', 'testSchema - game rolls[9] is -100');
  TestCondition(appState.game.rolls[10] === 'TUP!', 'testSchema - game rolls[10] is TUP!');
  TestCondition(appState.game.players[0].bankedScore === 200, 'testSchema - player 0 has banked score of 100');
  TestCondition(appState.game.players[0].pendingScore === 660, 'testSchema - player 0 has pending score of 660');
  TestCondition(appState.game.players[0].pendingTotalScore === 860, 'testSchema - player 0 has pending total score of 760');
  TestCondition(appState.game.players[1].bankedScore === 260, 'testSchema - player 1 has banked score of 260');
  TestCondition(appState.game.players[1].pendingScore === 60, 'testSchema - player 1 has pending score of 60');
    // The reason player 1 still has a pending score is because their round is still going. Since their
    // status is out, the pendingScore is rolled into the bankedScore. If the status were switched back to
    // in, then bankedScore would go back to 200
  TestCondition(appState.game.players[1].pendingTotalScore === 260, 'testSchema - player 1 has pending total score of 260');

  TestCondition(appState._commandStack._startIndex === 0, 'testSchema - command stack start index is 0');
  TestCondition(appState._commandStack._length === 17, 'testSchema - command stack is length 17');

  let cmd = appState._commandStack.loadCommand(0);
  TestCondition(cmd instanceof AddPlayerCommand, 'testSchema - command 0 is AddPlayerCommand');
  TestCondition(cmd.player, 'testSchema - player 0 exists');
  TestCondition(cmd.playerIndex === 0, 'testSchema - command 0 player index is 0');

  cmd = appState._commandStack.loadCommand(1);
  TestCondition(cmd instanceof AddPlayerCommand, 'testSchema - command 1 is AddPlayerCommand');
  TestCondition(cmd.player, 'testSchema - player 1 exists');
  TestCondition(cmd.playerIndex === 1, 'testSchema - command 1 player index is 1');
  
  cmd = appState._commandStack.loadCommand(2);
  TestCondition(cmd instanceof ChangePlayerNameCommand, 'testSchema - command 2 is ChangePlayerNameCommand');
  TestCondition(cmd.player, 'testSchema - player 0 exists');
  TestCondition(cmd.newName === 'Alice', 'testSchema - command 2 new name is Alice');
  TestCondition(cmd.oldName === 'Player 1', 'testSchema - command 2 old name is Player 1');

  cmd = appState._commandStack.loadCommand(3);
  TestCondition(cmd instanceof ChangePlayerNameCommand, 'testSchema - command 3 is ChangePlayerNameCommand');
  TestCondition(cmd.player, 'testSchema - player 1 exists');
  TestCondition(cmd.newName === 'Bob', 'testSchema - command 3 new name is Bob');
  TestCondition(cmd.oldName === 'Player 2', 'testSchema - command 3 old name is Player 2');

  function testAddGameRollCommand(cmd, cmdIndex, roll, numSubCmds) {
    TestCondition(cmd instanceof AddGameRollCommand, `testSchema - command ${cmdIndex} is AddGameRollCommand`);
    TestCondition(cmd.roll === roll, `testSchema - command ${cmdIndex} roll is ${roll}`);
    TestCondition(cmd.commands.commands.length === numSubCmds, `testSchema - command ${cmdIndex} has ${numSubCmds} subcommands`);
  }

  function testSetPendingScoreSubCommand(cmd, expectedOldPendingScore, expectedNewPendingScore, cmdIndex, subIndex) {
    const subCmd = cmd.commands.commands[subIndex];
    TestCondition(subCmd instanceof SetPendingScoreCommand, `testSchema - command ${cmdIndex} subcommand ${subIndex} is SetPendingScoreCommand`);
    TestCondition(subCmd.oldPendingScore === expectedOldPendingScore, `testSchema - command ${cmdIndex} subcommand ${subIndex} oldPendingScore is ${expectedOldPendingScore}`);
    TestCondition(subCmd.newPendingScore === expectedNewPendingScore, `testSchema - command ${cmdIndex} subcommand ${subIndex} newPendingScore is ${expectedNewPendingScore}`);
  }

  cmd = appState._commandStack.loadCommand(4);
  testAddGameRollCommand(cmd, 4, '10', 2);
  testSetPendingScoreSubCommand(cmd, 0, 10, 4, 0);
  testSetPendingScoreSubCommand(cmd, 0, 10, 4, 1);

  cmd = appState._commandStack.loadCommand(5);
  testAddGameRollCommand(cmd, 5, '20', 2);
  testSetPendingScoreSubCommand(cmd, 10, 30, 5, 0);
  testSetPendingScoreSubCommand(cmd, 10, 30, 5, 1);

  cmd = appState._commandStack.loadCommand(6);
  testAddGameRollCommand(cmd, 6, '30', 2);
  testSetPendingScoreSubCommand(cmd, 30, 60, 6, 0);
  testSetPendingScoreSubCommand(cmd, 30, 60, 6, 1);

  // Player[1] set to out
  cmd = appState._commandStack.loadCommand(7);
  TestCondition(cmd instanceof ChangePlayerStatusCommand, 'testSchema - command 7 is ChangePlayerStatusCommand');
  TestCondition(cmd.oldStatus === 'in', 'testSchema - command 7 oldStatus is in');
  TestCondition(cmd.newStatus === 'out', 'testSchema - command 7 newStatus is out');
  
  cmd = appState._commandStack.loadCommand(8);
  testAddGameRollCommand(cmd, 8, '40', 1);
  testSetPendingScoreSubCommand(cmd, 60, 100, 8, 0);

  cmd = appState._commandStack.loadCommand(9);
  testAddGameRollCommand(cmd, 9, '50', 1);
  testSetPendingScoreSubCommand(cmd, 100, 150, 9, 0);

  cmd = appState._commandStack.loadCommand(10);
  testAddGameRollCommand(cmd, 10, '60', 1);
  testSetPendingScoreSubCommand(cmd, 150, 210, 10, 0);

  cmd = appState._commandStack.loadCommand(11);
  testAddGameRollCommand(cmd, 11, '70', 1);
  testSetPendingScoreSubCommand(cmd, 210, 280, 11, 0);

  cmd = appState._commandStack.loadCommand(12);
  testAddGameRollCommand(cmd, 12, '100', 1);
  testSetPendingScoreSubCommand(cmd, 280, 380, 12, 0);

  cmd = appState._commandStack.loadCommand(13);
  testAddGameRollCommand(cmd, 13, 'x2', 1);
  testSetPendingScoreSubCommand(cmd, 380, 760, 13, 0);

  cmd = appState._commandStack.loadCommand(14);
  testAddGameRollCommand(cmd, 14, '-100', 1);
  testSetPendingScoreSubCommand(cmd, 760, 660, 14, 0);

  function testSetScoreSubCommand(cmd, score, cmdIndex, subIndex) {
    const subCmd = cmd.commands.commands[subIndex];
    TestCondition(subCmd instanceof AddScoreCommand, `testSchema - command ${cmdIndex} subcommand ${subIndex} is AddScoreCommand`);
    TestCondition(subCmd.score === score, `testSchema - command ${cmdIndex} subcommand ${subIndex} score is ${score}`);
  }

  cmd = appState._commandStack.loadCommand(15);
  TestCondition(cmd instanceof TallyUpCommand, 'testSchema - command 15 is TallyUpCommand');
  testSetScoreSubCommand(cmd, 200, 16, 0);
  testSetScoreSubCommand(cmd, 100, 16, 1);

  cmd = appState._commandStack.loadCommand(16);
  TestCondition(cmd instanceof AddScoreCommand, 'testSchema - command 16 is AddScoreCommand');
  TestCondition(cmd.score === 100, 'testSchema - AddScoreCommand score is 100');
  
  // Now test bust and persistance
  let bustedMap = loadTestJson(bustedFile);
  if (!bustedMap) {
    bustedMap = new Map(rollsMap);
    injectLocalStorage(bustedMap);

    const appState = new AppState();
    appState.bustGameRound();

    saveTestJson(bustedMap, bustedFile);
    bustedMap = loadTestJson(bustedFile);

    injectLocalStorage(bustedMap);
  } else {
    injectLocalStorage(bustedMap);
  }

  TestCondition(bustedMap !== null, 'testSchema - loaded bustedMap is not null');
  appState = new AppState();

  TestCondition(appState.game.players[0].bankedScore === 200, 'testSchema - player 0 has banked score of 200 after bust');
  TestCondition(appState.game.players[0].pendingScore === 0, 'testSchema - player 0 has pending score of 0 after bust');
  TestCondition(appState.game.players[0].pendingTotalScore === 200, 'testSchema - player 0 has pending total score of 200 after bust');
  TestCondition(appState.game.players[1].bankedScore === 260, 'testSchema - player 1 has banked score of 260 after bust');
  TestCondition(appState.game.players[1].pendingScore === 0, 'testSchema - player 1 has pending score of 0 after bust');
  TestCondition(appState.game.players[1].pendingTotalScore === 260, 'testSchema - player 1 has pending total score of 260 after bust');

  // Now test bust and persistance
  let endedMap = loadTestJson(endedFile);
  if (!endedMap) {
    endedMap = new Map(rollsMap);;
    injectLocalStorage(endedMap);

    const appState = new AppState();
    appState.setPlayerStatus(appState.game.players[0], 'out');
    appState.endGameRound();

    saveTestJson(endedMap, endedFile);
    endedMap = loadTestJson(endedFile);

    injectLocalStorage(endedMap);
  } else {
    injectLocalStorage(endedMap);
  }

  TestCondition(endedMap !== null, 'testSchema - loaded endedMap is not null');
  appState = new AppState();

  TestCondition(appState.game.players[0].bankedScore === 860, 'testSchema - player 0 has banked score of 860 after next');
  TestCondition(appState.game.players[0].pendingScore === 0, 'testSchema - player 0 has pending score of 0 after next');
  TestCondition(appState.game.players[0].pendingTotalScore === 860, 'testSchema - player 0 has pending total score of 860 after next');
  TestCondition(appState.game.players[1].bankedScore === 260, 'testSchema - player 1 has banked score of 760 after next');
  TestCondition(appState.game.players[1].pendingScore === 0, 'testSchema - player 1 has pending score of 0 after next');
  TestCondition(appState.game.players[1].pendingTotalScore === 260, 'testSchema - player 1 has pending total score of 260 after next');

  injectLocalStorage(gLocalStorage);
});

registerTest('testExceedCommandStackSize', function() {
  const appState = new AppState({ storageKey: 'testExceedCommandStackSize' });
  const maxSize = 20;

  // Fill command stack to max capacity
  for (let i = 0; i < maxSize; i++) {
    appState.addPlayer();
  }
  TestCondition(appState._commandStack._startIndex === 0, 'testExceedCommandStackSize - start index 0');
  TestCondition(appState._commandStack.getHeadIndex() === 19, 'testExceedCommandStackSize - head index is 19');
  TestCondition(appState._commandStack._length === maxSize, 'testExceedCommandStackSize - stack at max size');

  // Add one more command, should remove the oldest
  appState.addPlayer();
  TestCondition(appState._commandStack._startIndex === 1, 'testExceedCommandStackSize - start index incremented');
  TestCondition(appState._commandStack.getHeadIndex() === 0, 'testExceedCommandStackSize - head index is 0');
  TestCondition(appState._commandStack._length === maxSize, 'testExceedCommandStackSize - stack still at max size after overflow');

  // Verify the evicted slot (index 0) has been overwritten with the newest command.
  // The stack is circular: when full, the oldest slot is reused for the newest command rather
  // than being deleted. loadCommand(0) should now deserialize to the 21st AddPlayerCommand.
  const overwrittenCmd = appState._commandStack.loadCommand(0);
  TestCondition(overwrittenCmd instanceof AddPlayerCommand, 'testExceedCommandStackSize - evicted slot is overwritten with newest command');
  // The newest player is Player 21 (the 21st addPlayer call).
  TestCondition(overwrittenCmd.player.name === 'Player 21', 'testExceedCommandStackSize - newest command in evicted slot is for Player 21');

  // Verify after undo
  appState.undo();
  TestCondition(appState._commandStack._length === (maxSize - 1), 'testExceedCommandStackSize - stack length reduced by 1 after undo');
  TestCondition(appState._commandStack._startIndex === 1, 'testExceedCommandStackSize - start index incremented');
  TestCondition(appState._commandStack.getHeadIndex() === 19, 'testExceedCommandStackSize - head index is back to 19');

  // Undo all remaining commands and confirm the oldest (evicted) player is NOT undone
  while (appState.canUndo) {
    appState.undo();
  }
  TestCondition(!appState.canUndo, 'testExceedCommandStackSize - canUndo is false after undoing everything');
  // The first addPlayer() was evicted and cannot be undone, so 1 player should remain
  TestCondition(appState.game.players.length === 1, 'testExceedCommandStackSize - one player remains (evicted command cannot be undone)');
});

// Test for full AppState game flow with undo/redo
registerTest('testAppStateFullGameFlow', function() {
  const appState = new AppState({ storageKey: 'TUPTests' }); 
  const states = [];

  function verifyLoadFromStorage(currentAppState) {
    const serialized = currentAppState.serialize();
    const loadedAppState = new AppState({ storageKey: 'TUPTests' });
    const deserializedState = loadedAppState.serialize();
    TestCondition(JSON.stringify(serialized) === JSON.stringify(deserializedState), 'testAppStateFullGameFlow - state matches serialized');
    if (JSON.stringify(serialized) !== JSON.stringify(deserializedState)) {
      console.log('Serialized state:', JSON.stringify(serialized, null, 2));
      console.log('Deserialized state:', JSON.stringify(deserializedState, null, 2));
    }
  }

  function pushStateAndVerifyLoadFromStorage(currentAppState) {
    states.push(currentAppState.serialize());
    verifyLoadFromStorage(currentAppState);
  }


  // Initial state
  pushStateAndVerifyLoadFromStorage(appState);
  TestCondition(!appState.canUndo, 'testAppStateFullGameFlow - !canUndo at initial state');
  TestCondition(appState.canNext, 'testAppStateFullGameFlow - canNext at initial state');
  TestCondition(appState.canBust, 'testAppStateFullGameFlow - canBust at initial state');
  TestCondition(appState.canRoll, 'testAppStateFullGameFlow - canRoll at initial state');

  // Add three players
  appState.addPlayer();
  pushStateAndVerifyLoadFromStorage(appState);
  TestCondition(appState.canUndo, 'testAppStateFullGameFlow - canUndo after appPlayer()');
  TestCondition(!appState.canNext, 'testAppStateFullGameFlow - !canNext after appPlayer()');
  TestCondition(!appState.canBust, 'testAppStateFullGameFlow - !canBust after appPlayer()');
  TestCondition(appState.canRoll, 'testAppStateFullGameFlow - canRoll after appPlayer()');

  appState.addPlayer();
  pushStateAndVerifyLoadFromStorage(appState);
  appState.addPlayer();
  pushStateAndVerifyLoadFromStorage(appState);

  TestCondition(appState.game.players[0].status === 'in' && appState.game.players[1].status === 'in' && appState.game.players[2].status === 'in', 'testAppStateFullGameFlow - Everyone is in');

  // Add some rolls
  appState.addGameRoll(50);
  pushStateAndVerifyLoadFromStorage(appState);
  TestCondition(!appState.canNext, 'testAppStateFullGameFlow - !canNext after addGameRoll(50)');
  TestCondition(appState.canBust, 'testAppStateFullGameFlow - canBust after addGameRoll(50)');
  TestCondition(appState.canRoll, 'testAppStateFullGameFlow - canRoll after addGameRoll(50)');
  appState.addGameRoll(30);
  pushStateAndVerifyLoadFromStorage(appState);
  appState.addGameRoll(20);
  pushStateAndVerifyLoadFromStorage(appState);

  // check scores after rolls
  TestCondition(appState.game.players[0].pendingScore === 100 && appState.game.players[1].pendingScore === 100 && appState.game.players[2].pendingScore === 100, 'testAppStateFullGameFlow - Pending scores after rolls');

  // Mark two players out
  appState.setPlayerStatus(appState.game.players[0], 'out');
  pushStateAndVerifyLoadFromStorage(appState);
  appState.setPlayerStatus(appState.game.players[1], 'out');
  pushStateAndVerifyLoadFromStorage(appState);

  TestCondition(appState.game.players[0].status === 'out' && appState.game.players[1].status === 'out' && appState.game.players[2].status === 'in', 'testAppStateFullGameFlow - Only player[2] is in');

  // check banked scores
  TestCondition(appState.game.players[0].bankedScore === 100 && appState.game.players[1].bankedScore === 100 && appState.game.players[2].bankedScore === 0, 'testAppStateFullGameFlow - Banked scores after rolls');

  // Do a bust
  appState.bustGameRound();
  pushStateAndVerifyLoadFromStorage(appState);
  TestCondition(!appState.canNext, 'testAppStateFullGameFlow - !canNext after bustGameRound()');
  TestCondition(!appState.canBust, 'testAppStateFullGameFlow - !canBust after bustGameRound()');
  TestCondition(appState.canRoll, 'testAppStateFullGameFlow - canRoll after bustGameRound()');
  TestCondition(appState.game.players[0].status === 'in' && appState.game.players[1].status === 'in' && appState.game.players[2].status === 'in', 'testAppStateFullGameFlow - Everyone is in');

  // check scores after bust
  TestCondition(appState.game.players[0].bankedScore === 100 && appState.game.players[1].bankedScore === 100 && appState.game.players[2].bankedScore === 0, 'testAppStateFullGameFlow - Banked scores after bust');
  TestCondition(appState.game.players[0].pendingScore === 0 && appState.game.players[1].pendingScore === 0 && appState.game.players[2].pendingScore === 0, 'testAppStateFullGameFlow - Pending scores after bust');

  // Add a few more rolls
  appState.addGameRoll(40);
  pushStateAndVerifyLoadFromStorage(appState);
  appState.addGameRoll(10);
  pushStateAndVerifyLoadFromStorage(appState);

  // Mark everyone out
  appState.setPlayerStatus(appState.game.players[0], 'out');
  pushStateAndVerifyLoadFromStorage(appState);
  appState.setPlayerStatus(appState.game.players[1], 'out');
  pushStateAndVerifyLoadFromStorage(appState);
  appState.setPlayerStatus(appState.game.players[2], 'out');
  pushStateAndVerifyLoadFromStorage(appState);
  TestCondition(appState.canNext, 'testAppStateFullGameFlow - canNext after set all players out');
  TestCondition(!appState.canBust, 'testAppStateFullGameFlow - !canBust after set all players out');
  TestCondition(!appState.canRoll, 'testAppStateFullGameFlow - !canRoll after set all players out');
  TestCondition(appState.game.players[0].status === 'out' && appState.game.players[1].status === 'out' && appState.game.players[2].status === 'out', 'testAppStateFullGameFlow - Everyone is out');

  // Do next (end round)
  appState.endGameRound();
  pushStateAndVerifyLoadFromStorage(appState);
  TestCondition(!appState.canNext, 'testAppStateFullGameFlow - !canNext after endGameRound()');
  TestCondition(!appState.canBust, 'testAppStateFullGameFlow - !canBust after endGameRound()');
  TestCondition(appState.canRoll, 'testAppStateFullGameFlow - canRoll after endGameRound()');
  TestCondition(appState.game.players[0].status === 'in' && appState.game.players[1].status === 'in' && appState.game.players[2].status === 'in', 'testAppStateFullGameFlow - Everyone is in');

  // Add a roll
  appState.addGameRoll(60);
  pushStateAndVerifyLoadFromStorage(appState);

  // test adding a score of 100 on a player that is in with pending
  appState.addPlayerScore(appState.game.players[0], 100);
  pushStateAndVerifyLoadFromStorage(appState);
  TestCondition(appState.game.players[0].bankedScore === 250, 'testAppStateFullGameFlow - player[0] score is correct after setting');

  // test adding a score of -100 on a player that is in with pending
  appState.addPlayerScore(appState.game.players[0], -100);
  pushStateAndVerifyLoadFromStorage(appState);
  TestCondition(appState.game.players[0].bankedScore === 150, 'testAppStateFullGameFlow - player[0] score is correct after setting');

  // Make one player out
  appState.setPlayerStatus(appState.game.players[0], 'out');
  pushStateAndVerifyLoadFromStorage(appState);
  TestCondition(appState.game.players[0].status === 'out', 'Player[0] is out');

  // test adding a score of 100 on a player that is out
  appState.addPlayerScore(appState.game.players[0], 100);
  pushStateAndVerifyLoadFromStorage(appState);
  TestCondition(appState.game.players[0].bankedScore === 310, 'testAppStateFullGameFlow - player[0] score is correct after setting');

  // test adding a score of -100 on a player that is out
  appState.addPlayerScore(appState.game.players[0], -100);
  pushStateAndVerifyLoadFromStorage(appState);

  // check scores
  TestCondition(appState.game.players[0].bankedScore === 210 && appState.game.players[1].bankedScore === 150 && appState.game.players[2].bankedScore === 50, 'testAppStateFullGameFlow - Banked scores before Tally Up');
  TestCondition(appState.game.players[0].pendingScore === 60 && appState.game.players[1].pendingScore === 60 && appState.game.players[2].pendingScore === 60, 'testAppStateFullGameFlow - Pending scores before Tally Up');

  // Make player[0] back in and confirm banked and pending scores
  appState.setPlayerStatus(appState.game.players[0], 'in');
  pushStateAndVerifyLoadFromStorage(appState);
  TestCondition(appState.game.players[0].status === 'in', 'Player[0] is back in');
  TestCondition(appState.game.players[0].bankedScore === 150, 'testAppStateFullGameFlow - Player[0] banked score correct after back in');
  TestCondition(appState.game.players[0].pendingScore === 60, 'testAppStateFullGameFlow - Player[0] pending score correct after back in');

  appState.addGameRoll('100');
  pushStateAndVerifyLoadFromStorage(appState);
  TestCondition(appState.game.players[0].bankedScore === 150, 'testAppStateFullGameFlow - Player[0] banked score correct after back in');
  TestCondition(appState.game.players[0].pendingScore === 160, 'testAppStateFullGameFlow - Player[0] pending score correct after back in');

  appState.addGameRoll('-100');
  pushStateAndVerifyLoadFromStorage(appState);
  TestCondition(appState.game.players[0].bankedScore === 150, 'testAppStateFullGameFlow - Player[0] banked score correct after back in');
  TestCondition(appState.game.players[0].pendingScore === 60, 'testAppStateFullGameFlow - Player[0] pending score correct after back in');
  
  appState.setPlayerStatus(appState.game.players[0], 'out');
  pushStateAndVerifyLoadFromStorage(appState);
  TestCondition(appState.game.players[0].status === 'out', 'Player[0] is back out');

  // check scores
  TestCondition(appState.game.players[0].bankedScore === 210, 'testAppStateFullGameFlow - Player[0] banked score correct after back out');
  TestCondition(appState.game.players[0].pendingScore === 60, 'testAppStateFullGameFlow - Player[0] pending score correct after back out');
  
  // Do a tally up
  appState.tallyUp(appState.game.players[0]);
    // We explicitly allow a bust after a tally up roll since it can happen in a game, even
    // though the bust has no effect in this specific case since it is the only roll.
  TestCondition(appState.canBust, 'testAppStateFullGameFlow - canBust after tallyUp()');
    // The player is still IN so canNext should be false.
  TestCondition(!appState.canNext, 'testAppStateFullGameFlow - !canNext after tallyUp()');
  pushStateAndVerifyLoadFromStorage(appState);
  
  // Verify final state
  TestCondition(appState.game.players.length === 3, 'testAppStateFullGameFlow - Expected 3 players');
  TestCondition(appState.game.players[0].bankedScore === 410 && appState.game.players[1].bankedScore === 250 && appState.game.players[2].bankedScore === 150, 'testAppStateFullGameFlow - Banked scores');
  TestCondition(appState.game.players[0].pendingScore === 60 && appState.game.players[1].pendingScore === 60 && appState.game.players[2].pendingScore === 60, 'testAppStateFullGameFlow - Pending scores');
  TestCondition(appState.game.players[0].status === 'out' && appState.game.players[1].status === 'in' && appState.game.players[2].status === 'in', 'testAppStateFullGameFlow - Player statuses');
  TestCondition(appState.game.rolls.length === 4 && appState.game.rolls[3] === 'TUP!', 'testAppStateFullGameFlow - Rolls');

  // End the round -- Note that in the UI this is prevented until all players are marked out.
  appState.endGameRound();
  pushStateAndVerifyLoadFromStorage(appState);

  // check scores
  TestCondition(appState.game.players[0].bankedScore === 410 && appState.game.players[1].bankedScore === 310 && appState.game.players[2].bankedScore === 210, 'testAppStateFullGameFlow - Banked scores after endGameRound()');
  TestCondition(appState.game.players[0].pendingScore === 0 && appState.game.players[1].pendingScore === 0 && appState.game.players[2].pendingScore === 0, 'testAppStateFullGameFlow - Pending scores after endGameRound()');

  // Undo everything
  let stateIndex = states.length - 1;
  while (appState.canUndo) {
    appState.undo();
    stateIndex--;
    TestCondition(JSON.stringify(appState.serialize()) === JSON.stringify(states[stateIndex]), 'testAppStateFullGameFlow - state after undo');
    verifyLoadFromStorage(appState);
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

registerTest('testIsValidBuildNumber', function() {
  TestCondition(isValidBuildNumber('20261224'), 'testIsValidBuildNumber - date only');
  TestCondition(isValidBuildNumber('20260612-2'), 'testIsValidBuildNumber - date with single-digit suffix');
  TestCondition(isValidBuildNumber('20260101-10'), 'testIsValidBuildNumber - date with multi-digit suffix');

  TestCondition(!isValidBuildNumber(''), 'testIsValidBuildNumber - empty string');
  TestCondition(!isValidBuildNumber('abc'), 'testIsValidBuildNumber - arbitrary text');
  TestCondition(!isValidBuildNumber('<!DOCTYPE html>'), 'testIsValidBuildNumber - HTML content');
  TestCondition(!isValidBuildNumber('2026122'), 'testIsValidBuildNumber - 7 digits too short');
  TestCondition(!isValidBuildNumber('202612240'), 'testIsValidBuildNumber - 9 digits too long');
  TestCondition(!isValidBuildNumber('20261224-'), 'testIsValidBuildNumber - trailing dash no number');
  TestCondition(!isValidBuildNumber('20261224-abc'), 'testIsValidBuildNumber - non-numeric suffix');
  TestCondition(!isValidBuildNumber('20261224-2abc'), 'testIsValidBuildNumber - numeric suffix with trailing non-numeric');
});


