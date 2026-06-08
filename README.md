# Simple Games

Play at [https://nutnut17.github.io/simple-game/](https://nutnut17.github.io/simple-game/)

## Deploying

```sh
npm run deploy
```

`npm` automatically runs `predeploy` (which runs `npm run build`) before `deploy` (which runs `gh-pages -d dist`), so a single `npm run deploy` builds and publishes — no need to run `predeploy` manually.

