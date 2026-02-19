# AI Code Master (Next.js + Vercel)

Aplicatia este migrata pe Next.js (App Router) si este pregatita pentru deploy in Vercel.

## Local Development

1. Instaleaza dependintele:
`npm install`

2. Creeaza `.env.local` pe baza `.env.example` si seteaza cheia:
`GEMINI_API_KEY=...`

3. Ruleaza local:
`npm run dev`

Aplicatia va fi disponibila la `http://localhost:3000`.

## Vercel Setup

1. Importa repository-ul in Vercel.
2. In `Project Settings -> Environment Variables`, adauga:
`GEMINI_API_KEY` (valoarea cheii tale Gemini)
3. Deploy.

## Note

- Cheia Gemini este folosita doar server-side in API routes (`app/api/*`) si nu este expusa in browser.
- Persistenta `settings` este in memorie (runtime), potrivita pentru demo/prototip. Pentru persistenta permanenta in productie adauga o baza de date externa.
