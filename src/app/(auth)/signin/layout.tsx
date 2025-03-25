import Image from "next/image";
import Link from "next/link";
import React from "react";
import GridShape from "@/components/GridShape";

export default function AuthLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <div className="relative p-6 bg-default-50 z-1 dark:bg-gray-900 sm:p-0">
        <div className="relative flex lg:flex-row w-full h-screen justify-center flex-col dark:bg-gray-900 sm:p-0">
          {children}
          <div className="lg:w-1/2 w-full h-full dark:bg-white/5 lg:grid items-center hidden bg-blue-800">
            <div className="relative items-center justify-center flex z-1 ">
              {/* <!-- ===== Common Grid Shape Start ===== --> */}
              <GridShape />
              <div className="flex flex-col items-center max-w-xs ">
                <Link href="/" className="block mb-4">
                  <Image
                    width={60}
                    height={60}
                    src="/imvi.svg"
                    alt="Logo"
                  />
                </Link>
                <p className="text-center text-gray-400 dark:text-white/60">
                Improve your reading speed for life
                </p>
              </div>
            </div>
          </div>
        </div>
    </div>
    );
  }