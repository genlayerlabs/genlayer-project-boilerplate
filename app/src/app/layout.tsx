import type { Metadata } from 'next'
import './globals.css'
import React from 'react'
import AppShell from '@/components/AppShell'

export const metadata: Metadata = {
  title: 'GenLayer Football Bets',
  description: 'Decentralized football betting on GenLayer',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}


