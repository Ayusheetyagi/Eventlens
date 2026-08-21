# EventLens

Why I built this

I was new to Dubai and wanted to make some friends and meet people in the tech and product
community. I started by attending some relevant events, but the problem was finding out what
was actually happening. I was checking Eventbrite, Meetup, WhatsApp groups, Instagram, and a
bunch of other places — one by one. And even then, half the listings were recurring events with
no clear date, so I had no idea if they were actually happening that week.

It felt like too much work for something that should be simple.

So I built one place that answers: "What's happening this week that I might actually care
about?" No digging, no cross-checking, and no guessing.

Who it's for

Anyone who wants a quick, reliable view of what's happening locally without checking five
different platforms. I built it for myself first, but the idea works for any city, any country.

The tradeoffs I made

Product
- Fresh search instead of a database. Every time you open the dashboard, it searches for fresh
  events. Right call for an MVP: no schema to maintain, no stale-data cleanup, and it forces the
  LLM pipeline to prove itself before I invest in storage.
- Users choose what they care about. Instead of an algorithm deciding what they might like, they
  pick their interests.
- Information, not booking. Events already have booking or registration links, so I'm not trying
  to get a booking/registration system in place for the MVP.

AI / LLM
- I chose accuracy over quantity. An event only makes it onto the dashboard if the source clearly
  gives a date. If the date isn't clear, I leave it out.
- The AI only works with information from the source. It doesn't fill in missing details or make
  assumptions.
- "When in doubt, leave it out" is built into the system. The prompt tells the model not to
  guess, and there's a second validation layer that rejects events with missing, invalid, or past
  dates.
- Few-shot examples in the prompt, not zero-shot, teach the model what a genuinely confirmed date
  looks like versus a recurring listing. This helps it tell the difference between a real
  upcoming event and a generic recurring listing.
- Every event links back to the original source, so you can quickly check the details yourself.
- I chose Gemini because I needed six AI calls every time someone loads the dashboard, so cost
  and speed mattered.
- One call per category. It's slightly more expensive, but if one category fails, the rest of
  the dashboard still works.
- No caching yet. Every search is fresh. I chose freshness over saving a few API calls.
- No automated evaluation system yet. I manually checked 50+ results against their original
  source pages to make sure the date filtering was actually working.

What I'd do differently

This is still an early build, so this is my best guess about where I'd take it next. Right now,
nothing is saved between visits. The obvious next step is letting people save their interests
and get notified when a new, confirmed event matches them — instead of running the same search
every time.

What can be done in the next version
- One-click booking or registration: keep people in the flow instead of sending them to another
  platform to finish signing up.
- A social layer: let people share events with friends through the platform, WhatsApp, or
  Instagram — because going to an event is a lot more appealing when you know someone else is
  going too.

---

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
