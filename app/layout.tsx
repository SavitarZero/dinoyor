import type { Metadata } from "next"
import { Geist } from "next/font/google"
import NextTopLoader from "nextjs-toploader"
import "./globals.css"

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "DCORE — Gaming Item Marketplace",
  description: "Buy and sell in-game items with crypto. Protected by escrow. For SEA gamers.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`} suppressHydrationWarning>
      <body className="min-h-full antialiased">
        <NextTopLoader color="#E5B26D" shadow={false} showSpinner={false} height={2} />
        {children}
      </body>
    </html>
  )
}
