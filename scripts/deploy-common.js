// Shared by deploy.js and the Firebase predeploy/postdeploy hooks.
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { APP_BUILD_NUMBER } from '../src/build-number.js';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Target names and project ids come from .firebaserc, e.g. { production: 'my-project-id' }
const FIREBASERC = path.join(ROOT, '.firebaserc');
if (!existsSync(FIREBASERC)) {
  fail('no .firebaserc. Create one naming your staging and production projects (see README, Deployment).');
}
const PROJECTS = JSON.parse(readFileSync(FIREBASERC, 'utf8')).projects ?? {};

export const BUILD_NUMBER = APP_BUILD_NUMBER;
export const releaseTag = (buildNumber) => `prod-${buildNumber}`;

export function isTarget(name) {
  return Object.hasOwn(PROJECTS, name);
}

/** Maps the project id Firebase passes to hooks in GCLOUD_PROJECT back to a target name. */
export function targetForProject(projectId) {
  return Object.keys(PROJECTS).find(name => PROJECTS[name] === projectId) ?? null;
}

export function fail(message) {
  console.error(`\n✖ Deploy stopped: ${message}\n`);
  process.exit(1);
}

/** Runs a command in the project root with output shown; returns false if it failed. */
export function run(command) {
  try {
    execSync(command, { cwd: ROOT, stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
}

/** Runs a git command in the project root and returns its trimmed output. */
export function git(args) {
  return execSync(`git ${args}`, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

export function tagExists(tag) {
  try {
    git(`rev-parse -q --verify refs/tags/${tag}`);
    return true;
  } catch {
    return false;
  }
}
