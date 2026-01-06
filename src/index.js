import './app-view.js';
import { startBuildChecker, checkForNewBuildNow, reloadForNewBuild } from './build-checker.js';

if (window.location.pathname !== '/') {
  window.location.replace('/');
}

let gServiceWorkerReg = null;

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  if (APP_ENV !== 'production') {
    return;
  }
  
  try {
    const reg = await navigator.serviceWorker.register('/service-worker.js');
    gServiceWorkerReg = reg;
    reg.addEventListener('updatefound', () => {
      const newWorker = reg.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'activated') {
          //window.alert('reloading new build from event listener');
          reloadForNewBuild();
        }
      });
    });
  } catch (error) {
    console.log('Service Worker registration failed:', error);
  }
}

function newBuildIsAvailable() {
  if (!gServiceWorkerReg) {
    //window.alert('reloading new build from newBuildIsAvailable');
    reloadForNewBuild();
    return;
  }

  //console.log('calling update on service worker reg');
  gServiceWorkerReg.update();
}

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    checkForNewBuildNow(newBuildIsAvailable);
  }
});

registerServiceWorker();
startBuildChecker(newBuildIsAvailable);