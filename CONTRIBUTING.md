# Contributing to One More Run

## Entwicklungs-Setup

```bash
npm install
npm run dev
```

## Coding Principles

- **Keine Magic Numbers** — Werte gehören in `src/config/`.
- **Klare Klassen** mit Single Responsibility.
- **Lose Kopplung** — Kommunikation über den `EventBus`.
- **TypeScript strict** — keine `any` ohne triftigen Grund.
- **Datengetrieben** — Gameplay-Inhalte als Konfiguration, nicht hartcodiert.

## Code Style

- ESLint + TypeScript strict mode.
- Lint vor jedem Commit: `npm run lint`.
- Aussagekräftige Namen, kurze Funktionen, keine toten Pfade.

## Commit-Konventionen

[Conventional Commits](https://www.conventionalcommits.org/):

```
feat: neues Feature
fix: Bugfix
docs: Dokumentation
refactor: Umbau ohne Verhaltensänderung
chore: Tooling/Build
```

## Ultimate Design Rule

Jede Änderung muss diese Frage bestehen:

> Erhöht diese Funktion die Wahrscheinlichkeit, dass der Spieler nach dem Ende
> einer Runde auf **"PLAY AGAIN"** klickt?

Wenn nicht eindeutig "Ja", wird die Funktion vereinfacht oder entfernt.
