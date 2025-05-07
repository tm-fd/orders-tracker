import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  purchaseId: number;
}

interface NotificationStore {
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  markAsRead: (purchaseId: number) => void;
  markAllAsRead: () => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      notifications: [],
      setNotifications: (notifications) => set({ notifications }),
      markAsRead: (purchaseId) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.purchaseId === purchaseId ? { ...n, read: true } : n
          ),
        })),
      markAllAsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
    }),
    {
      name: 'notifications-storage',
      partialize: (state) => ({
        notifications: state.notifications,
      }),
    }
  )
);