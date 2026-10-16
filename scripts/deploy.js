// Usage: node scripts/deploy.js <staging|production>
// Deploys hosting to an explicit target, so the result never depends on `firebase use`.
// Production asks for confirmation first. The checks and the build itself run in the
// predeploy hook, so they also apply to a plain `firebase deploy`.
import { spawnSync } from 'node:child_process';
import readline from 'node:readline/promises';
import { ROOT, BUILD_NUMBER, isTarget, fail, git } from './deploy-common.js';

const target = process.argv[2];
if (!isTarget(target)) {
  fail(`usage: node scripts/deploy.js <target>, where target is listed in .firebaserc (got "${target ?? ''}")`);
}

if (target === 'production') {
  const commit = git('log -1 --format="%h %s"');
  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await prompt.question(`\nDeploy build ${BUILD_NUMBER} (${commit}) to PRODUCTION? (y/N) `);
  prompt.close();
  if (answer.trim().toLowerCase() !== 'y') {
    console.log('Cancelled.');
    process.exit(1);
  }
}

// target is validated against .firebaserc above, so it is safe in the command line
const result = spawnSync(`firebase deploy --only hosting -P ${target}`, { cwd: ROOT, stdio: 'inherit', shell: true });
process.exit(result.status ?? 1);
