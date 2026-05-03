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
   - `NEXT_PUBLIC_GENLAYER_RPC_URL` - GenLayer RPC URL (default: https://studio.genlayer.com/api)
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` - WalletConnect Project ID (get free at https://cloud.walletconnect.com)

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
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling with custom glass-morphism theme
- **RainbowKit** - Multi-wallet connection UI
- **wagmi** - React hooks for Ethereum
- **viem** - TypeScript Ethereum library
- **genlayer-js** - GenLayer blockchain SDK
- **TanStack Query (React Query)** - Data fetching and caching
- **Radix UI** - Accessible component primitives

## Wallet Connection

The app uses **RainbowKit** for multi-wallet support:

### Supported Wallets
- **MetaMask** - Browser extension & mobile
- **WalletConnect** - Connect any WalletConnect-compatible wallet
- **Coinbase Wallet** - Coinbase's self-custody wallet
- **Rainbow** - Mobile-first Ethereum wallet
- **And many more** - RainbowKit supports 100+ wallets

### Getting WalletConnect Project ID
1. Go to [WalletConnect Cloud](https://cloud.walletconnect.com)
2. Create a free account
3. Create a new project
4. Copy the Project ID
5. Add to your `.env` file as `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`

### Features
- **One-click connection** - Simple modal to connect any supported wallet
- **Network switching** - Automatic prompt to switch to GenLayer network
- **Account management** - View balance, switch accounts, disconnect
- **Persistent sessions** - Stay connected across page refreshes

## Features

- **Create Bets**: Create football match predictions with team names, game date, and predicted winner (Team 1, Team 2, or Draw)
- **View Bets**: Real-time bet table with match details, predictions, status, and owners
- **Resolve Bets**: Bet owners can resolve matches using GenLayer's AI to verify actual results
- **Leaderboard**: Track top players by points earned from correct predictions
- **Player Stats**: View your points and ranking in the community
- **Glass-morphism UI**: Premium dark theme with OKLCH colors, backdrop blur effects, and smooth animations
- **Real-time Updates**: Automatic data fetching with TanStack Query
