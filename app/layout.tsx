import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import Link from "next/link"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { NotificationBell } from "@/components/notification-bell"
import { ThemeSwitcher } from "@/components/theme-switcher"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Student Job Matching System",
  description: "Match students with job opportunities based on skills and qualifications",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <header className="border-b">
              <div className="container mx-auto flex h-16 items-center justify-between py-4">
                <Link href="/" className="font-bold text-xl">
                  Student-Job Matching
                </Link>
                <div className="flex items-center gap-2">
                  <nav className="flex items-center gap-6">
                    <Link href="/students" className="text-sm font-medium transition-colors hover:text-primary">
                      Students
                    </Link>
                    <Link href="/recruiters" className="text-sm font-medium transition-colors hover:text-primary">
                      Jobs
                    </Link>
                    <Link href="/match" className="text-sm font-medium transition-colors hover:text-primary">
                      Match Algorithm
                    </Link>
                    <Link href="/matches" className="text-sm font-medium transition-colors hover:text-primary">
                      Matches
                    </Link>
                    <Link href="/analytics" className="text-sm font-medium transition-colors hover:text-primary">
                      Analytics
                    </Link>
                    <Link href="/config" className="text-sm font-medium transition-colors hover:text-primary">
                      Configure
                    </Link>
                    <Link href="/settings" className="text-sm font-medium transition-colors hover:text-primary">
                      Settings
                    </Link>
                  </nav>
                  <div className="flex items-center gap-2">
                    <ThemeSwitcher />
                    <NotificationBell />
                  </div>
                </div>
              </div>
            </header>
            <main className="flex-1">{children}</main>
            <footer className="border-t py-6">
              <div className="container mx-auto flex flex-col items-center justify-between gap-4 md:flex-row">
                <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                  © {new Date().getFullYear()} Student-Job Matching System. All rights reserved.
                </p>
              </div>
            </footer>
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
