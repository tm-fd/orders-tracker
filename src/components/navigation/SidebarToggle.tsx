// src/components/SidebarToggle.tsx
'use client';

import { useSidebarStore } from '@/store/sidebar';

export default function SidebarToggle() {
  const toggle = useSidebarStore((state) => state.toggle);

  return (
    <button
      onClick={toggle}
      className="fixed left-4 top-4 z-50 rounded-lg bg-gray-800 p-2 text-white hover:bg-gray-700"
    >
      <svg
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
  );
}