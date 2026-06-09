import './app-view.js';
import { startBuildChecker, checkForNewBuildNow, reloadForNewBuild } from './build-checker.js';
import { t, i18nStore } from './i18n.js';

if (window.location.pathname !== '/') {
  window.location.replace('/');
}

document.title = t('page.title');
document.documentElement.lang = i18nStore.locale;
const _appleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]');
if (_appleMeta) _appleMeta.content = t('game.name');

let gServiceWorkerReg = null;

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }

  if (APP_ENV !== 'production' && APP_ENV !== 'staging') {
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