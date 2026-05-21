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
   - `NEXT_PUBLIC_GENLAYER_RPC_URL` - GenLayer Studio or node RPC URL
   - `NEXT_PUBLIC_GENLAYER_CHAIN_ID` - Chain id shown in MetaMask
   - `NEXT_PUBLIC_GENLAYER_CHAIN_NAME` - Friendly network name
   - `NEXT_PUBLIC_GENLAYER_SYMBOL` - Native token symbol

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

## Validation

```bash
npm run typecheck
```

If you are using the repo root commands, prefer:

```bash
cd ..
npm run validate
```

## Tech Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling with custom glass-morphism theme
- **genlayer-js** - GenLayer blockchain SDK
- **TanStack Query (React Query)** - Data fetching and caching
- **Radix UI** - Accessible component primitives
- **shadcn/ui** - Pre-built UI components

## Wallet Management

The app uses MetaMask for signing and network switching. It can:
- connect to MetaMask
- add or switch to the configured GenLayer network
- switch accounts
- disconnect local app state without deleting the wallet

## Features

- **Create Bets**: Create football match predictions with team names, game date, and predicted winner (Team 1, Team 2, or Draw)
- **View Bets**: Real-time bet table with match details, predictions, status, and owners
- **Resolve Bets**: Bet owners can resolve matches using GenLayer's AI to verify actual results
- **Leaderboard**: Track top players by points earned from correct predictions
- **Player Stats**: View your points and ranking in the community
- **Glass-morphism UI**: Premium dark theme with OKLCH colors, backdrop blur effects, and smooth animations
- **Real-time Updates**: Automatic data fetching with 3-second polling intervals via TanStack Query
