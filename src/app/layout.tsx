import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import "./charts.css"
import "./theme.css"
import { ClientLayout } from "@/components/client-layout"
import { ThemeProvider } from "@/components/theme-provider"
import { ThemeScript } from "@/lib/set-theme-script"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "AArchive",
  description: "Gère tes temps de travail.",
  icons: {
    apple: "/apple-touch-icon.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#121213",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <ClientLayout>{children}</ClientLayout>
        </ThemeProvider>
      </body>
    </html>
  )
}
