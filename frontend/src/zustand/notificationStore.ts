import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppNotification, notificationDB } from '../services/notificationDB';

export interface QuietHoursConfig {
  enabled: boolean;
  startHour: number; // 0-23
  endHour: number;   // 0-23
}

export interface NotificationStore {
  // State
  notifications: AppNotification[];
  unreadCount: number;
  
  // Farcaster V2 Push Token Info
  farcasterPushToken: string | null;
  farcasterPushUrl: string | null;
  farcasterPushEnabled: boolean;
  
  // Settings / Preferences
  enabledAlerts: Record<string, boolean>;
  enabledChannels: Record<string, boolean>;
  webhookUrl: string;
  quietHours: QuietHoursConfig;

  // Actions
  loadNotifications: () => Promise<void>;
  addNotification: (notification: Omit<AppNotification, 'read'>) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  
  // Farcaster registration actions
  setFarcasterPushDetails: (token: string, url: string) => void;
  setFarcasterPushEnabled: (enabled: boolean) => void;
  
  // Preference actions
  toggleAlert: (alertId: string) => void;
  toggleChannel: (channel: string) => void;
  setWebhookUrl: (url: string) => void;
  setQuietHours: (config: Partial<QuietHoursConfig>) => void;
}

const DEFAULT_ALERTS = {
  game_joined: true,
  game_resolved: true,
  opponent_resigned: true,
  leaderboard_rank: true,
  wager_milestone: true,
  daily_games_record: true,
  paymaster_balance_low: true,
  contract_paused: true,
  unusual_activity: true,
  weekly_digest: true,
};

const DEFAULT_CHANNELS = {
  in_app: true,
  farcaster_push: true,
  webhook: false,
};

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      // State
      notifications: [],
      unreadCount: 0,
      
      farcasterPushToken: null,
      farcasterPushUrl: null,
      farcasterPushEnabled: false,

      enabledAlerts: DEFAULT_ALERTS,
      enabledChannels: DEFAULT_CHANNELS,
      webhookUrl: '',
      quietHours: {
        enabled: false,
        startHour: 22,
        endHour: 8,
      },

      // Actions
      loadNotifications: async () => {
        try {
          const list = await notificationDB.getAllNotifications();
          const unreadCount = list.filter((n) => !n.read).length;
          set({ notifications: list, unreadCount });
        } catch (e) {
          console.error('Failed to load notifications from DB:', e);
        }
      },

      addNotification: async (notifData) => {
        const fullNotif: AppNotification = {
          ...notifData,
          read: false,
        };

        // Check user alert preference
        const isAlertEnabled = get().enabledAlerts[fullNotif.type] ?? true;
        if (!isAlertEnabled) {
          return;
        }

        // Check quiet hours
        const quiet = get().quietHours;
        if (quiet.enabled) {
          const currentHour = new Date().getHours();
          if (quiet.startHour > quiet.endHour) {
            // Over midnight (e.g. 22:00 to 08:00)
            if (currentHour >= quiet.startHour || currentHour < quiet.endHour) {
              return;
            }
          } else {
            // Standard (e.g. 09:00 to 17:00)
            if (currentHour >= quiet.startHour && currentHour < quiet.endHour) {
              return;
            }
          }
        }

        try {
          await notificationDB.saveNotification(fullNotif);
          const list = [fullNotif, ...get().notifications];
          set({
            notifications: list,
            unreadCount: list.filter((n) => !n.read).length,
          });
        } catch (e) {
          console.error('Failed to save notification:', e);
        }
      },

      markAsRead: async (id) => {
        try {
          await notificationDB.markAsRead(id);
          const updated = get().notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          );
          set({
            notifications: updated,
            unreadCount: updated.filter((n) => !n.read).length,
          });
        } catch (e) {
          console.error('Failed to mark notification as read:', e);
        }
      },

      markAllAsRead: async () => {
        try {
          await notificationDB.markAllAsRead();
          const updated = get().notifications.map((n) => ({ ...n, read: true }));
          set({
            notifications: updated,
            unreadCount: 0,
          });
        } catch (e) {
          console.error('Failed to mark all notifications as read:', e);
        }
      },

      deleteNotification: async (id) => {
        try {
          await notificationDB.deleteNotification(id);
          const updated = get().notifications.filter((n) => n.id !== id);
          set({
            notifications: updated,
            unreadCount: updated.filter((n) => !n.read).length,
          });
        } catch (e) {
          console.error('Failed to delete notification:', e);
        }
      },

      clearAllNotifications: async () => {
        try {
          await notificationDB.clearAll();
          set({
            notifications: [],
            unreadCount: 0,
          });
        } catch (e) {
          console.error('Failed to clear notifications:', e);
        }
      },

      setFarcasterPushDetails: (token, url) => {
        set({ farcasterPushToken: token, farcasterPushUrl: url });
      },

      setFarcasterPushEnabled: (enabled) => {
        set({ farcasterPushEnabled: enabled });
      },

      toggleAlert: (alertId) => {
        const current = get().enabledAlerts;
        set({
          enabledAlerts: {
            ...current,
            [alertId]: !current[alertId],
          },
        });
      },

      toggleChannel: (channel) => {
        const current = get().enabledChannels;
        set({
          enabledChannels: {
            ...current,
            [channel]: !current[channel],
          },
        });
      },

      setWebhookUrl: (url) => {
        set({ webhookUrl: url });
      },

      setQuietHours: (config) => {
        set({
          quietHours: {
            ...get().quietHours,
            ...config,
          },
        });
      },
    }),
    {
      name: 'chessxu-notifications-prefs',
      partialize: (state) => ({
        enabledAlerts: state.enabledAlerts,
        enabledChannels: state.enabledChannels,
        webhookUrl: state.webhookUrl,
        quietHours: state.quietHours,
        farcasterPushToken: state.farcasterPushToken,
        farcasterPushUrl: state.farcasterPushUrl,
        farcasterPushEnabled: state.farcasterPushEnabled,
      }),
    }
  )
);
