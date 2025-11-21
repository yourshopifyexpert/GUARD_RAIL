import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { Analytics } from '@vercel/analytics/react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AI Supervisor - Prevent AI Hallucinations in Your Code',
  description: 'Stop AI coding assistants from making unauthorized changes. AI Supervisor monitors, validates, and controls AI-generated code in real-time. Privacy-first, runs locally.',
  keywords: 'AI supervisor, AI coding assistant, prevent AI hallucinations, code validation, VS Code extension, AI control, developer tools',
  authors: [{ name: 'AI Supervisor Team' }],
  openGraph: {
    title: 'AI Supervisor - Prevent AI Hallucinations in Your Code',
    description: 'Stop AI coding assistants from making unauthorized changes. Monitor and control AI-generated code in real-time.',
    type: 'website',
    url: 'https://ai-supervisor.dev',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AI Supervisor',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Supervisor - Prevent AI Hallucinations in Your Code',
    description: 'Stop AI coding assistants from making unauthorized changes. Monitor and control AI-generated code in real-time.',
    images: ['/images/twitter-card.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <Header />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
        <Analytics />
      </body>
    </html>
  )
}
