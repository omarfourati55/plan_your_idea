# 📋 Produktanforderungen – DayFlow

### Tagesplaner & Ideensammler – Vollständiges Anforderungsdokument

---

## 1. Produktvision

**DayFlow** ist eine plattformübergreifende Produktivitäts-App, die Tagesplanung, Aufgabenverwaltung und das Sammeln von Ideen & Webseiten in einem einzigen, übersichtlichen Tool vereint. Ziel ist es, den mentalen Overhead des Alltags zu reduzieren – alles landet an einem Ort, ist jederzeit abrufbar und wird durch KI intelligent unterstützt.

---

## 2. Zielplattformen

| Plattform | Priorität | Anmerkung |
|---|---|---|
| Web App (Browser) | Hoch | Primäre Entwicklungsplattform |
| iOS App | Hoch | Native oder PWA/Hybrid |
| Android App | Hoch | Native oder PWA/Hybrid |
| Desktop App | Mittel | Electron oder Tauri (Win/Mac/Linux) |

---

## 3. Empfohlener Tech-Stack

### Frontend

- **Framework:** Next.js 14+ (App Router) – für Web, SSR/SSG, optimale Performance
- **Mobile:** React Native (Expo) – Code-Sharing mit Web, iOS & Android aus einer Codebase
- **Desktop:** Tauri (leichtgewichtig, Rust-basiert) oder Electron als Fallback
- **Styling:** Tailwind CSS + shadcn/ui Komponenten

### Backend

- **API:** Next.js API Routes oder separates Node.js/Express Backend
- **Datenbank:** PostgreSQL (via Supabase – bietet Auth, Realtime & Storage out-of-the-box)
- **Auth:** Supabase Auth (Email/Passwort, Google OAuth, Apple Sign-In)
- **Sync:** Supabase Realtime (WebSockets für Live-Sync zwischen Geräten)
- **KI:** Anthropic Claude API (Ideen-Vorschläge, Task-Priorisierung, Zusammenfassungen)
- **Link-Preview:** Open Graph API (og-scraper o.ä.) für Webseiten-Vorschau

### Hosting

- **Frontend/Web:** Vercel
- **Backend:** Supabase (managed) + Vercel Edge Functions
- **Mobile:** App Store & Google Play Store (via Expo EAS Build)

---

## 4. Features & Anforderungen

---

### 4.1 🗓️ Tagesplaner & Tasks *(Priorität 1)*

#### 4.1.1 Tagesansicht

- Der Nutzer sieht beim Öffnen der App immer den **heutigen Tag** als Standard
- Zeitbasierte Timeline-Ansicht (z.B. 06:00 – 23:00 Uhr)
- Aufgaben können per Drag & Drop in Zeitslots gezogen werden
- Schnell-Eingabe: Mit einem Klick/Tap eine neue Aufgabe für heute anlegen (kein Modal nötig)

#### 4.1.2 Aufgabenverwaltung

- Aufgabe erstellen mit: Titel, Beschreibung (optional), Fälligkeitsdatum, Uhrzeit, Priorität (Hoch/Mittel/Niedrig), Tags/Kategorie
- Aufgabe als **erledigt markieren** (Checkbox, Wischgeste auf Mobile)
- Erledigte Aufgaben werden durchgestrichen und in einen "Erledigt"-Bereich verschoben
- Wiederkehrende Aufgaben (täglich, wöchentlich, benutzerdefiniert)
- Unteraufgaben (Checkliste innerhalb einer Aufgabe)
- Aufgaben zwischen Tagen verschieben ("auf morgen schieben")

#### 4.1.3 Kalenderansicht

- Monats-, Wochen- und Tagesansicht wechselbar
- Aufgaben und Termine in der Kalenderansicht sichtbar
- Externe Kalender-Import (iCal/Google Calendar Sync) – Phase 2

#### 4.1.4 Fokus-Modus

- "Heute"-Liste: Nur die Aufgaben des aktuellen Tages sichtbar
- Pomodoro-Timer integriert (25 Min Arbeit / 5 Min Pause)
- Aktuelle Aufgabe wird groß angezeigt

