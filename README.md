# Tally Up Score Pad

A [score keeping app](https://tupsp.messytable.games/) for the dice game [Tally Up](https://messytablegames.com/games/tally-up).

## Requirements

- Node (v20.11+)

## Setup

```
npm install
```

## Scripts

- `npm run dev` — Run the webpack dev server
- `npm run build` — Build for production into `dist/`
- `npm run build:staging` — Build for staging into `dist/`
- `npm run deploy:staging` — Test, build and deploy to the staging Firebase project
- `npm run deploy:production` — Test, build and deploy to production, after confirmation
- `npm run storybook` — Run Storybook
- `npm run tests` — Run model tests

## Analytics

Set the environment variable TUPSP_INCLUDE_SA to true to include the Simple Analytics script in index.ejs for production. The default is false if the environment variable is not defined. It can come from the environment or from a gitignored `.env` at the root; the environment wins.

## Build Number

The app uses a build number defined in build-number.js to test for updated builds. By convention in this project the format is YYYYMMDD and if multiple revisions on a specific date it is YYYYMMDD-N.

## Deployment

`npm run build` produces a static site in `dist/`. It's a PWA with a service worker, so it requires HTTPS in production (or localhost for testing). Deploy the `dist/` folder to any static host — Netlify, GitHub Pages, Cloudflare Pages, a plain web server, etc.

This project deploys to Firebase Hosting, to two projects named by aliases in `.firebaserc`. It has no default, so every deploy names its target. If you don't have a `.firebaserc`, create one with your own project ids:

```json
{
  "projects": {
    "staging": "your-staging-project-id",
    "production": "your-production-project-id"
  }
}
```

Then deploy with:

```
npm run deploy:staging
npm run deploy:production
```

These run `firebase deploy --only hosting -P <target>`; production asks for confirmation first. Install the Firebase CLI with `npm i -g firebase-tools` and run `firebase login` once.

Every hosting deploy, including a plain `firebase deploy`, runs `scripts/predeploy.js` first. It runs the tests and builds for the project being deployed, so a `dist/` left over from another build is never uploaded. Production also requires:

- a clean working tree on `main` that matches `origin/main`
- `TUPSP_INCLUDE_SA=true`, so the release includes analytics
- a valid build number that has not been released before

After a production deploy, `scripts/postdeploy.js` tags the commit `prod-<build number>` and prints the command to push the tag. Bump `src/build-number.js` before each production release; open tabs only reload into a new build when the build number changes. Staging does not check the build number, so use a `-N` suffix if you want open staging tabs to reload.

To roll back, use Hosting → Release history in the Firebase console. Open tabs reload into the older build, since the build checker reloads on any change of build number.

## Credits

- **Game Designer** — Eric Olsen
- **Graphic Designer** — Ryan Noonan
- **App** — Jeff Argast

## License

MIT. See [LICENSE](LICENSE).
