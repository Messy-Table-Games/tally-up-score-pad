// Firebase hosting predeploy hook (see firebase.json). Firebase sets GCLOUD_PROJECT to
// the project being deployed, so the build here always matches its target and a dist/
// left over from another build can never be uploaded. Any failure stops the deploy
// before anything is uploaded.
import { existsSync } from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { isValidBuildNumber } from '../src/build-checker.js';
import { ROOT, BUILD_NUMBER, releaseTag, targetForProject, fail, run, git, tagExists } from './deploy-common.js';

const projectId = process.env.GCLOUD_PROJECT;
const target = targetForProject(projectId);
if (!target) {
  fail(`project "${projectId}" is not listed in .firebaserc`);
}
console.log(`\nPreparing ${target} build ${BUILD_NUMBER} for ${projectId}`);

if (target === 'production') {
  if (git('status --porcelain')) {
    fail('the working tree has uncommitted changes. Commit or stash them first.');
  }

  const branch = git('rev-parse --abbrev-ref HEAD');
  if (branch !== 'main') {
    fail(`production deploys from main, but the current branch is ${branch}.`);
  }

  try {
    git('fetch --quiet --tags origin main');
  } catch (err) {
    fail(`could not fetch from origin to check that main is pushed: ${err.message.split('\n')[0]}`);
  }
  if (git('rev-parse HEAD') !== git('rev-parse origin/main')) {
    fail('main does not match origin/main. Push (or pull) first so production matches GitHub.');
  }

  // Same rule as the webpack build: the environment wins, then a .env at the root
  const envFile = path.join(ROOT, '.env');
  if (existsSync(envFile)) {
    dotenv.config({ path: envFile, quiet: true });
  }
  if (process.env.TUPSP_INCLUDE_SA !== 'true') {
    fail('TUPSP_INCLUDE_SA is not "true", so the production build would have no analytics.');
  }

  if (!isValidBuildNumber(BUILD_NUMBER)) {
    fail(`build number "${BUILD_NUMBER}" in src/build-number.js is not YYYYMMDD or YYYYMMDD-N.`);
  }
  if (tagExists(releaseTag(BUILD_NUMBER))) {
    fail(`build ${BUILD_NUMBER} was already released (tag ${releaseTag(BUILD_NUMBER)}). ` +
      'Bump src/build-number.js so open tabs pick up the new build.');
  }
}

if (!run('npm run tests')) {
  fail('tests failed.');
}

if (!run(target === 'production' ? 'npm run build' : `npm run build:${target}`)) {
  fail('build failed.');
}

console.log(`\n✔ ${target} build ${BUILD_NUMBER} is ready to upload\n`);
