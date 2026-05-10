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

const clerkAppearance = {
  variables: {
    colorBackground: '#111111',
    colorPrimary: '#ededed',
    colorText: '#ededed',
    colorTextSecondary: '#a1a1a1',
    colorInputBackground: '#0a0a0a',
    colorInputText: '#ededed',
    colorNeutral: '#888888',
    borderRadius: '12px',
    fontFamily: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif',
  },
  elements: {
    card: { backgroundColor: '#111111', border: '1px solid #222222', boxShadow: 'none' },
    modalBackdrop: { backdropFilter: 'blur(6px)', backgroundColor: 'rgba(0,0,0,0.75)' },
    formButtonPrimary: {
      backgroundColor: '#ededed',
      color: '#0a0a0a',
      borderRadius: '9999px',
      fontWeight: '600',
    },
    socialButtonsBlockButton: {
      backgroundColor: '#1a1a1a',
      border: '1px solid #333333',
      color: '#ededed',
      borderRadius: '9999px',
    },
    socialButtonsBlockButtonText: { color: '#ededed', fontWeight: '500' },
    formFieldInput: {
      backgroundColor: '#0a0a0a',
      borderColor: '#333333',
      color: '#ededed',
    },
    formFieldLabel: { color: '#a1a1a1' },
    dividerLine: { backgroundColor: '#222222' },
    dividerText: { color: '#555555' },
    footerActionLink: { color: '#ededed' },
    footerActionText: { color: '#888888' },
    headerTitle: { color: '#ededed' },
    headerSubtitle: { color: '#a1a1a1' },
    identityPreviewText: { color: '#ededed' },
    identityPreviewEditButton: { color: '#a1a1a1' },
    alertText: { color: '#ededed' },
    formResendCodeLink: { color: '#ededed' },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full`}>
        <body className="min-h-full bg-[#0a0a0a] text-[#ededed] font-sans antialiased">
          <Providers>{children}</Providers>
        </body>
      </html>
    </ClerkProvider>
  )
}
