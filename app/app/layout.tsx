import type { Metadata } from 'next'
import './globals.css'
import { EVMProviderWrapper } from '../src/components/EVMProviderWrapper'
import React from 'react'

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
        <EVMProviderWrapper>
          {children}
        </EVMProviderWrapper>
      </body>
    </html>
  )
}
