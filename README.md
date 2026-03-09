# Sito Web — Matrimonio di Salvatore & Donatella

Sito statico per l'invito al matrimonio di Salvatore e Donatella, realizzato con **Next.js 14 (App Router)**.

---

## Il matrimonio

| | |
|---|---|
| **Sposi** | Salvatore & Donatella |
| **Data** | Mercoledì 30 settembre 2026 |
| **Scadenza RSVP** | 1 agosto 2026 |

### La Cerimonia
- **Chiesa di Santa Lucia Vergine al Monte**
- Corso Vittorio Emanuele, 328 — 80135 Napoli
- Orario: **ore 11.15**

### Il Ricevimento
- **Hotel San Francesco al Monte**
- Corso Vittorio Emanuele, 328 — 80135 Napoli
- A pochi passi dalla chiesa, in un antico monastero affacciato sul Golfo

---

## Struttura del sito

Il sito è una **single-page application** con tre sezioni navigabili a carosello verticale:

| Sezione | Contenuto |
|---|---|
| **Home** | Riepilogo con icone: cerimonia, ricevimento, scadenza conferma. Due bottoni di navigazione |
| **Conferma la tua presenza** | Modulo di conferma (nome, cognome, allergie, accompagnatori) |
| **Maggiori informazioni** | Programma della giornata, mappe interattive, domande frequenti |

### Flusso utente
1. **Video intro** — si avvia al tap dell'utente (`/intro/intro.mp4`)
2. **Animazione nomi** — "Salvatore & Donatella" appare in dissolvenza, il video di sfondo gira già dietro
3. **Home page** — sfuma in entrata dopo 5 secondi di animazione
4. Navigazione tra le sezioni con transizione a carosello verticale (framer-motion)

---

## File multimediali

I file vanno copiati nella cartella `/public`:

| File | Descrizione |
|---|---|
| `/public/intro/intro.mp4` | Video introduttivo (mostrato all'apertura) |
| `/public/intro/soundtrack.mp3` | Musica di sottofondo (auto-silenziata dopo 60 secondi) |
| `/public/background.mp4` | Video di sfondo in loop, visibile dopo l'intro |
| `/public/media/background-poster.jpg` | Immagine poster per il video di sfondo (fallback) |

---

## Funzionalita

### Personalizzazione in tempo reale
Il pulsante **Impostazioni** (in alto a destra, visibile dopo l'intro) apre un pannello con:
- **Palette colori** — 4 colori personalizzabili (Steel, Navy, Cream, Peach)
- **Font titoli** — scelta tra tre font calligrafici:
  - Lucida Handwriting
  - Segoe Script
  - Lucida Calligraphy

### Audio
- La colonna sonora parte quando l'utente avvia il video intro
- Si silenzia automaticamente dopo **60 secondi**
- Il bottone muto/non muto appare in alto a sinistra dopo l'avvio

### Conferma presenza (RSVP)
Le conferme vengono salvate in un file Excel (`/data/rsvp.xlsx`) tramite l'API `POST /api/rsvp`.

Campi del modulo:
- Nome e cognome (obbligatori)
- Intolleranze o allergie alimentari
- Accompagnatori con nome e tipo (Parente / Bambino)

---

## Setup e sviluppo

### Prerequisiti
- Node.js 18+
- npm

### Installazione

```bash
npm install
```

### Avvio in sviluppo

```bash
npm run dev
```

Il sito sara disponibile su http://localhost:3000

### Build di produzione

```bash
npm run build
npm start
```

---

## Struttura cartelle

```
app/
  api/rsvp/route.ts     API per il salvataggio conferme (Excel)
  globals.css            Stili globali
  layout.tsx             Layout root (font, metadata)
  page.tsx               Pagina principale — tutto il sito e qui
  error.tsx
  not-found.tsx
  global-error.tsx

data/
  rsvp.xlsx              File Excel con le conferme (generato automaticamente)

public/
  intro/
    intro.mp4            Video introduttivo
    soundtrack.mp3       Colonna sonora
  background.mp4         Video di sfondo
  media/
    background-poster.jpg
```

---

## Tecnologie

| Libreria | Utilizzo |
|---|---|
| Next.js 14 | Framework React, App Router |
| Tailwind CSS | Stili utility-first |
| Framer Motion | Animazioni, transizioni carosello |
| xlsx | Salvataggio conferme RSVP in Excel |

---

## Note operative

- Il sito e **completamente statico** — nessun database, nessun CMS
- Le conferme RSVP vengono salvate in `data/rsvp.xlsx` — scaricare il file dal server per consultarlo
- Colori e font scelti nel pannello Impostazioni si resettano al ricaricamento della pagina (sessione corrente soltanto)

---

Con amore per Salvatore & Donatella — 30.09.2026
