/**
 * IndexedDB Service for Notifications
 *
 * Provides offline-first storage for user and admin notifications,
 * allowing users to view alerts and keep track of read/unread states.
 */

const DB_NAME = 'ChessxuNotifications';
const DB_VERSION = 1;
const NOTIFICATIONS_STORE = 'notifications';
const TIMESTAMP_INDEX = 'timestampIndex';
const READ_INDEX = 'readIndex';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: number;
  read: boolean;
  link?: string;
  details?: Record<string, any>;
}

class NotificationDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB for notifications:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create notifications object store
        if (!db.objectStoreNames.contains(NOTIFICATIONS_STORE)) {
          const store = db.createObjectStore(NOTIFICATIONS_STORE, {
            keyPath: 'id',
          });

          // Index for sorting/querying by timestamp
          store.createIndex(TIMESTAMP_INDEX, 'timestamp', { unique: false });

          // Index for querying by read state
          store.createIndex(READ_INDEX, 'read', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Ensure database is initialized before operations
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize notification database');
    }
    return this.db;
  }

  /**
   * Save or update a notification
   */
  async saveNotification(notification: AppNotification): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([NOTIFICATIONS_STORE], 'readwrite');
      const store = transaction.objectStore(NOTIFICATIONS_STORE);
      const request = store.put(notification);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save multiple notifications in a batch
   */
  async saveNotifications(notifications: AppNotification[]): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([NOTIFICATIONS_STORE], 'readwrite');
      const store = transaction.objectStore(NOTIFICATIONS_STORE);

      let completed = 0;
      const total = notifications.length;

      if (total === 0) {
        resolve();
        return;
      }

      notifications.forEach((notif) => {
        const request = store.put(notif);

        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };

        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * Get all notifications sorted by timestamp descending
   */
  async getAllNotifications(): Promise<AppNotification[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([NOTIFICATIONS_STORE], 'readonly');
      const store = transaction.objectStore(NOTIFICATIONS_STORE);
      const index = store.index(TIMESTAMP_INDEX);
      const request = index.openCursor(null, 'prev'); // Descending

      const list: AppNotification[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          list.push(cursor.value);
          cursor.continue();
        } else {
          resolve(list);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(id: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([NOTIFICATIONS_STORE], 'readwrite');
      const store = transaction.objectStore(NOTIFICATIONS_STORE);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const notification = getRequest.result as AppNotification | undefined;
        if (notification) {
          notification.read = true;
          const putRequest = store.put(notification);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve(); // Already gone or not found
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<void> {
    const db = await this.ensureDB();
    const notifications = await this.getAllNotifications();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([NOTIFICATIONS_STORE], 'readwrite');
      const store = transaction.objectStore(NOTIFICATIONS_STORE);

      let completed = 0;
      const unread = notifications.filter((n) => !n.read);

      if (unread.length === 0) {
        resolve();
        return;
      }

      unread.forEach((notif) => {
        notif.read = true;
        const request = store.put(notif);

        request.onsuccess = () => {
          completed++;
          if (completed === unread.length) {
            resolve();
          }
        };

        request.onerror = () => reject(request.error);
      });
    });
  }

  /**
   * Delete a single notification
   */
  async deleteNotification(id: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([NOTIFICATIONS_STORE], 'readwrite');
      const store = transaction.objectStore(NOTIFICATIONS_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all notifications from IndexedDB
   */
  async clearAll(): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([NOTIFICATIONS_STORE], 'readwrite');
      const store = transaction.objectStore(NOTIFICATIONS_STORE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const notificationDB = new NotificationDB();
export default notificationDB;
