// Detects that the deployed build has moved on past the one this tab is running, and
// reloads to pick it up.
//
// The build emits `build.txt` next to the bundle, holding the same build number it
// compiles into the bundle as APP_BUILD_NUMBER. So the constant is what this tab was
// built as, and the file is what the server is handing out now; if they differ, this tab
// is stale. Emitting the file and stamping the constant is the build's job, and each
// project wires that up in its own build system.
//
// Agents: Do not change the implementation, the exports, or the comments in this file 
// without asking first. Project-specific behaviour belongs in the caller, not here.

import { APP_BUILD_NUMBER } from './build-number.js';

const BUILD_NUMBER_URL = '/build.txt';
const CHECK_INTERVAL = 60 * 60 * 1000;
const RELOAD_DELAY = 1000;
// A captive portal answers a fetch by never answering it. Some callers gate their
// startup on this check, so it has to end.
const FETCH_TIMEOUT = 3000;

/** @param {string} s @returns {boolean} */
export function isValidBuildNumber(s) {
  return /^\d{8}(-\d+)?$/.test(s);
}

/** @returns {Promise<boolean>} */
export async function isNewBuildAvailable() {
  try {
    const response = await fetch(BUILD_NUMBER_URL, {
      cache: 'no-store',
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    });
    if (!response.ok) return false;

    const serverBuildNumber = (await response.text()).slice(0, 20).trim();
    // Guards against a captive portal returning HTML.
    if (!isValidBuildNumber(serverBuildNumber)) return false;
    if (serverBuildNumber !== APP_BUILD_NUMBER) {
      console.log(`new build detected. from ${APP_BUILD_NUMBER} to ${serverBuildNumber}`);
      return true;
    }
    return false;
  } catch {
    // Offline, or the server is not serving build.txt. Nothing to update to.
    return false;
  }
}

/**
 * @param {() => void} newBuildHandler
 * @returns {ReturnType<typeof setInterval>}
 */
export function startBuildChecker(newBuildHandler) {
  return setInterval(async () => {
    if (await isNewBuildAvailable()) newBuildHandler();
  }, CHECK_INTERVAL);
}

/**
 * The one piece of state this module keeps, declared here rather than threaded through the
 * callers because it is genuinely a property of the *tab*: there is one page, and once it
 * has committed to replacing itself every later caller has to see that.
 *
 * `reloadScheduled` is a one-way latch. Set by reloadForNewBuild, read by isReloadPending,
 * and cleared by nothing in a running tab — the reload it schedules takes the page away.
 * resetReloadState is the sole exception and exists for tests: module state outlives a test
 * file, so without it the test that trips the latch has to be physically last in the suite
 * with only a comment holding it there, and every later test reading isReloadPending()
 * silently takes the other branch.
 */
let reloadScheduled = false;

/** Reloads once, however many times a new build is reported. */
export function reloadForNewBuild() {
  if (reloadScheduled) return;
  reloadScheduled = true;
  setTimeout(() => window.location.reload(), RELOAD_DELAY);
}

/**
 * Whether this tab is on its way out. For work that cannot await the check above — a timer
 * that fires on its own — and must not act on a page about to be replaced.
 */
export function isReloadPending() {
  return reloadScheduled;
}

/** Clears the latch. Tests only: a running tab never un-schedules a reload. */
export function resetReloadState() {
  reloadScheduled = false;
}
