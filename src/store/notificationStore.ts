import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

export enum NotificationType {
  SHIPPING_MISSING = 'SHIPPING_MISSING',
  PURCHASE_STATUS = 'PURCHASE_STATUS',
  TRAINING_REMINDER = 'TRAINING_REMINDER',
  TODO_REMINDER = 'TODO_REMINDER'
}

interface MetadataDto {
  purchaseIds?: number[];
  orderIds?: string[];
  userIds?: string[];
  expiryDates?: Array<{ userId: string; expiryDate: Date }>;
}

interface NotificationResponseDto {
  id: number;
  title: string;
  message: string;
  type: NotificationType;
  metadata: MetadataDto;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface NotificationQueryDto {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
  startDate?: string;
  endDate?: string;
}

interface NotificationCountDto {
  total: number;
  unread: number;
}

interface NotificationStore {
  notifications: NotificationResponseDto[];
  loading: boolean;
  error: string | null;
  counts: NotificationCountDto;
  fetchNotifications: (query?: NotificationQueryDto) => Promise<void>;
  markAsRead: (notificationId: string, read: boolean) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  getCount: () => Promise<void>;
  updateCounts: (counts: NotificationCountDto) => void;
  addNotification: (notification: NotificationResponseDto) => void;
  updateNotification: (notification: NotificationResponseDto) => void;
  removeNotification: (notificationId: number) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      loading: false,
      error: null,
      counts: { total: 0, unread: 0 },

      // Add new notification in real-time
      addNotification: (notification: NotificationResponseDto) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
          counts: {
            total: state.counts.total + 1,
            unread: state.counts.unread + (notification.read ? 0 : 1)
          }
        }));
      },

      // Update existing notification in real-time
      updateNotification: (updatedNotification: NotificationResponseDto) => {
        set((state) => {
          const updatedNotifications = state.notifications.map(notification =>
            notification.id === updatedNotification.id ? updatedNotification : notification
          );

          // Recalculate unread count
          const unreadCount = updatedNotifications.filter(n => !n.read).length;

          return {
            notifications: updatedNotifications,
            counts: {
              total: state.counts.total,
              unread: unreadCount
            }
          };
        });
      },

      // Remove notification in real-time
      removeNotification: (notificationId: number) => {
        set((state) => {
          const notification = state.notifications.find(n => n.id === notificationId);
          const updatedNotifications = state.notifications.filter(n => n.id !== notificationId);

          return {
            notifications: updatedNotifications,
            counts: {
              total: state.counts.total - 1,
              unread: state.counts.unread - (notification && !notification.read ? 1 : 0)
            }
          };
        });
      },

      // Modified existing methods to work with real-time updates
      fetchNotifications: async (query?: NotificationQueryDto) => {
        try {
          set({ loading: true, error: null });
          const response = await axios.get(
            `${process.env.CLOUDRUN_DEV_URL}/purchases/notifications`,
            { params: query }
          );
          set({ 
            notifications: response.data,
            loading: false,
            counts: {
              total: response.data.length,
              unread: response.data.filter((n: NotificationResponseDto) => !n.read).length
            }
          });
        } catch (error) {
          set({ error: 'Failed to fetch notifications', loading: false });
        }
      },

      markAsRead: async (notificationId: string, read: boolean) => {
        try {
          // Optimistic update
          get().updateNotification({
            ...get().notifications.find(n => n.id === Number(notificationId))!,
            read
          });

          const response = await axios.patch(
            `${process.env.CLOUDRUN_DEV_URL}/purchases/notifications/${notificationId}/read`,
            { read }
          );

          // Update with server response
          get().updateNotification(response.data);
        } catch (error) {
          console.error('Failed to mark notification as read:', error);
          // Revert optimistic update on error
          await get().fetchNotifications();
        }
      },

      markAllAsRead: async () => {
        try {
          // Optimistic update
          set((state) => ({
            notifications: state.notifications.map(n => ({ ...n, read: true })),
            counts: { ...state.counts, unread: 0 }
          }));

          const response = await axios.patch(
            `${process.env.CLOUDRUN_DEV_URL}/purchases/notifications/mark-all-read`
          );

          // Update with server response
          set({ notifications: response.data });
          await get().getCount();
        } catch (error) {
          console.error('Failed to mark all as read:', error);
          // Revert optimistic update on error
          await get().fetchNotifications();
        }
      },

      getCount: async () => {
        try {
          const response = await axios.get(
            `${process.env.CLOUDRUN_DEV_URL}/purchases/notifications/count`
          );
          set({ counts: response.data });
        } catch (error) {
          console.error('Failed to get notification counts:', error);
          set({ counts: { total: 0, unread: 0 } });
        }
      },

      updateCounts: (counts: NotificationCountDto) => {
        set({ counts });
      },
    }),
    {
      name: 'notifications-storage',
      partialize: (state) => ({
        notifications: state.notifications,
      }),
    }
  )
);