import './globals.css'
import type { Metadata } from 'next'
import ClientOnly from '@/components/ClientOnly'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'EAZY',
  description: 'Find roommates and services easily'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-[#f8fafc] text-gray-900">
        <ClientOnly>
          <Header />
        </ClientOnly>
        <main className="flex-1 px-4 py-6">{children}</main>
      </body>
    </html>
  )
}
