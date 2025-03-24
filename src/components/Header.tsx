'use client';

import Link from 'next/link';
import ThemeSwitcher from './ThemeSwitcher';
import Logout from './Logout';
import { useSidebarStore } from '@/store/sidebar';

const NavigationList = ({ user }: { user: any }) => {
  return (
    <ul className="flex gap-6 flex-row">
      <li>
      <Link href="/purchases">Users</Link>
      </li>
      {user && (
        <>
          <li>
            <Link 
              href="/register"
              
            >
              Register admin
            </Link>
          </li>
        </>
      )}
    </ul>
  );
};

const Header = ({ user }: { user: any }) => {
  const toggle = useSidebarStore((state) => state.toggle);
  const isOpen = useSidebarStore((state) => state.isOpen);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-200 dark:border-gray-700 ">
      <nav className="container flex items-center justify-between h-16 px-4">
        <div className="flex items-center gap-4">
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
          <NavigationList user={user} />
        </div>
        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          {user ? (
            <Logout />
          ) : (
            <Link 
              href="/signin"
              className="text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white"
            >
              Login
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Header;