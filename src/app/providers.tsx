"use client";

import { HeroUIProvider } from "@heroui/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";

import { SWRConfig } from "swr";
import { swrConfig } from "@/lib/swr-config";

export default function Providers({ children, session }) {
  return (
    <SessionProvider session={session}>
      <HeroUIProvider>
        <NextThemesProvider
          attribute="class"
          defaultTheme="dark"
          themes={["light", "dark"]}
        >
          <SWRConfig value={swrConfig}>
          <ThemeProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </ThemeProvider>
          </SWRConfig>
        </NextThemesProvider>
      </HeroUIProvider>
    </SessionProvider>
  );
}
