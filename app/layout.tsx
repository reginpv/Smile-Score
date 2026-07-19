import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import HydrationZustand from '@/templates/hydrationZustand'
import { Providers } from './providers'
import { Toaster } from 'sonner'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Smile Score',
  description:
    'Smile Score is a NEXT.js CRUD template with Zustand and NextAuth, featuring a public gallery of smile scores and user authentication.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <HydrationZustand>{children}</HydrationZustand>
          <Toaster
            richColors
            position="bottom-right"
            toastOptions={{ style: { fontSize: '16px' } }}
          />
        </Providers>
      </body>
    </html>
  )
}
