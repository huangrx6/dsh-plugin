/**
 * Local background media. Picked files live as blobs in IndexedDB (large
 * quota, survives reloads) while the settings only carry a small `idb:`
 * marker — a multi-megabyte base64 blob would bloat every settings write.
 *
 * The helpers degrade to "unavailable" in environments without IndexedDB
 * (tests, very old engines): saving rejects, loading resolves undefined and
 * the background falls back to its color fill.
 */
const DB_NAME = "dsh-layout-media";
const DB_VERSION = 1;
const STORE = "media";
const MARKER = "idb:";

export function isLocalMedia(url: string): boolean {
  return url.startsWith(MARKER);
}

function mediaKey(url: string): string {
  return url.slice(MARKER.length);
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is unavailable"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

function run<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    db =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const request = work(tx.objectStore(STORE));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
        tx.oncomplete = () => db.close();
      }),
  );
}

/** Stores a picked file and returns the settings-facing marker URL. */
export async function saveMedia(blob: Blob): Promise<string> {
  const key = `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  await run("readwrite", store => store.put(blob, key));
  return MARKER + key;
}

/** Loads the blob behind a marker URL; undefined when missing or remote. */
export async function loadMedia(url: string): Promise<Blob | undefined> {
  if (!isLocalMedia(url)) return undefined;
  try {
    const blob = await run<Blob | undefined>("readonly", store => store.get(mediaKey(url)) as IDBRequest<Blob | undefined>);
    return blob ?? undefined;
  } catch {
    return undefined;
  }
}

/** Best-effort cleanup when a marker URL is replaced or cleared. */
export async function deleteMedia(url: string): Promise<void> {
  if (!isLocalMedia(url)) return;
  try {
    await run("readwrite", store => store.delete(mediaKey(url)));
  } catch {
    // A missing entry or an unavailable database is fine to ignore.
  }
}