---

### 4.2 💡 Ideen & Links sammeln *(Priorität 2)*

#### 4.2.1 Ideen-Board

- Freie Notizen und Ideen erfassen (Text, Stichpunkte, längerer Text)
- Kategorien/Tags selbst definieren (z.B. "Business", "Design", "Persönlich")
- Ideen als **Karten** dargestellt (Masonry/Board-Layout)
- Ideen können zu Aufgaben konvertiert werden ("Aus Idee Task machen")
- Farbmarkierung der Karten

#### 4.2.2 Webseiten & Links sammeln

- URL einfügen → App lädt automatisch **Titel, Beschreibung & Vorschaubild** (Open Graph)
- Browser-Extension (Phase 2): Aktuelle Seite mit einem Klick speichern
- Links können Kategorien und Tags zugewiesen werden
- Links als "gelesen" / "später lesen" markieren
- Suchfunktion über alle gespeicherten Links
- Links-Ansicht: Liste oder Kachel-Ansicht

#### 4.2.3 Quick Capture

- Floating Action Button (FAB) in der App: Immer sichtbar, öffnet schnelles Eingabefeld
- Automatische Erkennung: Wenn eine URL eingefügt wird → als Link gespeichert, sonst als Idee
- Spracheingabe (optional, Phase 2)

---

### 4.3 🤖 KI-Unterstützung *(Priorität 3)*

Alle KI-Features nutzen die **Anthropic Claude API** im Backend.

#### 4.3.1 Tages-Briefing

- Morgens (konfigurierbare Uhrzeit) erhält der Nutzer ein KI-generiertes Tages-Briefing:
  - Zusammenfassung der heutigen Aufgaben
  - Priorisierungsvorschlag ("Diese 3 Dinge sind heute am wichtigsten")
  - Motivierender Einstiegssatz

#### 4.3.2 Task-Vorschläge & Priorisierung

- KI analysiert offene Tasks und schlägt eine sinnvolle Reihenfolge vor
- Bei überlasteten Tagen: "Du hast 12 Tasks – ich empfehle, diese 4 heute zu erledigen"
- Vorschlag: Welche Aufgaben auf morgen verschoben werden können

#### 4.3.3 Ideen-Assistent

- Nutzer kann eine Idee markieren und "Weiterentwickeln" klicken
- KI gibt strukturierte Vorschläge (Nächste Schritte, Fragen zum Nachdenken, verwandte Ideen)
- Idee in Projekt-Plan umwandeln lassen (KI erstellt Task-Liste aus einer Idee)

#### 4.3.4 Link-Zusammenfassung

- Gespeicherte Links können per KI zusammengefasst werden ("Was ist der Kern dieses Artikels?")
- Wichtigste Punkte als Stichpunkte extrahieren

#### 4.3.5 Wochenrückblick

- Jeden Sonntag optionaler KI-Rückblick:
  - Erledigte Aufgaben der Woche
  - Produktivitätsmuster ("Du erledigst Aufgaben meistens zwischen 9-11 Uhr")
  - Vorschläge für die kommende Woche

---

### 4.4 🔄 Sync zwischen Geräten *(Priorität 4)*

- Echtzeit-Synchronisation über alle Geräte (Supabase Realtime)
- Offline-Fähigkeit: App funktioniert ohne Internet, Änderungen werden beim nächsten Verbinden synchronisiert (Offline-First mit lokaler Datenbank, z.B. SQLite via Expo SQLite oder IndexedDB im Web)
- Konfliktlösung: Last-Write-Wins mit Timestamp, bei Konflikten Nutzer benachrichtigen
- Sync-Status sichtbar in der App (kleines Sync-Icon)

---

## 5. Benutzeroberfläche & UX

### 5.1 Design-Prinzipien

