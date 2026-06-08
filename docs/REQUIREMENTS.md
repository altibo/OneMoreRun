# ONE MORE RUN — Requirements

Dieses Dokument definiert die funktionalen und nicht-funktionalen Anforderungen.
Status-Legende: ✅ erledigt · 🚧 in Arbeit · ⏳ geplant.

---

## 1. Funktionale Anforderungen

### 1.1 Core Gameplay

| ID | Anforderung | Version | Status |
| -- | ----------- | ------- | ------ |
| FR-01 | Spieler bewegt sich frei in einer Arena (WASD/Pfeiltasten/Touch) | 0.1 | 🚧 |
| FR-02 | Spieler greift automatisch an (Auto-Attack) | 0.1 | 🚧 |
| FR-03 | Gegner spawnen kontinuierlich mit steigender Frequenz | 0.1 | 🚧 |
| FR-04 | Gegner verursachen bei Kontakt Schaden am Spieler | 0.1 | 🚧 |
| FR-05 | Besiegte Gegner droppen XP-Gems | 0.1 | 🚧 |
| FR-06 | Spieler sammelt XP und steigt im Level auf | 0.1 | 🚧 |
| FR-07 | Bei Level-Up erscheinen 3 zufällige Upgrade-Optionen | 0.1 | 🚧 |
| FR-08 | Coins werden während des Runs gesammelt | 0.1 | 🚧 |
| FR-09 | Boss erscheint nach definierter Zeit | 0.1 | 🚧 |
| FR-10 | Bei HP = 0 endet der Run mit "RUN COMPLETE" Screen | 0.1 | 🚧 |

### 1.2 Upgrade & Synergy System

| ID | Anforderung | Version | Status |
| -- | ----------- | ------- | ------ |
| FR-20 | Mind. 20 verschiedene Upgrades verfügbar | 0.1 | 🚧 |
| FR-21 | Upgrades sind datengetrieben (Config-Dateien) | 0.1 | 🚧 |
| FR-22 | Synergien kombinieren Upgrades zu neuen Effekten | 0.1 | 🚧 |
| FR-23 | Mind. 100 Upgrades, 100 Synergien | 1.0 | ⏳ |

### 1.3 Meta Progression

| ID | Anforderung | Version | Status |
| -- | ----------- | ------- | ------ |
| FR-30 | Permanente Ressourcen nach jedem Run | 0.2 | ⏳ |
| FR-31 | Upgrade-Shop für Meta-Stats (HP, Gold, Luck, Speed, XP, etc.) | 0.2 | ⏳ |
| FR-32 | Achievements mit Tracking | 0.2 | ⏳ |
| FR-33 | Collectibles (Characters, Weapons, Skins) | 0.5 | ⏳ |

### 1.4 UI / UX

| ID | Anforderung | Version | Status |
| -- | ----------- | ------- | ------ |
| FR-40 | Main Menu: PLAY, UPGRADES, COLLECTION, SETTINGS | 0.1 | 🚧 |
| FR-41 | HUD: HP, XP, Coins, Timer, Build, Boss-Indikator | 0.1 | 🚧 |
| FR-42 | End Screen mit Run-Statistiken und PLAY AGAIN | 0.1 | 🚧 |
| FR-43 | Große, touch-freundliche Buttons | 0.1 | 🚧 |

### 1.5 Audio

| ID | Anforderung | Version | Status |
| -- | ----------- | ------- | ------ |
| FR-50 | Feedbacksounds für jede Aktion (Howler.js) | 0.1 | 🚧 |
| FR-51 | Hintergrundmusik (ruhiger Loop) | 0.1 | 🚧 |
| FR-52 | Mute / Lautstärke in Settings | 0.1 | 🚧 |

### 1.6 Persistenz

| ID | Anforderung | Version | Status |
| -- | ----------- | ------- | ------ |
| FR-60 | Automatisches Speichern in localStorage | 0.1 | 🚧 |
| FR-61 | Speichern nach Run-Ende, Achievement, Kauf, Unlock | 0.1 | 🚧 |
| FR-62 | Robustes Laden mit Default-Fallback | 0.1 | 🚧 |

---

## 2. Nicht-funktionale Anforderungen

| ID | Anforderung | Zielwert |
| -- | ----------- | -------- |
| NFR-01 | Framerate | 60 FPS (Desktop, Android, iPhone) |
| NFR-02 | Initialer Download | < 3 MB |
| NFR-03 | Ladezeit | < 3 Sekunden |
| NFR-04 | Offline-Fähigkeit | 100 % (PWA, Service Worker) |
| NFR-05 | Kein Backend | Keine Server, keine Accounts |
| NFR-06 | Mobile-First Bedienung | Touch + virtueller Stick |
| NFR-07 | Code-Qualität | TypeScript strict, ESLint, keine Magic Numbers |
| NFR-08 | Session-Dauer | 2–10 Min, ideal 5 Min |
| NFR-09 | Barrierearmut | Hoher Kontrast, große Lesbarkeit |

---

## 3. Out of Scope (v0.1)

- Online-Leaderboards / Multiplayer
- Account-System / Cloud-Sync
- In-App-Käufe
- Daily Challenges / Seed-Mode (geplant 1.0+)
