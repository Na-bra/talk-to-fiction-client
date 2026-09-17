# AI NPC Generator — Client

React interface for the [AI NPC Generator API](../ai-character-generator). A character database you
can hold conversations with: browse NPCs, open a dossier, and talk to one while watching their
relationship with you shift.

## Stack

React 19 · Vite · React Router · Supabase Auth. No state library — the API is the state.

## Running it

The [API server](../ai-character-generator) needs to be running first (default `:4000`), and both
need the same Supabase project — its README walks through the one-time setup.

```bash
cp .env.example .env   # add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY
```

```bash
npm install
npm run dev        # http://localhost:5173
```

In development Vite proxies `/api` to `http://localhost:4000`, so no configuration is needed.
Point it somewhere else with `VITE_DEV_API=http://localhost:5000 npm run dev`.

## Configuration

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_API_URL=                       # production only
```

The two Supabase values are required — without them the app shows a setup notice instead of a
sign-in page. The publishable key is designed to ship in a browser bundle; Row Level Security in the
database is what keeps each account's data private. Never put the **secret** key in this file.

`VITE_API_URL` stays empty locally. When set, every request goes to that origin instead of the dev
proxy — no trailing slash. Vite inlines all three at build time, so a change means a rebuild.

## Accounts

Sign-in is through Supabase Auth, with Google or with email and password. Each account sees only
its own characters, conversations and memories. The client sends the session's access token with
every API request; if the API rejects it, the client signs out and returns to the sign-in page.

### Enabling Google

1. In Google Cloud Console, create an OAuth client of type **Web application** and add
   `https://<your-project>.supabase.co/auth/v1/callback` as an authorised redirect URI.
2. In Supabase, open **Authentication → Sign In / Providers → Google**, paste the client ID *and*
   client secret, and save. With the toggle on but no secret saved, Supabase answers every Google
   sign-in with `Unsupported provider: missing OAuth secret`.
3. In **Authentication → URL Configuration**, set the Site URL to the deployed client, and add
   `<origin>/**` under Redirect URLs for every origin people sign in from — the deployed site and
   `http://localhost:5173`. Google sends people back to `/login?next=…`; if that origin is not
   listed, Supabase silently sends them to the Site URL instead.

## Running it in Docker

The image builds the site with Node, then serves the static files with nginx — the running
container has no Node in it.

```bash
docker compose up --build        # http://localhost:8080
```

Compose reads the build values from your `.env`. Without Compose:

```bash
docker build -t talk-to-fiction-client \
  --build-arg VITE_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_... \
  --build-arg VITE_API_URL=https://your-api.onrender.com \
  .
docker run -p 8080:80 talk-to-fiction-client
```

Three things to know:

- **These are build arguments, not runtime settings.** Vite bakes them into the JavaScript, so
  pointing the image at a different API or Supabase project means rebuilding it. The build fails if
  either Supabase value is missing, rather than producing an image that cannot sign anyone in.
- **`VITE_API_URL` is called from the browser**, so it must be an address the browser can reach —
  `http://localhost:4000` locally, or the deployed API. A container name such as `http://api:4000`
  will not work.
- **The container serves from a new origin, `http://localhost:8080`.** Add it to `CLIENT_ORIGIN` on
  the API (comma-separated), and add `http://localhost:8080/**` to Supabase's Redirect URLs, or
  API calls will be blocked by CORS and Google sign-in will send people elsewhere.

nginx answers every path with the app shell, so refreshing `/login` or `/npc/…` works — the same job
`vercel.json` does on Vercel. Hashed files under `/assets/` are cached for a year; `index.html` is
never cached, so a new image shows up on the next page load.

## Deploying

Static build, so anything free works — [Vercel](https://vercel.com),
[Netlify](https://netlify.com), or [Cloudflare Pages](https://pages.cloudflare.com).

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_API_URL` |

The API must allow this origin — set `CLIENT_ORIGIN` on the server to the deployed URL, or CORS
will block every request. Also add the deployed URL to Supabase under Authentication → URL
Configuration (Site URL and Redirect URLs), so confirmation emails link back here, not to localhost.

## Layout

```
src/
  pages/        Gallery, Dossier, Chat, NpcForm, Account, Login
  components/   AppShell, ui (Avatar, Banner, Mood, Skeleton…), Dialog, Menu,
                Meter, Relationship, TraitPicker, Icon
  lib/          formatting helpers and small hooks
  api.js        the only file that knows about the server
  supabase.js   the Supabase client
  auth.jsx      session state: AuthProvider + useAuth
  library.jsx   the signed-in user's characters, shared by gallery and sidebar
  toast.jsx     brief confirmations
  theme.js      dark (default) / light / system preference
  styles.css    entry point; imports styles/ in order:
                tokens → base → components → shell → one file per page
```

Every colour, size and duration lives in `styles/tokens.css`; the light theme redefines the
same tokens under `[data-theme='light']`. Interface text uses the system font (Inter
elsewhere) and character content uses Newsreader, both loaded in `index.html` with local
fallbacks.

`api.js` is the single seam between UI and API — every endpoint lives there, nothing else calls
`fetch`.