- **Minimalistisch & fokussiert**: Keine Ablenkung, klare Hierarchie
- **Dark Mode & Light Mode**: System-Standard wird übernommen, manuell umschaltbar
- **Mobile-First**: Touch-Gesten, große Tap-Targets, Bottom Navigation auf Mobile
- **Schnelligkeit**: Alle Kernaktionen in max. 2 Taps/Klicks erreichbar

### 5.2 Navigation

- **Bottombar (Mobile):** Heute | Planer | Ideen | Links | Einstellungen
- **Sidebar (Desktop/Web):** Gleiche Punkte als Sidebar-Navigation
- **Floating Action Button (FAB):** Immer sichtbar für Quick Capture

### 5.3 Onboarding

- 3-Screen Onboarding beim ersten Start (Was kann die App, kurze Tour)
- Direkt loslegen ohne Pflicht-Registrierung (lokaler Modus, später Account verbinden)

---

## 6. Authentifizierung & Accounts

- Nutzung ohne Account (lokal, kein Sync)
- Registrierung via: E-Mail + Passwort, Google OAuth, Apple Sign-In (für iOS Pflicht)
- Passwort vergessen / Reset Flow
- Account löschen (DSGVO-konform)
- Profil: Name, Avatar, Zeitzone

---

## 7. Benachrichtigungen

- Push-Benachrichtigungen auf Mobile (iOS & Android)
- Tages-Briefing zur konfigurierbaren Uhrzeit
- Aufgaben-Erinnerungen (X Minuten/Stunden vor Fälligkeit)
- Pomodoro-Timer Benachrichtigungen
- Alle Benachrichtigungen einzeln ein-/ausschaltbar

---

## 8. Datenschutz & Sicherheit

- Daten werden auf EU-Servern gespeichert (DSGVO-Konformität)
- Daten sind dem Nutzer zugehörig – kein Verkauf an Dritte
- Verschlüsselung in Transit (TLS) und at Rest
- Möglichkeit: Vollständigen Daten-Export (JSON) aus den Einstellungen
- KI-Feature ist opt-in (nicht zwingend aktiviert)

---

## 9. Phasen & Roadmap

### Phase 1 – MVP (Kern-Features)

- [ ] Tagesplaner mit Aufgaben erstellen/erledigen/verschieben
- [ ] Ideen als Notizen erfassen
- [ ] Links mit Vorschau speichern
- [ ] User Auth (Email + Google)
- [ ] Sync zwischen Web & Mobile (Supabase)
- [ ] Dark/Light Mode

### Phase 2 – KI & Erweiterungen

- [ ] Claude API Integration (Briefing, Priorisierung, Ideen-Assistent)
- [ ] Browser Extension
- [ ] Kalender-Sync (Google Calendar)
- [ ] Wochenrückblick
- [ ] Wiederkehrende Aufgaben

### Phase 3 – Community & Power Features

- [ ] Geteilte Projekte / Kollaboration
- [ ] Templates für Tagesplanung
- [ ] Widgets (iOS/Android Home Screen)
- [ ] Apple Watch / Wear OS Companion

---

## 10. Nicht-funktionale Anforderungen

| Anforderung | Zielwert |
|---|---|
| Ladezeit (erster Start) | < 2 Sekunden |
| Ladezeit (Navigieren) | < 300ms |
| Verfügbarkeit | 99,5% Uptime |
| KI-Antwortzeit | < 5 Sekunden |
| Offline-Fähigkeit | Kernfunktionen ohne Internet |
| Barrierefreiheit | WCAG 2.1 AA |

---

## 11. Offene Fragen (vor Entwicklungsstart klären)

1. Soll es eine **kostenlose Basisversion + Premium-Abo** geben? (z.B. KI-Features nur in Premium)
2. Welche **Sprachen** sollen unterstützt werden? (Deutsch, Englisch als Start?)
3. Gibt es ein **Budget-Limit** für die KI-API-Nutzung pro Nutzer?
4. Soll ein **Team/Sharing-Feature** von Anfang an eingeplant werden?
5. Gewünschter **App-Name** und Branding-Richtlinien vorhanden?

---

*Dokument erstellt: Februar 2026 | Version 1.0*
