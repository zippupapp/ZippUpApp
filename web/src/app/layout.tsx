import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ZippUp - On-Demand Service Super App',
  description: 'ZippUp is your all-in-one platform for on-demand services, emergency assistance, marketplace, and digital utilities.',
  keywords: ['on-demand services', 'emergency services', 'marketplace', 'super app', 'ZippUp'],
  authors: [{ name: 'ZippUp Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: 'ZippUp - On-Demand Service Super App',
    description: 'Your all-in-one platform for services, emergency assistance, and more.',
    type: 'website',
    locale: 'en_US',
    siteName: 'ZippUp',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ZippUp - On-Demand Service Super App',
    description: 'Your all-in-one platform for services, emergency assistance, and more.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div id="root">
          {children}
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              style: {
                background: 'green',
              },
            },
            error: {
              duration: 5000,
              style: {
                background: 'red',
              },
            },
          }}
        />
        <div id="modal-root" />
      </body>
    </html>
  )
}