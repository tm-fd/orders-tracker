"use client";

import { useState } from "react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar,
  User,
  Button,
  Badge,
} from "@heroui/react";
import ThemeSwitcher from "./ThemeSwitcher";
import Logout from "./Logout";
import { useSidebarStore } from "@/store/sidebar";
import { Bell, ChevronDown } from "lucide-react";
import Notifications from "./Notifications";

const NavigationBar = ({ user }: { user: any }) => {
  const toggle = useSidebarStore((state) => state.toggle);
  const isOpen = useSidebarStore((state) => state.isOpen);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Navbar
      className={`fixed top-0 z-50 border-b border-divider bg-background transition-all duration-300 px-6 
        ${isOpen ? "ml-64 w-[calc(100%-16rem)]" : "ml-16 w-[calc(100%-4rem)]"}
        `}
      maxWidth="full"
    >
      <button
        onClick={toggle}
        className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800 transition-colors"
        aria-label="Toggle Sidebar"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>
      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        {user?.role === "ADMIN" && (
          <NavbarItem>
            <Link href="/register" color="foreground">
              Register admin
            </Link>
          </NavbarItem>
        )}
      </NavbarContent>

      <NavbarContent justify="end" className="gap-4">
        <NavbarItem>
          <Notifications />
        </NavbarItem>
        <NavbarItem>
          <ThemeSwitcher />
        </NavbarItem>
        <NavbarItem>
          {user ? (
            <Dropdown
              placement="bottom-end"
              onOpenChange={(open) => setIsDropdownOpen(open)}
            >
              <DropdownTrigger>
              <div className="flex items-center gap-2">
                <User
                  as="button"
                  avatarProps={{
                    isBordered: true,
                    src: user.image || undefined,
                    name: getInitials(user.name),
                    size: "sm",
                  }}
                  className="transition-transform pt-1"
                  name={user.name}
                />
                <ChevronDown
                    size={20}
                    className={`transition-transform duration-200 mt-1 ${
                      isDropdownOpen ? "rotate-180" : "rotate-0"
                    }`}
                  />
                  </div>
              </DropdownTrigger>
              <DropdownMenu aria-label="User menu">
                <DropdownItem
                  key="profile"
                  className="h-14 gap-2"
                  textValue="Profile"
                >
                  <User
                    name={user.name}
                    description={user.email}
                    classNames={{
                      name: "text-default-600",
                      description: "text-default-500",
                    }}
                  />
                </DropdownItem>
                <DropdownItem key="settings" textValue="Settings">
                  Settings
                </DropdownItem>
                <DropdownItem
                  key="logout"
                  color="danger"
                  className="text-danger"
                  textValue="Logout"
                >
                  <Logout />
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          ) : (
            <Link href="/signin" color="foreground">
              Login
            </Link>
          )}
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
};

export default NavigationBar;
