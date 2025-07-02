import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ClientOnly from '@/components/ClientOnly'
import ClientHeader from '@/components/ClientHeader'
import ThemeProvider from '@/components/ThemeProvider'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true
})

export const metadata: Metadata = {
  title: 'ShareSpace - Find Your Perfect Roommate',
  description: 'Connect with compatible roommates and discover your ideal living space with ShareSpace',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="/public/logo-transparent.png" type="image/png" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <ClientOnly>
            <ClientHeader />
          </ClientOnly>
          <main>
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}
