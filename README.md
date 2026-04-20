# Rotatorr

A private self-hosted Next.js app that reads one Plex collection, uses Tautulli history to determine when each show was last played, and orders the collection for rotation viewing.

## Setup

1. Install dependencies with `npm install`.
2. Copy `config.example.json` to `config.local.json`.
3. Fill in the Plex and Tautulli values in `config.local.json`.
4. Start the app with `npm run dev`.

## Docker Compose

The published Docker image is `zzazab/rotatorr`, and the app reads its secrets from a JSON config file instead of environment variables. The Compose file pins the image to the current app version by default so restarts do not silently pick up a new `latest` image.

1. Copy `config.example.json` to `config.local.json`.
2. Fill in the Plex and Tautulli values.
3. Start the app with `docker-compose up -d`.
4. Open `http://localhost:3000`.

By default Compose mounts `./config.local.json` into the container at `/config/config.json`.

If your config file lives elsewhere, point Compose at it with a non-secret path override:

```bash
CONFIG_FILE_PATH=/mnt/apps/rotatorr/config.json docker-compose up -d
```

To intentionally upgrade or test another published image tag, set `ROTATORR_VERSION` when starting Compose:

```bash
ROTATORR_VERSION=0.1.4 docker-compose up -d
```

For TrueNAS, mount your external config file to `/config/config.json` in the container instead of storing secrets in environment variables.

The config file uses this shape:

```json
{
  "PLEX_BASE_URL": "http://localhost:32400",
  "PLEX_TOKEN": "your-plex-token",
  "PLEX_TV_LIBRARY_SECTION_ID": "2",
  "PLEX_COLLECTION_RATING_KEY": "12345",
  "TAUTULLI_BASE_URL": "http://localhost:8181",
  "TAUTULLI_API_KEY": "your-tautulli-api-key"
}
```

The app looks for config in these locations:

1. `TV_SERIES_ROTATION_CONFIG_PATH`, if you explicitly set it.
2. `config.local.json` in the project root.
3. `/config/config.json` inside the container.

To stop it, run `docker-compose down`.

## How ordering works

- The configured Plex collection determines which shows appear in the app.
- Tautulli history is fetched for TV episode playback.
- The app matches history back to Plex shows by preferring direct Plex rating keys from Tautulli fields like `grandparent_rating_key`.
- Shows with no history are treated as `never played` and are shown first.
- Played shows are ordered by the oldest `last played` timestamp first so the most neglected series rises to the top.

## Plex integration

- Posters are proxied through the app so the Plex token never reaches the browser.
- `Mark unwatched` calls Plex's `unscrobble` endpoint for the show `ratingKey`, which resets watched state for the whole series.

## Scripts

- `npm run dev` starts the local development server.
- `npm run build` builds the production app.
- `npm run test` runs the Vitest suite.

## Running tests

After `npm install`, run the automated checks from the project root:

```bash
npm run test
```

For an interactive watch mode while you are developing:

```bash
npm run test:watch
```

If you want to verify the full app before shipping changes, it is also useful to run:

```bash
npm run build
```

## Manual Docker publish

GitHub Actions includes a manual workflow that can build and push this image to Docker Hub.

1. Add the `DOCKERHUB_USERNAME` repository secret.
2. Add the `DOCKERHUB_TOKEN` repository secret.
3. Optionally add the `DOCKERHUB_REPOSITORY` repository variable if you want a repository name other than `<DOCKERHUB_USERNAME>/rotatorr`.
4. In GitHub, run the `Docker Publish` workflow from the Actions tab.
5. Optionally provide a `version` input. If left blank, the workflow uses `package.json`'s version.

The workflow always pushes:

- `<image>:<version>`
- `<image>:sha-<full-commit-sha>`

It can also push `<image>:latest`, which is enabled by default in the manual trigger form.

The Docker build receives `APP_VERSION` as a build argument, and the final image stores that value in OCI image metadata.
