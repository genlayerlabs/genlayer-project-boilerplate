import React from 'react'
import Link from 'next/link'

export default function IndexPage() {
  return (
    <main style={{ padding: 24 }}>
      <h1>GenLayer Football Bets</h1>
      <p>Temporary pages router home (fallback).</p>
      <p><Link href="/bets">Go to Bets</Link></p>
    </main>
  )
}


