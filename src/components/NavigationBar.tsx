'use client';

import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Link } from '@heroui/react';
import ThemeSwitcher from './ThemeSwitcher';
import Logout from './Logout';
import { useSidebarStore } from '@/store/sidebar';

const NavigationBar = ({ user }: { user: any }) => {
  const toggle = useSidebarStore((state) => state.toggle);
  const isOpen = useSidebarStore((state) => state.isOpen);
  console.log(user)
  return (
    <Navbar 
      className={`fixed top-0 z-50 border-b border-divider bg-background transition-all duration-300 px-6 ${
        isOpen ? 'ml-64 w-[calc(100%-16rem)]' : 'ml-16 w-[calc(100%-4rem)]'
      }`}
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
        {user && (
          <NavbarItem>
            <Link href="/register" color="foreground">
              Register admin
            </Link>
          </NavbarItem>
        )}
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <ThemeSwitcher />
        </NavbarItem>
        <NavbarItem>
          {user ? (
            <Logout />
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