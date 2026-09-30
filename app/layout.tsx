import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fleet Telemetry Platform",
  description:
    "Ingest, clean and analyze vehicle GPS/IoT telemetry — trip segmentation, route maps and fleet KPIs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-6">
              <div className="flex items-center gap-6">
                <Link href="/" className="flex items-center space-x-2">
                  <span className="text-xl font-bold">Fleet Manager</span>
                </Link>
                <nav className="hidden md:flex items-center gap-4 text-sm">
                  <Link
                    href="/dashboard"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/telemetry/import"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Import
                  </Link>
                </nav>
              </div>
              <ThemeToggle />
            </div>
          </header>
          <main>{children}</main>
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
