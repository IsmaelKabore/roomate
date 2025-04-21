// app/layout.tsx
import './globals.css'
import Header from '@/components/Header'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'EAZY',
  description: 'Find roommates and services easily',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen">
        <Header /> {/* <- Top nav bar */}
        <main className="flex-1">{children}</main>
      </body>
    </html>
  )
}
