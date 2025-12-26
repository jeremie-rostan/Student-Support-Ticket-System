import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { IncidentsProvider } from "@/contexts/IncidentsContext";

export const metadata: Metadata = {
  title: "Student Support Tickets",
  description: "Track and manage student support needs with AI assistance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <IncidentsProvider>
            {children}
          </IncidentsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
