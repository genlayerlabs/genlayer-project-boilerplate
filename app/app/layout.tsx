import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'GenLayer Football Bets',
  description: 'Decentralized football betting on GenLayer',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  )
}
