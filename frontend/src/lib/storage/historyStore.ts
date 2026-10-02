export interface TranscriptEntry {
  id: string;
  timestamp: number;
  label: string;
  word: string;
  score: number;
  isSentenceBoundary: boolean;
  rawFeatures?: number[]; // For replay
}

export interface Session {
  id: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  title: string;
  wordCount: number;
  gestureCount: number;
  sentences: string[];
}

const DB_NAME = "GesturaHistoryDB";
const DB_VERSION = 1;
const STORE_SESSIONS = "sessions";
const STORE_ENTRIES = "entries";

export class HistoryStore {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
          db.createObjectStore(STORE_SESSIONS, { keyPath: "id" });
        }
        
        if (!db.objectStoreNames.contains(STORE_ENTRIES)) {
          const entryStore = db.createObjectStore(STORE_ENTRIES, { keyPath: "id" });
          entryStore.createIndex("sessionId", "sessionId", { unique: false });
          entryStore.createIndex("timestamp", "timestamp", { unique: false });
        }
      };
    });
  }

  async saveSession(session: Session): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_SESSIONS, "readwrite");
      tx.objectStore(STORE_SESSIONS).put(session);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getSessions(): Promise<Session[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_SESSIONS, "readonly");
      const request = tx.objectStore(STORE_SESSIONS).getAll();
      request.onsuccess = () => resolve(request.result.sort((a, b) => b.startTime - a.startTime));
      request.onerror = () => reject(request.error);
    });
  }

  async saveEntry(sessionId: string, entry: TranscriptEntry): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(STORE_ENTRIES, "readwrite");
      tx.objectStore(STORE_ENTRIES).put({ ...entry, sessionId });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const historyStore = new HistoryStore();
