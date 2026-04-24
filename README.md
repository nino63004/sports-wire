# The Wire

Live top sports stories, pulled from ESPN's public API. Editorial magazine aesthetic — dark theme with gold accents, Oswald display type, Fraunces serif body.

Built with React + Vite + Tailwind. No backend, no API key.

## Features

- Top 10 stories aggregated across NFL, NBA, MLB, NHL, soccer, college, tennis, golf
- Category filters
- Full article images (ESPN supplies them)
- Recency-weighted sort with "Breaking" badges for stories under 3 hours old
- Auto-deploy to GitHub Pages via Actions

## Run locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Deploy to GitHub Pages (one-time setup)

1. **Create the repo on GitHub** (e.g. `sports-wire`).
2. **Push this project to it:**
   ```bash
   git init
   git add .
   git commit -m "initial"
   git branch -M main
   git remote add origin https://github.com/<your-username>/sports-wire.git
   git push -u origin main
   ```
3. **Enable Pages with GitHub Actions as the source:**
   - Go to the repo on GitHub → **Settings** → **Pages**
   - Under **Build and deployment** → **Source**, pick **GitHub Actions**
4. That's it. The workflow in `.github/workflows/deploy.yml` runs on every push to `main` and publishes `dist/` to Pages.

Your public URL will be:

```
https://<your-username>.github.io/sports-wire/
```

The first deploy takes 1–2 minutes. Watch it run under the repo's **Actions** tab.

## Swap data sources

The ESPN endpoints are defined at the top of `src/App.jsx` in the `CATEGORIES` array. To add a league, append to the `endpoints` list using ESPN's path structure — e.g. `basketball/wnba`, `soccer/esp.1`, `racing/f1`. The full base URL is `https://site.api.espn.com/apis/site/v2/sports`.

## Notes

- ESPN's news API is unofficial but stable and has CORS enabled, which is why this works as a pure client-side app. If they ever change it, you'll need a small serverless proxy (Cloudflare Worker or Vercel function).
- The `base: './'` setting in `vite.config.js` makes the build work at any Pages URL without hardcoding the repo name.
