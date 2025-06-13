'use client';

import { useSidebarStore } from '@/store/sidebar';
import { useEffect } from 'react';

export function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const isOpen = useSidebarStore((state) => state.isOpen);

  useEffect(() => {
    const mainContent = document.querySelector('.content-with-sidebar');
    if (mainContent) {
      mainContent.classList.toggle('ml-64', isOpen);
      mainContent.classList.toggle('ml-20', !isOpen);
    }
  }, [isOpen]);

  return (
    <div className="flex flex-col flex-1 content-with-sidebar transition-all duration-300 ml-20">
      {children}
    </div>
  );
}