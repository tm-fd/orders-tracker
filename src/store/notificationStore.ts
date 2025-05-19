import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

export enum NotificationType {
  SHIPPING_MISSING = 'SHIPPING_MISSING',
  PURCHASE_STATUS = 'PURCHASE_STATUS',
  TRAINING_REMINDER = 'TRAINING_REMINDER'
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
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      loading: false,
      error: null,
      counts: { total: 0, unread: 0 },

      fetchNotifications: async (query?: NotificationQueryDto) => {
        try {
          set({ loading: true, error: null });
          const response = await axios.get(
            `${process.env.CLOUDRUN_DEV_URL}/purchases/notifications`,
            { params: query }
          );
          console.log(response.data)
          set({ notifications: response.data, loading: false });
        } catch (error) {
          set({ error: 'Failed to fetch notifications', loading: false });
        }
      },

      markAsRead: async (notificationId: string, read: boolean) => {
        try {
          const response = await axios.patch(
            `${process.env.CLOUDRUN_DEV_URL}/purchases/notifications/${notificationId}/read`,
            { read }
          );
          set((state) => ({
            notifications: state.notifications.map((n) =>
              n.id === notificationId ? response.data : n
            ),
          }));
          await get().getCount();
        } catch (error) {
          console.error('Failed to mark notification as read:', error);
        }
      },

      markAllAsRead: async () => {
        try {
          const response = await axios.patch(
            `${process.env.CLOUDRUN_DEV_URL}/purchases/notifications/mark-all-read`
          );
          set((state) => ({
            notifications: response.data,
          }));
          await get().getCount();
        } catch (error) {
          console.error('Failed to mark all as read:', error);
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