'use client';

import { useSidebarStore } from '@/store/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const Sidebar = () => {
  const isOpen = useSidebarStore((state) => state.isOpen);
  const pathname = usePathname();

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard', icon: '' },
    { name: 'Purchases', href: '/purchases', icon: '' },
  ];

  return (
    <aside
      className={`fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 transform border-r border-gray-200 dark:border-gray-700 transition-transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="h-full overflow-y-auto px-3 py-4">
        <div className="mb-5 flex items-center pl-2.5">
          <span className="self-center whitespace-nowrap text-xl font-semibold text-gray-800 dark:text-white">
            Your Logo
          </span>
        </div>
        
        <nav className="space-y-2">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center rounded-lg p-2 text-base font-normal transition-colors ${
                pathname === item.href
                  ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;