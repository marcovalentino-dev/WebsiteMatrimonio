# WeddingMatrimonio

Sito matrimonio moderno + dashboard segreta di configurazione.

## Stack
- Next.js App Router + TypeScript
- TailwindCSS
- Framer Motion
- Zod
- dnd-kit (ordinamento sezioni)

## Avvio
```bash
npm i
npm run dev
```

## Route
- Sito pubblico: `/`
- Dashboard segreta: `/__config_8f3a9c1d`

## Funzioni principali
- Intro gate con busta/sigillo animato (una sola volta per sessione, chiave `intro_seen_v1`)
- Configurazione completa via dashboard a tabs
- Configurazione caricata sempre da `lib/config/defaultConfig.json`
- Export/Import JSON configurazione
- Sezioni configurabili con visibilità + ordine drag&drop
- RSVP senza backend (`mailto` o copia appunti)
- Guestbook locale via localStorage
- Nessun riferimento bancario

