import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { ClerkProvider } from '@clerk/nextjs'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'PayTag — Get paid in any crypto from any chain',
  description: 'Share your PayTag link and accept crypto payments from anywhere, in any token.',
  openGraph: {
    title: 'PayTag',
    description: 'Your cross-chain payment link. Share it. Get paid.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full`}>
        <body className="min-h-full bg-[#0a0a0a] text-[#ededed] font-sans antialiased">
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
