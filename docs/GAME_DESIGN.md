# ONE MORE RUN — Game Design & Technical Specification v1.0

## Vision

**One More Run** ist ein minimalistisches Casual-Roguelite für Browser und Mobilgeräte.

Das Spiel verfolgt ein einziges Ziel:

> Der Spieler soll nach jeder Runde sofort eine weitere Runde starten wollen.

Die komplette Spielmechanik, das UI, die Progression und das Balancing orientieren
sich an diesem Prinzip.

---

## Design Philosophy

### Core Principles

- Easy to learn
- Hard to master
- No tutorial required
- Constant progression
- Short sessions
- Infinite replayability

Jede Entscheidung muss diese Prinzipien unterstützen.

---

## Target Audience

- Männer 25–40 Jahre
- Technikaffin
- Casual Gamer
- Browserspieler
- Mobile Spieler
- Spielzeit zwischen 2 und 10 Minuten

---

## Technology Stack

- **Framework:** Phaser 3
- **Language:** TypeScript
- **Build Tool:** Vite
- **Audio:** Howler.js
- **Storage:** localStorage
- **Deployment:** Cloudflare Pages, GitHub Pages
- **App Mode:** Progressive Web App (PWA)

---

## Performance Goals

- 60 FPS (Desktop, Android, iPhone)
- Initial Download < 3 MB
- Ladezeit < 3 Sekunden
- No Backend Required — vollständig offline, keine Registrierung, keine Accounts, keine Server

---

## Art Direction

- Minimalistisch
- Saubere Geometrie
- Pixel Art oder einfache Vektorgrafik
- Wenige Farben
- Hoher Kontrast
- Große Lesbarkeit auf Smartphones
- Animation wichtiger als Detailgrad

---

## Audio Direction

Kurze Feedbacksounds. Jede Aktion erzeugt eine akustische Rückmeldung:

- Treffer
- Coin
- Explosion
- Level Up
- Boss
- Seltene Beute

Musik: kurzer Loop, ruhig, elektronisch, nicht aufdringlich.

---

## Controls

**Desktop:** WASD, Pfeiltasten, Maus
**Mobile:** Touch, virtueller Stick

Keine komplizierten Gesten.

---

## Game Loop

```
Start → Spiel beginnt sofort → Gegner erscheinen → Gegner besiegen →
XP sammeln → Level Up → Upgrade wählen → Build wird stärker →
Mehr Gegner → Boss → Tod → Meta-Belohnung → Neue Runde
```

---

## Session Length

- Ideal: 5 Minuten
- Minimum: 2 Minuten
- Maximum: 10 Minuten

---

## Gameplay

Der Spieler bewegt sich frei in einer Arena. Automatische Angriffe.
Der Fokus liegt auf Positionierung, Build und Upgradeentscheidungen —
nicht auf komplizierter Steuerung.

---

## Difficulty Curve

```
ruhig → leicht → fordernd → chaotisch → Boss → Belohnung → Reset
```

---

## Core Gameplay Rules

- Der Spieler darf niemals stillstehen.
- Alle 5–10 Sekunden passiert etwas Positives.
- Alle 30–60 Sekunden erscheint eine Upgradeauswahl.
- Alle 60–120 Sekunden erscheint ein neues Gameplayelement.

---

## Upgrade System

Alle Level Ups zeigen drei zufällige Optionen. Beispiele:

```
+20 % Damage | +15 % Speed | +1 Projectile | Poison | Explosion |
Magnet | Critical Chance | Shield | Fire Aura
```

---

## Synergy System

Das Herzstück des Spiels. Ein Upgrade soll weitere Upgrades verändern.

| Kombination | Ergebnis |
| ----------- | -------- |
| Fire + Poison | Toxic Explosion |
| Laser + Chain Lightning | Electric Beam |
| Critical + Explosion | Critical Explosion |

Der Spieler soll ständig neue Kombinationen entdecken.

---

## Meta Progression

Nach jeder Runde erhält der Spieler permanente Ressourcen. Investierbar in:

- Start HP
- Start Gold
- Luck
- Movement Speed
- XP Bonus
- Projectile Size
- Critical Chance

Jede Runde ist sinnvoll. Es gibt keine verlorene Zeit.

---

## Randomization

Jede Runde erzeugt zufällig: Enemy Spawn, Boss, Upgrade Pool, Loot, Events, Drops.
Dadurch entstehen jedes Mal neue Builds.

---

## Reward Frequency

Der Spieler erhält ständig positives Feedback: XP, Coins, Sounds, Animationen,
Achievements, Level Ups, Loot, neue Synergien, neue Effekte.

---

## Collectibles

Freischaltbar: Characters, Weapons, Backgrounds, Titles, Icons, Music,
Particle Effects, Trails.

---

## Achievements

Viele kleine Ziele:

```
Kill 100 Enemies | Kill 1000 Enemies | Reach Level 25 | Reach Level 50 |
Find Legendary Item | Win without Damage | Play 100 Runs
```

---

## User Interface

Minimalistisch. Große Buttons. Keine verschachtelten Menüs.

**HUD:** HP, XP, Coins, Timer, Current Build, Boss Indicator

### Main Menu

```
ONE MORE RUN
PLAY | UPGRADES | COLLECTION | SETTINGS
```

### End Screen

Nicht "Game Over". Stattdessen:

```
RUN COMPLETE
Enemies defeated | Coins earned | New Unlocks |
Achievements | Best Build | PLAY AGAIN
```

Der Fokus liegt auf Motivation, nicht auf Niederlage.

---

## Visual Feedback

- **Treffer:** Shake, Particles, Numbers, Sound, Explosion
- **Seltene Drops:** Goldener Effekt, besonderer Sound, Leuchten
- **Level Up:** Kurze Zeitlupe, Zoom, großer Schriftzug

---

## Technical Architecture

```
src/
  assets/
    audio/
    sprites/
  entities/
  weapons/
  upgrades/
  systems/
  managers/
  scenes/
  ui/
  config/
  save/
  main.ts
```

---

## Coding Principles

- Keine Magic Numbers
- Klare Klassen
- Lose Kopplung
- Event-System
- Konfigurationsdateien für: Weapons, Enemies, Upgrades, Loot, Balancing

---

## Save System

Automatisches Speichern nach: Run Ende, Achievement, Upgrade Kauf, Unlock.

---

## Monetization Philosophy

Optional. Keine spielentscheidenden Käufe. Nur: Skins, Musik, Partikel, Farbschemata.

---

## Future Extensions

Neue Maps, Charaktere, Waffen, Bosse, Events, Daily Challenge, Seed Mode,
Speedrun Mode, Leaderboard.

---

## Ultimate Design Rule

> Erhöht diese Funktion die Wahrscheinlichkeit, dass der Spieler nach dem Ende
> einer Runde auf **"PLAY AGAIN"** klickt?

Wenn die Antwort nicht eindeutig "Ja" lautet, wird die Funktion vereinfacht oder entfernt.
