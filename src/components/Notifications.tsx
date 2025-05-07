"use client";

import { useEffect, useCallback } from "react";
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
import usePurchaseStore from "@/store/purchaseStore";
import { useNotificationStore } from "@/store/notificationStore";

const fetchNotifications = async () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 2);
  
  const response = await fetch(
    `${process.env.CLOUDRUN_DEV_URL}/purchases/all-info-by-date-range?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`
  );
  if (!response.ok) throw new Error('Failed to fetch notifications');
  return response.json();
};

const Notifications = () => {
  const { setActiveFilters } = usePurchaseStore();
  const {
    notifications,
    setNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  const processNotifications = useCallback((statuses: any) => {
    if (!statuses) return;

    const newNotifications = Object.entries(statuses).map(([purchaseId, status]: [string, any]) => {
      if (
        status.shippingInfo === null &&
        status.additionalInfo?.[0]?.purchase_type === "START_PACKAGE" &&
        status.orderStatus?.order_id?.toString().length < 9 &&
        status.orderStatus?.status === "completed"
      ) {
        return {
          id: `shipping-${purchaseId}`,
          title: "Shipping Information Missing",
          message: `Order #${status.orderStatus?.order_id} is missing shipping information`,
          time: new Date().toLocaleString(),
          read: false,
          purchaseId: Number(purchaseId),
        };
      }
      return null;
    }).filter(Boolean);

    setNotifications(newNotifications);
  }, [setNotifications]);

  // Fetch notifications only on component mount
  useEffect(() => {
    fetchNotifications()
      .then(processNotifications)
      .catch(error => console.error('Error fetching notifications:', error));
  }, []); // Empty dependency array means this runs once on mount

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotificationClick = (purchaseId: number) => {
    setActiveFilters({ purchaseId, missingShipping: false });
    markAsRead(purchaseId);
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
                  onPress={markAllAsRead}
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