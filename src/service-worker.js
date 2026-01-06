import { clientsClaim, setCacheNameDetails } from 'workbox-core';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkOnly, CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Use the build number to version caches
const cacheId = `tally-up-${APP_BUILD_NUMBER}`;
setCacheNameDetails({
  prefix: cacheId
});

// This will be populated by the InjectManifest plugin
// Do not cache the build.txt file otherwise the app will not detect new builds
const manifestWithoutBuildTxt = self.__WB_MANIFEST.filter(
  (entry) => entry.url !== 'build.txt'
);

precacheAndRoute(manifestWithoutBuildTxt);

self.skipWaiting();
clientsClaim();

// Fallback for navigation requests to index.html
const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler);
registerRoute(navigationRoute);

// Runtime caching for images
registerRoute(
  /\.(?:png|jpg|jpeg|svg|gif|ico)$/,
  new CacheFirst({
    cacheName: `${cacheId}-images`,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
      }),
    ],
  })
);

// Runtime caching for Simple Analytics
const networkOnly = new NetworkOnly();

registerRoute(
  ({ url }) =>
    url.origin === 'https://queue.simpleanalyticscdn.com' &&
    url.pathname === '/simple.gif',
  async (options) => {
    try {
      return await networkOnly.handle(options);
    } catch (error) {
      //console.warn('[SW] dropping analytics request (offline).');
      return new Response(null, {
        status: 202,
        statusText: 'Dropped',
      });
    }
  },
  'GET'
);

// Runtime caching for Simple Analytics with background sync
// import { BackgroundSyncPlugin } from 'workbox-background-sync';
// const bgSyncPlugin = new BackgroundSyncPlugin('analytics-queue', {
//   maxRetentionTime: 24 * 60
// });

// const analyticsHandler = new NetworkOnly({
//   plugins: [bgSyncPlugin],
// });

// registerRoute(
//   ({ url }) =>
//     url.origin === 'https://queue.simpleanalyticscdn.com' &&
//     url.pathname === '/simple.gif',
//   async (options) => {
//     try {
//       return await analyticsHandler.handle(options);
//     } catch (error) {
//       console.warn('[SW] analytics request queued for replay (offline).');
//       return new Response(null, {
//         status: 202,
//         statusText: 'Queued offline',
//       });
//     }
//   },
//   'GET'
// );

// In theory, workbox is handling old cache cleanup and the following
// code is not needed. But keeping here for reference.
//
// self.addEventListener('activate', (event) => {
//   event.waitUntil(
//     caches.keys().then((cacheNames) =>
//       Promise.all(
//         cacheNames
//           .filter((name) => !name.startsWith(cacheId))
//           .map((name) => caches.delete(name))
//       )
//     )
//   );
// });
