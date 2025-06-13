"use client";
import { useEffect, useMemo, useCallback, useRef, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Button,
  Badge,
  Tabs,
  Tab,
  useDisclosure,
} from "@heroui/react";
import { Bell } from "lucide-react";
import { io, Socket } from "socket.io-client";
import moment from "moment";
import {
  useNotificationStore,
  NotificationType,
} from "@/store/notificationStore";
import usePurchaseStore from "@/store/purchaseStore";

const Notifications = () => {
  const socketRef = useRef<Socket | null>(null);
  const [selectedTab, setSelectedTab] = useState("notifications");
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { setActiveFilters } = usePurchaseStore();
  const {
    notifications,
    loading,
    counts,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    getCount,
    addNotification,
    updateNotification,
  } = useNotificationStore();

  // Filter to show only SHIPPING_MISSING notifications
  const shippingNotifications = useMemo(() => {
    return notifications.filter(
      (notification) => notification.type === NotificationType.SHIPPING_MISSING
    );
  }, [notifications]);
  
  const todoReminders = useMemo(() => {
    return notifications.filter(
      (notification) => notification.type === NotificationType.TODO_REMINDER
    );
  }, [notifications]);

  // Separate counts for each type
  const notificationCounts = useMemo(
    () => ({
      shipping: {
        total: shippingNotifications.length,
        unread: shippingNotifications.filter((n) => !n.read).length,
      },
      todos: {
        total: todoReminders.length,
        unread: todoReminders.filter((n) => !n.read).length,
      },
    }),
    [shippingNotifications, todoReminders]
  );

  const setupSocketHandlers = useCallback(() => {
    if (!socketRef.current) return;
    const socket = socketRef.current;

    socket.on("newAdminNotification", (notification) => {
      console.log("New admin notification received:", notification);
      addNotification(notification);
    });

    socket.on("notificationUpdated", (notification) => {
      console.log("Notification update received:", notification);
      updateNotification(notification);
    });

    return () => {
      socket.off("newAdminNotification");
      socket.off("notificationUpdated");
    };
  }, [addNotification, updateNotification]);

  useEffect(() => {
    // Initial fetch with date range
    const endDate = moment().endOf("day");
    const startDate = moment().subtract(2, "months").startOf("day");

    fetchNotifications({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      limit: 30,
    });

    // Initial count fetch
    getCount();

    // Setup WebSocket connection with normalized URL
    const baseUrl = process.env.CLOUDRUN_DEV_URL || "";
    // Ensure URL has trailing slash to match backend expectation
    const normalizedUrl = baseUrl.endsWith("/")
      ? `${baseUrl}purchases/notifications`
      : `${baseUrl}/purchases/notifications`;

    socketRef.current = io(normalizedUrl, {
      withCredentials: true,
      transports: ["websocket"],
      autoConnect: true,
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("Socket Connected!", socket.id);
      socket.emit("joinAdminNotifications");
    });

    socket.on("connect_error", (error) => {
      console.error("Socket Connection Error:", error);
    });

    setupSocketHandlers();

    socket.on("disconnect", () => {
      console.log("Socket Disconnected!");
    });

    // Cleanup function
    return () => {
      if (socketRef.current) {
        console.log("Cleaning up socket connection...");
        socketRef.current.emit("leaveAdminNotifications");
        socketRef.current.off("newAdminNotification");
        socketRef.current.off("notificationUpdated");
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [setupSocketHandlers, fetchNotifications, getCount]);

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
  const handleTabChange = (key) => {
    setSelectedTab(key);
  };

  const totalUnread =
    notificationCounts.shipping.unread + notificationCounts.todos.unread;

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="w-9 h-9 rounded-full relative"
        onPress={onOpen}
      >
        <Bell className="h-[1.2rem] w-[1.2rem]" />
        {totalUnread > 0 && (
          <Badge
            content={totalUnread}
            color="danger"
            shape="circle"
            size="sm"
            className="absolute -top-1 -right-1"
          />
        )}
      </Button>

      <Drawer isOpen={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent key={`drawer-content-${isOpen}`}>
          {(onClose) => (
            <>
              <DrawerHeader className="flex justify-between items-center !p-6">
                <h3 className="text-lg font-semibold">Alert Center</h3>
                {totalUnread > 0 && (
                  <Button
                    size="sm"
                    variant="light"
                    className="text-sm"
                    onPress={markAllAsRead}
                  >
                    Mark all as read
                  </Button>
                )}
              </DrawerHeader>

              <DrawerBody>
                <Tabs
                  aria-label="Notification types"
                  selectedKey={selectedTab}
                  onSelectionChange={handleTabChange}
                  className="w-full"
                  disableAnimation={true} // This might help with overlay issues
                  classNames={{
                    tabList: "px-4",
                    tab: "px-4 py-2",
                    tabContent: "p-0",
                  }}
                >
                  <Tab
                    key="shipping"
                    title={
                      <div className="flex items-center gap-2">
                        Notifications
                        <span className="text-small text-default-400">
                          ({notificationCounts.shipping.total})
                        </span>
                      </div>
                    }
                  >
                    <div className="flex flex-col gap-2 overflow-x-auto">
                      {shippingNotifications.map((notification) => (
                        <Button
                          key={notification.id}
                          className={`w-full h-auto py-2 ${
                            !notification.read ? "" : "bg-default-50"
                          }}`}
                          onPress={() => handleNotificationClick(notification)}
                        >
                          <NotificationContent notification={notification} />
                        </Button>
                      ))}
                    </div>
                  </Tab>
                  <Tab
                    key="todos"
                    title={
                      <div className="flex items-center gap-2">
                        Reminders
                        <span className="text-small text-default-400">
                          ({notificationCounts.todos.total})
                        </span>
                      </div>
                    }
                  >
                    <div className="flex flex-col gap-2 overflow-x-auto">
                      {todoReminders.map((notification) => (
                        <Button
                          key={notification.id}
                          className={`w-full h-auto py-2 ${
                            !notification.read ? "" : "bg-default-50"
                          }`}
                          onPress={() => handleNotificationClick(notification)}
                        >
                          <NotificationContent notification={notification} />
                        </Button>
                      ))}
                    </div>
                  </Tab>
                </Tabs>
              </DrawerBody>

              <DrawerFooter>
                <Button variant="light" onPress={onClose}>
                  Close
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </>
  );
};

// Separate component for notification content
const NotificationContent = ({ notification }) => (
  <div className="flex flex-col gap-1 w-full items-start">
    <div className="flex justify-between items-center">
      <span className="font-semibold pr-2">
        {notification.title.toUpperCase()}
      </span>
      <span className="text-xs text-default-400">
        {moment(notification.createdAt).fromNow()}
      </span>
    </div>
    <p className="text-sm text-default-500">{notification.message}</p>
  </div>
);

export default Notifications;
