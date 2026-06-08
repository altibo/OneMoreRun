import { createDefaultSave, SAVE_VERSION, type SaveData } from '../save/SaveData';

const STORAGE_KEY = 'one-more-run:save';

/**
 * Lädt und speichert den persistenten Zustand in localStorage.
 * Robust gegen fehlende/kaputte Daten (Default-Fallback) und Versionsmigration.
 */
class SaveManagerImpl {
  private data: SaveData = createDefaultSave();
  private loaded = false;

  load(): SaveData {
    if (this.loaded) return this.data;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SaveData>;
        this.data = this.migrate(parsed);
      }
    } catch {
      this.data = createDefaultSave();
    }
    this.loaded = true;
    return this.data;
  }

  get(): SaveData {
    return this.loaded ? this.data : this.load();
  }

  save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // Speichern fehlgeschlagen (z. B. Private Mode) — bewusst ignoriert.
    }
  }

  update(mutator: (data: SaveData) => void): void {
    mutator(this.get());
    this.save();
  }

  reset(): void {
    this.data = createDefaultSave();
    this.save();
  }

  /** Führt Defaults mit gespeicherten Daten zusammen und setzt die Version. */
  private migrate(parsed: Partial<SaveData>): SaveData {
    const base = createDefaultSave();
    const merged: SaveData = {
      version: SAVE_VERSION,
      meta: {
        coins: parsed.meta?.coins ?? base.meta.coins,
        upgrades: { ...base.meta.upgrades, ...(parsed.meta?.upgrades ?? {}) },
      },
      stats: { ...base.stats, ...(parsed.stats ?? {}) },
      unlocks: parsed.unlocks ?? base.unlocks,
      achievements: parsed.achievements ?? base.achievements,
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
    };
    return merged;
  }
}

export const SaveManager = new SaveManagerImpl();
