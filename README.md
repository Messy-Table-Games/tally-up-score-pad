# Tally Up Score Pad

A [score keeping app](https://tupsp.messytable.games/) for the dice game [Tally Up](https://messytablegames.com/games/tally-up). 


## Requirements
- Node
- Firebase CLI (only needed for deploy)

## Setup
- `npm install`

## Scripts
- `npm run dev` — Run the webpack dev server
- `npm run build` — Build for production into `dist/`
- `npm run deploy` — Deploy to Firebase Hosting
- `npm run storybook` — Run Storybook
- `npm run tests` — Run model tests

## Firebase
This project assumes the app is hosted via Firebase. Deployment requires a `.firebaserc` file for the Firebase project id. 

1. Install Firebase and login:
   - `npm i -g firebase-tools`
   - `firebase login`
2. Create a .firebaserc file:
```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

## License
MIT. See [LICENSE](LICENSE).
