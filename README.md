# Sammen

Frontend proof of concept for a communications app for student housing at Fantoft studentby in Bergen, run by Studentsamskipnaden på Vestlandet (Sammen).

The interface is in Norwegian. There is no backend. Login, residents, buildings, and the first posts and messages are hardcoded. Anything you publish stays in the browser.

## What it covers

A resident sees four kinds of spaces:

- **Fellesskap** — the whole of Fantoft. Announcements and chat that reach every block.
- **Bygg** — the resident’s own block, such as Blokk F in Langblokken.
- **Etasje** — that resident’s floor.
- **Meldinger** — a private chat, opened by searching for another resident’s name.

Fellesskap, bygg, and etasje each have a **tavle** and a separate **chat**. The board supports posts, likes, comments, and pinned announcements. Direct messages are chat only.

The block list follows Sammen’s public map of Fantoft: AB-blokken, C and D, Langblokken (E–H), L, M, N, and R and S. Only the blocks that have a demo resident are filled in.

| Resident | Email | Place |
| --- | --- | --- |
| Emma Berg | emma@sammen.no | Blokk F, etasje 3, rom F314 |
| Jonas Hauge | jonas@sammen.no | Blokk F, etasje 3, rom F308 |
| Sara Nilsen | sara@sammen.no | Blokk B, etasje 2, rom B207 |
| Malik Olsen | malik@sammen.no | Blokk R, etasje 5, rom R512 |

The shared password is `sammen`.

## Stack

- [Vite](https://vite.dev/) 6
- [React](https://react.dev/) 18
- TypeScript
- Plain CSS

State is kept in `localStorage` (`sammen-v3`). The signed-in resident is kept in `sessionStorage`. Node 20 is a good match for the Vite version used here.

## Run it locally

```bash
npm install
npm run dev
```

The dev server starts at http://localhost:5173/.

```bash
npm run build    # typecheck, then write dist/
npm run preview  # serve the production build
```

## Deploy

This is a static site. On Netlify, connect the GitHub repo and use:

| Field | Value |
| --- | --- |
| Branch | `main` |
| Base directory | leave empty |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node version | 20 |

No environment variables are required.
