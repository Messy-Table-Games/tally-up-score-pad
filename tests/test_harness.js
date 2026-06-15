export let gTestResults = {
  total: 0,
  passed: 0,
  failed: 0
};

export function TestCondition(condition, message) {
  if (condition) {
    console.log(`${message}: \x1b[32mPASS\x1b[0m`);
    gTestResults.passed++;
  } else {
    console.log(`${message}: \x1b[31mFAIL\x1b[0m`);
    gTestResults.failed++;
  }
  gTestResults.total++;
}

export const gTests = new Map();

export function registerTest(name, func) {
  gTests.set(name, func);
}

export function runAllTests() {
  for (let [, func] of gTests) {
    func();
  }

  console.log('\n\x1b[1mTest Results:\x1b[0m');
  console.log(`  Total:  ${gTestResults.total}`);
  console.log(`  Passed: \x1b[32m${gTestResults.passed}\x1b[0m`);
  if (gTestResults.failed > 0) {
    console.log(`  Failed: \x1b[31m${gTestResults.failed}\x1b[0m\n`);
    process.exit(1);
  } else {
    console.log(`  Failed: ${gTestResults.failed}\n`);
  }
}
