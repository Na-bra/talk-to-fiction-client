# AI NPC Generator — Client

React interface for the [AI NPC Generator API](../ai-character-generator). A character database you
can hold conversations with: browse NPCs, open a dossier, and talk to one while watching their
relationship with you shift.

## Stack

React 19 · Vite · React Router. No state library — the API is the state.

## Running it

The [API server](../ai-character-generator) needs to be running first (default `:4000`).

```bash
npm install
npm run dev        # http://localhost:5173
```

In development Vite proxies `/api` to `http://localhost:4000`, so no configuration is needed.
Point it somewhere else with `VITE_DEV_API=http://localhost:5000 npm run dev`.

## Configuration

One variable, and only for production:

```env
VITE_API_URL=https://your-api.onrender.com
```

Leave it empty locally. When set, every request goes to that origin instead of the dev proxy — no
trailing slash. Vite inlines it at build time, so a change means a rebuild.

## Deploying

Static build, so anything free works — [Vercel](https://vercel.com),
[Netlify](https://netlify.com), or [Cloudflare Pages](https://pages.cloudflare.com).

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment | `VITE_API_URL` |

The API must allow this origin — set `CLIENT_ORIGIN` on the server to the deployed URL, or CORS
will block every request.

## Layout

```
src/
  pages/        Gallery, NpcForm, Profile, Chat
  components/   StatBar, Relationship, Field, TraitPicker
  api.js        the only file that knows about the server
  styles.css    one stylesheet, CSS variables for theming
```

`api.js` is the single seam between UI and API — every endpoint lives there, nothing else calls
`fetch`.
