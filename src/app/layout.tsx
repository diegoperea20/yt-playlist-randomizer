import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
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
  title: 'YT Random Playlist Player',
  description:
    'Paste YouTube and YouTube Music playlist URLs, shuffle them and play with queue, repeat and drag and drop.',
  authors: [{ name: 'Diego Ivan Perea Montealegre' }],
  creator: 'Diego Ivan Perea Montealegre',
  publisher: 'Diego Ivan Perea Montealegre',
  keywords: ['YouTube', 'YouTube Music', 'playlist', 'shuffle', 'queue', 'repeat', 'drag and drop'],
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    // Dark-only app: the class is pinned on <html> so every child can use `dark:`.
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  )
}
