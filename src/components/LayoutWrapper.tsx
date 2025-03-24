'use client';

import { useSidebarStore } from '@/store/sidebar';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const isOpen = useSidebarStore((state) => state.isOpen);

  return (
    <div
      className={`flex-1 transition-all duration-300 ${
        isOpen ? 'ml-64' : 'ml-0'
      }`}
    >
      <main className="min-h-[calc(100vh-4rem)] p-4">{children}</main>
    </div>
  );
}