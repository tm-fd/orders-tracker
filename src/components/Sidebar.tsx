"use client";

import { useSidebarStore } from "@/store/sidebar";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Settings,
  Bell,
  FileText,
  Menu,
} from "lucide-react";
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  Link,
} from "@heroui/react";
import Image from "next/image";

const Sidebar = () => {
  const isOpen = useSidebarStore((state) => state.isOpen);
  const toggle = useSidebarStore((state) => state.toggle);
  const pathname = usePathname();

  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Purchases",
      href: "/purchases",
      icon: ShoppingCart,
    },
    // {
    //   name: "Users",
    //   href: "/#",
    //   icon: Users,
    // },
    // {
    //   name: "Reports",
    //   href: "/dashboard",
    //   icon: FileText,
    // },
    // {
    //   name: "Notifications",
    //   href: "/notifications",
    //   icon: Bell,
    // },
    // {
    //   name: "Settings",
    //   href: "/settings",
    //   icon: Settings,
    // },
  ];

  return (
    <Navbar
      className={`fixed left-0 top-0 z-50 h-screen bg-background transition-all duration-300 flex-col justify-start border-r border-divider ${
        isOpen ? "w-64" : "w-20"
      }`}
      maxWidth="full"
    >
      <NavbarContent className="h-full flex-col gap-0 items-start ">
        <NavbarBrand className="justify-start py-6">
          <div
            className={`flex items-center justify-center gap-2 ${isOpen ? "w-40" : "w-20"}`}
          >
            <div className="flex items-center gap-2">
              <Image
                src="/imvi.svg"
                alt="IMVI Logo"
                width={50}
                height={50}
                className="dark:invert"
              />
            </div>
            <span
              className={`font-bold text-inherit transition-opacity duration-300 ${
                isOpen ? "opacity-100" : "opacity-0 w-0"
              }`}
            >
              IMVI Labs
            </span>
          </div>
        </NavbarBrand>
        <div className="flex flex-col gap-1 px-6">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavbarItem key={item.name} className="w-full">
                <Link
                  href={item.href}
                  className={`w-full flex items-center rounded-lg py-2 text-base font-normal transition-colors group relative ${
                    pathname === item.href
                      ? "bg-secondary/10 text-secondary"
                      : "text-foreground/60 hover:bg-primary/5 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span
                    className={`ml-3 transition-opacity duration-300 ${
                      isOpen ? "opacity-100" : "opacity-0 w-0"
                    }`}
                  >
                    {item.name}
                  </span>

                  {/* Tooltip for collapsed state */}
                  {!isOpen && (
                    <div className="absolute left-full ml-2 hidden group-hover:block">
                      <div className="bg-background px-2 py-1 rounded-md shadow-lg border border-divider">
                        <span className="whitespace-nowrap text-sm">
                          {item.name}
                        </span>
                      </div>
                    </div>
                  )}
                </Link>
              </NavbarItem>
            );
          })}
        </div>
      </NavbarContent>
    </Navbar>
    // <aside
    //   className={`fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] bg-background transition-all duration-300 ${
    //     isOpen ? 'w-64' : 'w-16'
    //   }`}
    // >
    //   <div className="h-full border-r border-divider">
    //     <div className="h-full overflow-y-auto px-3 py-4">
    //       <nav className="space-y-1">
    //         {navigationItems.map((item) => {
    //           const Icon = item.icon;
    //           return (
    //             <Link
    //               key={item.name}
    //               href={item.href}
    //               className={`flex items-center rounded-lg p-2 text-base font-normal transition-colors group relative ${
    //                 pathname === item.href
    //                   ? 'bg-primary/10 text-primary'
    //                   : 'text-foreground/60 hover:bg-primary/5 hover:text-foreground'
    //               }`}
    //             >
    //               <Icon className="h-5 w-5" />
    //               <span
    //                 className={`ml-3 transition-opacity duration-300 ${
    //                   isOpen ? 'opacity-100' : 'opacity-0 w-0'
    //                 }`}
    //               >
    //                 {item.name}
    //               </span>

    //               {/* Tooltip for collapsed state */}
    //               {!isOpen && (
    //                 <div className="absolute left-full ml-6 hidden group-hover:block">
    //                   <div className="bg-background px-2 py-1 rounded-md shadow-lg border border-divider">
    //                     <span className="whitespace-nowrap text-sm">{item.name}</span>
    //                   </div>
    //                 </div>
    //               )}
    //             </Link>
    //           );
    //         })}
    //       </nav>
    //     </div>
    //   </div>
    // </aside>
  );
};

export default Sidebar;
