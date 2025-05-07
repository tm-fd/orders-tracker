"use client";

import { useEffect, useState } from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DropdownSection,
  Button,
  Badge,
  Link,
} from "@heroui/react";
import { Bell } from "lucide-react";
import usePurchaseStore from "@/store/purchaseStore";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  purchaseId: number;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const {
    fetchPurchaseStatusesByDateRange,
    purchaseStatuses,
    setActiveFilters,
    clearActiveFilters,
  } = usePurchaseStore();

  useEffect(() => {
    const fetchData = async () => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 2);

      await fetchPurchaseStatusesByDateRange(startDate, endDate);
    };
    const initialTimeout = setTimeout(() => {
      fetchData();
    }, 5000);
    return () => clearTimeout(initialTimeout);
  }, [fetchPurchaseStatusesByDateRange]);

  useEffect(() => {
    const newNotifications: Notification[] = [];

    Object.entries(purchaseStatuses).forEach(([purchaseId, status]) => {
      if (
        status.shippingInfo === null &&
        status.additionalInfo?.[0]?.purchase_type === "START_PACKAGE" &&
        status.orderStatus?.order_id?.toString().length < 9 &&
        status.orderStatus?.status === "completed"
      ) {
        console.log(purchaseId, status);
        newNotifications.push({
          id: `shipping-${purchaseId}`,
          title: "Shipping Information Missing",
          message: `Order #${status.orderStatus?.order_id} is missing shipping information`,
          time: new Date().toLocaleString(),
          read: false,
          purchaseId: Number(purchaseId),
        });
      }
    });
    setNotifications(newNotifications);
  }, [purchaseStatuses]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (purchaseId: number) => {
    setActiveFilters({ purchaseId, missingShipping: false });
    // mark the notification as read
    setNotifications(notifications.map(n => 
      n.purchaseId === purchaseId ? { ...n, read: true } : n
    ));
  };

  const handleShowAllMissingShipping = () => {
    setActiveFilters({ missingShipping: true, purchaseId: undefined });
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
          {unreadCount > 0 && (
            <Badge
              content={unreadCount}
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
        emptyContent="No notifications yet"
      >
        <DropdownItem
          key="notifications-header"
          className="h-14 gap-2"
          textValue="Notifications"
        >
          <div className="flex justify-between items-center w-full">
            <h3 className="text-lg font-semibold">Notifications</h3>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-sm"
                  onPress={handleMarkAllAsRead}
                >
                  Mark all as read
                </Button>
              )}
            </div>
          </div>
        </DropdownItem>
        <DropdownItem key="notifications-divider" className="h-px bg-divider" />
        <DropdownSection className="max-h-[300px] overflow-y-auto">
          {notifications.map((notification) => (
            <DropdownItem
              key={notification.id}
              className={`py-2 ${!notification.read ? 'bg-default-100' : ''} cursor-pointer`}
              textValue={notification.title}
              onClick={() => handleNotificationClick(notification.purchaseId)}
            >
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">{notification.title}</span>
                  <span className="text-xs text-default-400">{notification.time}</span>
                </div>
                <p className="text-sm text-default-500">{notification.message}</p>
              </div>
            </DropdownItem>
          ))}
        </DropdownSection>
        <DropdownItem 
          key="show-all-missing-shipping" 
          className="h-14 gap-2"
        >
          <Button
            size="sm"
            variant="flat"
            color="secondary"
            className="w-full"
            onPress={handleShowAllMissingShipping}
          >
            Show All Missing Shipping
          </Button>
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
};

export default Notifications;
