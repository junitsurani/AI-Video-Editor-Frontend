# Frame frontend

The Next.js application for the landing page, authentication, dashboard, uploads, and video editor. All frontend source, assets, configuration, and npm dependencies live here.

## Run independently

From this folder:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:3000. Run the Flask API and render worker from `../video-backend` for account and editing functionality. Alternatively, run `npm run dev:all` from the parent folder to start all three processes.

## Configuration

The Next.js server proxies `/api/*` to `http://127.0.0.1:5001`. Copy `.env.example` to `.env.local` and change `API_INTERNAL_URL` when the backend runs elsewhere. This value is server-only and must be available at build time and runtime. Never add AI provider or SMTP credentials to the frontend.

## Build

```sh
npm run build
npm run start
```

On machines with limited disk space, use `FRAME_DISABLE_WEBPACK_CACHE=1 npm run build`.

## Structure

- `app/`: routes, page layouts, CSS, authentication screens, and editor.
- `components/`, `hooks/`, `lib/`: shared UI, hooks, and API clients.
- `public/`: public imagery, fonts, logos, and design-reference attribution.
- `docs/`: visual audit notes.
- `Dockerfile`: standalone frontend image; build context is this folder.

The initial unused Sites/Cloudflare scaffold remains in `build/`, `db/`, `drizzle/`, `examples/`, `scripts/`, and the Vite/Cloudflare configuration. It is excluded from the active Next.js TypeScript build. The active backend is Flask in `../video-backend`.

See the [platform README](../README.md) for current editing capabilities and remaining work.
