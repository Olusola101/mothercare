/**
 * Safe wrappers around Web Storage. Storage can be missing or throw (private windows, blocked site
 * data), so every access is wrapped and the app must keep working without it.
 */
export type StorageKind = 'local' | 'session';

function getStore(kind: StorageKind): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function readJSON(kind: StorageKind, key: string): unknown {
  try {
    const raw = getStore(kind)?.getItem(key);
    return raw ? (JSON.parse(raw) as unknown) : null;
  } catch {
    return null;
  }
}

export function writeJSON(kind: StorageKind, key: string, value: unknown): boolean {
  try {
    const store = getStore(kind);
    if (!store) return false;
    store.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(kind: StorageKind, key: string): void {
  try {
    getStore(kind)?.removeItem(key);
  } catch {
    /* ignore */
  }
}

export const STORAGE_PREFIX = 'mothercare.';

/** Removes every on-device record this app keeps for one user. */
export function eraseUserLocalData(userId: string): void {
  try {
    const store = getStore('local');
    if (!store) return;
    const doomed: string[] = [];
    for (let i = 0; i < store.length; i += 1) {
      const key = store.key(i);
      if (key && key.startsWith(STORAGE_PREFIX) && key.includes(userId)) doomed.push(key);
    }
    doomed.forEach((k) => store.removeItem(k));
  } catch {
    /* ignore */
  }
}
