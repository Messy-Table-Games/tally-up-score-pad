import { APP_BUILD_NUMBER } from './build-number.js';

const BUILD_NUMBER_URL = '/build.txt';
const CHECK_INTERVAL = 30 * 60 * 1000;

async function isNewBuildAvailable() {
  try {
    const response = await fetch(BUILD_NUMBER_URL, { cache: 'no-store'});
    if (!response.ok) {
      return false;
    }

    const serverBuildNumber = (await response.text()).trim();

    //console.log(`server build number: ${serverBuildNumber}`);
    //console.log(`app build number: ${APP_BUILD_NUMBER}`);
    if (serverBuildNumber !== APP_BUILD_NUMBER) {
      console.log(`new build detected. from ${APP_BUILD_NUMBER} to ${serverBuildNumber}`);
      return true;
    } 

    return false;
  } catch (err) {
    // console.error('Error checking for new build:', err);
    // If unable to fetch then simply return false
    return false;
  }
}

export async function startBuildChecker(newBuildHandler) {
  setInterval(async () => {
    const newBuildAvailable = await isNewBuildAvailable();
    if (newBuildAvailable) {
      newBuildHandler();
    }
  }, CHECK_INTERVAL);
}

export async function checkForNewBuildNow(newBuildHandler) {
  const newBuildAvailable = await isNewBuildAvailable();
  //console.log(`checkForNewBuildNow: newBuildAvailable=${newBuildAvailable}`);
  if (newBuildAvailable) {
    //console.log('new build available, calling newBuildHandler');
    newBuildHandler();
  }
}

let gReloadScheduled = false;

export function reloadForNewBuild() {
  if (gReloadScheduled) {
    return;
  }
  
  gReloadScheduled = true;

  setTimeout(() => {
    window.location.reload();
  }, 1000);
}
