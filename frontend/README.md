# GenLayer Football Market

Next.js frontend for GenLayer Football Market - AI-powered football match predictions on GenLayer blockchain.

## Setup

1. Install dependencies:

**Using bun:**
```bash
bun install
```

**Using npm:**
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure environment variables:
   - `NEXT_PUBLIC_CONTRACT_ADDRESS` - GenLayer Football Betting contract address
   - `NEXT_PUBLIC_GENLAYER_RPC_URL` - GenLayer RPC URL (defaults to `https://studio-dev.genlayer.com/api`)
   - `NEXT_PUBLIC_GENLAYER_CHAIN_ID` - RPC chain ID (defaults to `61997`)
   - `NEXT_PUBLIC_GENLAYER_CHAIN_NAME` - Network label shown to users

   Change the RPC URL and chain ID together. The same resolved network is used
   by MetaMask, `genlayer-js`, and Transaction Kit.

## Development

**Using bun:**
```bash
bun dev
```

**Using npm:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build

**Using bun:**
```bash
bun run build
bun start
```

**Using npm:**
```bash
npm run build
npm start
```

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling with custom glass-morphism theme
- **genlayer-js** - GenLayer blockchain SDK
- **TanStack Query (React Query)** - Data fetching and caching
- **Radix UI** - Accessible component primitives
- **shadcn/ui** - Pre-built UI components

## Wallet Management

The app connects to MetaMask, adds or switches to the configured GenLayer
network, supports account switching, and remembers only the user's explicit
disconnect preference. Private keys are never stored by the application.

## Features

- **Create Bets**: Create football match predictions with team names, game date, and predicted winner (Team 1, Team 2, or Draw)
- **View Bets**: Real-time bet table with match details, predictions, status, and owners
- **Resolve Bets**: Bet owners can resolve matches using GenLayer's AI to verify actual results
- **Leaderboard**: Track top players by points earned from correct predictions
- **Player Stats**: View your points and ranking in the community
- **Glass-morphism UI**: Premium dark theme with OKLCH colors, backdrop blur effects, and smooth animations
- **Data Refresh**: TanStack Query refreshes contract data after completed transactions and when the window regains focus
