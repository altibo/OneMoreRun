# ONE MORE RUN

> Ein minimalistisches Casual-Roguelite für Browser und Mobilgeräte.

**One More Run** verfolgt ein einziges Ziel: Der Spieler soll nach jeder Runde
sofort eine weitere Runde starten wollen. Jede Designentscheidung – Mechanik, UI,
Progression und Balancing – ordnet sich diesem Prinzip unter.

---

## Features (v0.1)

- ⚡ Sofortiger Spielstart, keine Tutorials
- 🎮 Auto-Attack Gameplay mit Fokus auf Positionierung und Build
- 🔼 Level-Up Upgrade-Auswahl (3 zufällige Optionen)
- 🔗 Synergie-System (Upgrades verändern andere Upgrades)
- 🏆 Meta-Progression mit permanenten Ressourcen
- 💾 Lokales Savegame (localStorage), kein Backend
- 📱 PWA – installierbar, offline spielbar

---

## Tech Stack

| Bereich      | Technologie        |
| ------------ | ------------------ |
| Framework    | Phaser 3           |
| Sprache      | TypeScript         |
| Build Tool   | Vite               |
| Audio        | Howler.js          |
| Storage      | localStorage       |
| Deployment   | Cloudflare Pages / GitHub Pages |
| App Mode     | Progressive Web App |

---

## Quick Start

```bash
# Abhängigkeiten installieren
npm install

# Dev-Server starten (http://localhost:5173)
npm run dev

# Production Build
npm run build

# Production Build lokal testen
npm run preview
```

---

## Performance Goals

- 60 FPS auf Desktop, Android und iPhone
- Initial Download < 3 MB
- Ladezeit < 3 Sekunden
- Vollständig offline lauffähig, keine Registrierung

---

## Dokumentation

| Dokument | Beschreibung |
| -------- | ------------ |
| [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) | Vollständige Game Design & Technical Spec |
| [docs/REQUIREMENTS.md](docs/REQUIREMENTS.md) | Funktionale & nicht-funktionale Anforderungen |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technische Architektur & Code-Struktur |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Versionsplanung 0.1 → 1.0 |
| [CHANGELOG.md](CHANGELOG.md) | Versionshistorie |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Entwicklungsrichtlinien |

---

## Ultimate Design Rule

> Erhöht diese Funktion die Wahrscheinlichkeit, dass der Spieler nach dem Ende
> einer Runde auf **"PLAY AGAIN"** klickt?

Wenn die Antwort nicht eindeutig "Ja" lautet, wird die Funktion vereinfacht oder entfernt.

---

## License

MIT – siehe [LICENSE](LICENSE).
