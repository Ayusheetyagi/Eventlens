# Events Dashboard

A standalone website that generates a categorized, date-verified local events dashboard on demand.
A visitor picks a city and a time window; the backend fans out live web-search queries via the
[Gemini API](https://ai.google.dev/gemini-api/docs) with **Google Search grounding** — one call
per tab (Professional, Social, Networking, Fitness, Family, Arts) — and returns real events grouped
by subcategory. Events are only marked "Confirmed" when a source states an explicit date; anything
recurring without a specific date, or anything outside the selected window, is excluded or flagged
rather than guessed.

## How it works

- `app/api/generate-dashboard/route.ts` validates the request and calls `lib/generate-dashboard.ts`.
- `lib/generate-dashboard.ts` resolves the date window server-side (`lib/date-window.ts`) and fans
  out 6 parallel Gemini calls (`lib/gemini.ts`, one per tab in `lib/tabs.ts`) via
  `Promise.allSettled`, so one failed tab never breaks the whole dashboard.
- `lib/gemini.ts` calls Gemini with the `googleSearch` grounding tool plus a strict
  `responseJsonSchema` for structured output — Gemini 3-family models support combining grounding
  with structured output in the same call. The non-negotiable rules (no guessed dates, exclude
  past/out-of-window events, flag source disagreements) are encoded directly in the system prompt.
- The frontend (`components/DashboardApp.tsx`) is a simple form → loading → results flow. Each run
  is a fresh, stateless snapshot — nothing is persisted.

## Local setup

```bash
npm install
cp .env.local.example .env.local
# then edit .env.local and add your GEMINI_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Required | Notes |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Get one at [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Server-only — never sent to the browser. |
| `GEMINI_MODEL` | No | Defaults to `gemini-flash-latest`. |

## Deploying to Vercel

1. Push this repo to GitHub.
2. Import it into Vercel.
3. In the Vercel project's **Settings → Environment Variables**, add `GEMINI_API_KEY` (and
   `GEMINI_MODEL` if you want to override the default).
4. Deploy. The API route sets `maxDuration = 60` to allow time for 6 parallel search-grounded
   calls — check your Vercel plan's function duration limit if requests are timing out.

## Cost notes

Each dashboard generation makes 6 Gemini calls (one per tab), each grounded with Google Search.
Google Search grounding on Gemini 3-family models includes **5,000 free grounded prompts per
month** (shared across the Gemini 3 family on your account), then $14 per 1,000 search queries
after that — one grounded call can trigger more than one underlying search query. At 6 calls per
dashboard, the free monthly allotment covers roughly 800 full dashboard generations before any
search cost kicks in. Gemini's own token pricing applies on top, but Flash-tier tokens are cheap.
