'use client';

import { useSidebarStore } from '@/store/sidebar';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const isOpen = useSidebarStore((state) => state.isOpen);

  return (
    <div
      className={`flex-1 transition-all duration-300 ${
        isOpen ? 'ml-64' : 'ml-16'
      }`}
    >
      <main className="min-h-screen p-4">
        {children}
      </main>
    </div>
  );
}