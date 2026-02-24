# DayFlow – Tagesplaner & Ideensammler

DayFlow ist eine moderne Produktivitäts-App, die Tagesplanung, Aufgabenverwaltung und das Sammeln von Ideen & Webseiten in einem Tool vereint.

## Features (Phase 1 MVP)

- **Tagesplaner** – Aufgaben erstellen, erledigen und verschieben
- **Wochenplaner** – Übersicht über alle Aufgaben der Woche
- **Ideen-Board** – Notizen und Ideen als Karten (Masonry-Layout)
- **Links** – URLs mit Open Graph Vorschau speichern
- **Quick Capture FAB** – Immer sichtbarer Button für schnelle Eingabe
- **Dark/Light Mode** – System-Standard wird übernommen
- **Responsive** – Mobile-First Design

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **State:** Zustand
- **Backend:** Next.js API Routes
- **Datenbank:** Supabase (PostgreSQL + Auth + Realtime)
- **Tests:** Vitest + Playwright

## Setup

### 1. Repository klonen

```bash
git clone <repo-url>
cd dayflow
npm install
```

### 2. Supabase-Projekt erstellen

1. Gehe zu [supabase.com](https://supabase.com)
2. Erstelle ein neues Projekt
3. Führe `supabase/schema.sql` im SQL-Editor aus

### 3. Umgebungsvariablen setzen

```bash
cp .env.example .env.local
```

Fülle `.env.local` mit deinen Supabase-Credentials aus.

### 4. App starten

```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000).

## Tests

```bash
# Unit Tests
npm test

# E2E Tests (Playwright)
npm run test:e2e
```

## Docker

```bash
docker build -t dayflow .
docker run -p 3000:3000 --env-file .env.local dayflow
```

## API-Endpunkte

| Methode | Endpoint              | Beschreibung                |
|---------|-----------------------|-----------------------------|
| GET     | /api/tasks            | Alle Aufgaben laden         |
| POST    | /api/tasks            | Aufgabe erstellen           |
| GET     | /api/tasks/:id        | Einzelne Aufgabe            |
| PATCH   | /api/tasks/:id        | Aufgabe aktualisieren       |
| DELETE  | /api/tasks/:id        | Aufgabe löschen             |
| GET     | /api/ideas            | Alle Ideen laden            |
| POST    | /api/ideas            | Idee erstellen              |
| PATCH   | /api/ideas/:id        | Idee aktualisieren          |
| DELETE  | /api/ideas/:id        | Idee löschen                |
| POST    | /api/ideas/:id/convert| Idee zu Aufgabe konvertieren|
| GET     | /api/links            | Alle Links laden            |
| POST    | /api/links            | Link mit OG-Daten speichern |
| PATCH   | /api/links/:id        | Link aktualisieren          |
| DELETE  | /api/links/:id        | Link löschen                |
| GET     | /api/health           | Health Check                |
