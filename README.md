# Tally Up Score Pad

A [score keeping app](https://tupsp.messytable.games/) for the dice game [Tally Up](https://messytablegames.com/games/tally-up).

## Requirements

- Node (v18+)

## Setup

```
npm install
```

## Scripts

- `npm run dev` — Run the webpack dev server
- `npm run build` — Build for production into `dist/`
- `npm run build:staging` — Build for staging into `dist/`
- `npm run storybook` — Run Storybook
- `npm run tests` — Run model tests

## Analytics

Set the environment variable TUPSP_INCLUDE_SA to true to include the Simple Analytics script in index.ejs for production. The default is false if the environment variable is not defined.

## Build Number

The app uses a build number defined in build-number.js to test for updated builds. By convention in this project the format is YYYYMMDD and if multiple revisions on a specific date it is YYYYMMDD-N.

## Deployment

`npm run build` produces a static site in `dist/`. It's a PWA with a service worker, so it requires HTTPS in production (or localhost for testing). Deploy the `dist/` folder to any static host — Netlify, GitHub Pages, Cloudflare Pages, a plain web server, etc.

The `firebase.json` is configured for Firebase Hosting. To use Firebase:

1. Install Firebase and log in:
   ```
   npm i -g firebase-tools
   firebase login
   ```
2. Create a `.firebaserc` in the project root:
   ```json
   {
     "projects": {
       "default": "your-firebase-project-id"
     }
   }
   ```
3. `firebase deploy`

## Credits

- **Game Designer** — Eric Olsen
- **Graphic Designer** — Ryan Noonan
- **App** — Jeff Argast

## License

MIT. See [LICENSE](LICENSE).
