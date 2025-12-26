'use client';

import { GeistSans, GeistMono } from "next/font/google";

const geistSans = GeistSans({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = GeistMono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export function ClientOnlyBody({ children }: { children: React.ReactNode }) {
  return (
    <body>
      {children}
    </body>
  );
}
