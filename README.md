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

Sign-in is email and password through Supabase Auth. Each account sees only its own characters,
conversations and memories. The client sends the session's access token with every API request;
if the API rejects it, the client signs out and returns to the sign-in page.

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
  pages/        Gallery, NpcForm, Profile, Chat, Login
  components/   StatBar, Relationship, Field, TraitPicker
  api.js        the only file that knows about the server
  supabase.js   the Supabase client
  auth.jsx      session state: AuthProvider + useAuth
  styles.css    one stylesheet, CSS variables for theming
```

`api.js` is the single seam between UI and API — every endpoint lives there, nothing else calls
`fetch`.
