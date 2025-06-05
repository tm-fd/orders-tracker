"use client";

import { useEffect, useMemo } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  Button,
  Badge,
} from "@heroui/react";
import { Bell } from "lucide-react";
import { io } from "socket.io-client";
import moment from "moment";
import { useNotificationStore, NotificationType } from "@/store/notificationStore";
import usePurchaseStore from "@/store/purchaseStore";

const Notifications = () => {
  const { setActiveFilters } = usePurchaseStore();
  const {
    notifications,
    loading,
    counts,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    getCount,
  } = useNotificationStore();

  // Filter to show only SHIPPING_MISSING notifications
  const shippingNotifications = useMemo(() => {
    return notifications.filter(
      (notification) => notification.type === NotificationType.SHIPPING_MISSING || notification.type === NotificationType.TODO_REMINDER
    );
  }, [notifications]);

  // Update counts to reflect only shipping notifications
  const shippingCounts = useMemo(() => {
    return {
      total: shippingNotifications.length,
      unread: shippingNotifications.filter(n => !n.read).length
    };
  }, [shippingNotifications]);

  useEffect(() => {
    // Initial fetch with date range
    const endDate = moment().endOf('day');
    const startDate = moment().subtract(2, 'months').startOf('day');

    fetchNotifications({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      limit: 30,
    });

    // Initial count fetch
    getCount();

    // Setup WebSocket connection with normalized URL
  const baseUrl = process.env.CLOUDRUN_DEV_URL || '';
  // Ensure URL has trailing slash to match backend expectation
  const normalizedUrl = baseUrl.endsWith('/') 
    ? `${baseUrl}purchases/notifications` 
    : `${baseUrl}/purchases/notifications`;
    
  const socket = io(normalizedUrl);

  socket.on('connect', () => {
    console.log('Connected to notification socket');
  });

    socket.on('newNotification', (notification) => {
      fetchNotifications(); // Refresh notifications
      getCount(); // Update counts
    });

    socket.on('notificationUpdate', (notification) => {
      fetchNotifications(); // Refresh notifications
      getCount(); // Update counts
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      await markAsRead(notification.id, true);
    }

    if (notification.metadata?.purchaseIds?.length > 0) {
      setActiveFilters({
        purchaseIds: notification.metadata.purchaseIds,
        missingShipping: true,
      });
    }
  };

  return (
    <Dropdown placement="bottom-end" backdrop="blur">
      <DropdownTrigger>
        <Button
          variant="ghost"
          size="sm"
          className="w-9 h-9 rounded-full relative"
        >
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {shippingCounts.unread > 0 && (
            <Badge
              content={shippingCounts.unread}
              color="danger"
              shape="circle"
              size="sm"
              className="absolute -top-1 -right-1"
            />
          )}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Notifications"
        className="w-80"
        emptyContent={loading ? "Loading..." : "No shipping notifications"}
      >
        <DropdownItem
          key="notifications-header"
          className="h-14 gap-2"
          textValue="Notifications"
        >
          <div className="flex justify-between items-center w-full">
            <h3 className="text-lg font-semibold">
              Shipping Notifications ({shippingCounts.total})
            </h3>
            {shippingCounts.unread > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="text-sm"
                onPress={markAllAsRead}
              >
                Mark all as read
              </Button>
            )}
          </div>
        </DropdownItem>
        <DropdownItem key="notifications-divider" className="h-px bg-divider" />
        <DropdownSection className="max-h-[300px] overflow-y-auto">
          {shippingNotifications.map((notification) => (
            <DropdownItem
              key={notification.id}
              className={`py-2 ${!notification.read ? 'bg-default-100' : ''}`}
              textValue={notification.title}
              onPress={() => handleNotificationClick(notification)}
            >
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{notification.title}</span>
                  <span className="text-xs text-default-400">
                    {moment(notification.createdAt).fromNow()}
                  </span>
                </div>
                <p className="text-sm text-default-500">{notification.message}</p>
              </div>
            </DropdownItem>
          ))}
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
};

export default Notifications;