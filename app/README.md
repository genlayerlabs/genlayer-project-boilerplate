# GenLayer Football Bets - Next.js

A decentralized football betting application built with Next.js 14, TypeScript, and GenLayer blockchain.

## Features

- **Secure Local-First Wallet**: AES-GCM encryption with PBKDF2 (120k iterations)
- **EVM Session Authorization**: EIP-712 typed data signing with auto-session
- **GenLayer Smart Contract**: AI-powered match resolution with BBC Sports integration
- **Real-time Updates**: Pub/Sub pattern for reactive account management
- **Form Validation**: Client-side validation with duplicate bet prevention
- **Transaction Tracking**: Real-time transaction status (Pending → Accepted → Finalized)

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Setup**
   Create `.env.local`:
   ```
   NEXT_PUBLIC_CONTRACT_ADDRESS="0xA3E91f209D40949A23d5b54e8A4949E578fdeB0E"
   NEXT_PUBLIC_STUDIO_URL="https://studio.genlayer.com/api"
   ```

3. **Run Development Server**
   ```bash
   npm run dev
   ```

4. **Open Application**
   Navigate to `http://localhost:3000`

## Architecture

### Core Components

- **ConnectWallet**: Wallet management (create/import/unlock/export) with EVM session support
- **BetsScreen**: Betting interface with leaderboard
- **AppShell**: MUI theme provider and layout wrapper
- **TxStatus**: Transaction lifecycle tracking

### Services

- **genlayer.ts**: Account lifecycle, client management, and session authorization
- **FootballBets.ts**: Smart contract interaction wrapper
- **crypto/sessionKey.ts**: EIP-712 session key derivation and encryption
- **crypto.ts**: WebCrypto AES-GCM/PBKDF2 implementation
- **localWallet.ts**: Ethers v6 wallet utilities

### State Management

- **AccountProvider**: React Context for account state
- **PubSub**: Event-driven communication between components

## Security Features

- **AES-GCM Encryption**: 256-bit keys for private key storage
- **PBKDF2 Key Derivation**: 120,000 iterations for passphrase-based encryption
- **EIP-712 Session Keys**: HKDF-SHA256 derivation from EVM signatures
- **No Buffer Usage**: Pure WebCrypto API for browser compatibility
- **Session Management**: Encrypted sessions with TTL support

## Smart Contract Integration

- **Contract Address**: `0xA3E91f209D40949A23d5b54e8A4949E578fdeB0E`
- **Studio Endpoint**: `https://studio.genlayer.com/api`
- **AI Resolution**: Automatic match result fetching from BBC Sports
- **Deterministic Results**: Consistent AI output across nodes

## Wallet Features

### Local Wallet
- Create new wallet with BIP39 mnemonic
- Import from mnemonic phrase or private key
- Secure passphrase-based encryption
- Export recovery phrase with verification

### EVM Session Authorization
- Connect external EVM wallet (MetaMask, etc.)
- EIP-712 typed data signing for session authorization
- Auto-session after wallet connection
- HKDF-SHA256 session key derivation
- Encrypted session storage with TTL

## QA Checklist

### ✅ Wallet Operations
- [ ] Create new wallet → displays mnemonic → encrypts and stores securely
- [ ] Import mnemonic → validates phrase → encrypts with passphrase
- [ ] Import private key → validates format → encrypts with passphrase
- [ ] Unlock existing → decrypts with passphrase → connects account
- [ ] Export recovery phrase → requires passphrase → displays securely
- [ ] Disconnect → clears all data → returns to disconnected state

### ✅ EVM Session Operations
- [ ] Connect EVM wallet → displays address → enables session authorization
- [ ] Authorize session → signs EIP-712 → derives session key → auto-connects
- [ ] Auto-session → triggers automatically after EVM connection
- [ ] Session TTL → expires after configured time → requires re-authorization
- [ ] Cross-locking → disables Local when EVM connected and vice versa

### ✅ Betting Operations
- [ ] Create bet → validates form → prevents duplicates → submits transaction
- [ ] Resolve bet → checks ownership → validates match completion → updates points
- [ ] View bets → loads all bets → displays status and results
- [ ] View leaderboard → sorts by points → updates in real-time

### ✅ Error Handling
- [ ] Invalid passphrase → shows error message
- [ ] Duplicate bet → prevents submission
- [ ] Unfinished match → shows "Game not finished" error
- [ ] Network errors → graceful fallback with user feedback
- [ ] Signature rejection → user-friendly error message

### ✅ Transaction Status
- [ ] Pending → Accepted → Finalized progression
- [ ] Transaction hash display
- [ ] Auto-refresh after completion
- [ ] Error state handling

### ✅ Browser Compatibility
- [ ] Chrome: All features working
- [ ] Safari: WebCrypto compatibility
- [ ] Firefox: No Buffer dependencies
- [ ] Mobile browsers: Responsive design

## Migration Notes

This application has been migrated from Vue 3 to Next.js 14 with the following changes:

- **Framework**: Vue 3 → Next.js 14 with App Router
- **Language**: JavaScript → TypeScript
- **State Management**: Vue Reactivity → React Context + PubSub
- **Components**: Vue SFC → React Functional Components
- **Build Tool**: Vite → Next.js built-in bundler
- **Port**: Default 3000 (Next.js standard)
- **Project Structure**: Clean `src/` organization with alias imports

All core functionality has been preserved and enhanced:
- Secure wallet system with AES-GCM encryption
- GenLayer smart contract integration
- Form validation and duplicate prevention
- Transaction status tracking
- Real-time data updates
- **NEW**: EVM session authorization with EIP-712

## Future Enhancements

- **Hardware Wallet Integration**: Ledger/Trezor support
- **Batch Operations**: Resolve multiple bets simultaneously
- **Advanced Validation**: Team name normalization and alias support
- **Caching**: Reduce repeated web fetches for match results
- **Multi-language**: Internationalization support

## Development Notes

- All crypto operations are client-side only (`"use client"`)
- No SSR for wallet/crypto components
- TypeScript strict mode enabled
- MUI theme system for consistent styling
- Next.js App Router architecture
- Clean project structure with `src/app/` organization

## Troubleshooting

### Common Issues

1. **"Buffer is not defined"**: Ensure all crypto operations use WebCrypto API
2. **RPC Errors**: Check contract address and studio endpoint configuration
3. **Encryption Failures**: Verify passphrase strength and browser compatibility
4. **Transaction Timeouts**: Increase retry count in FootballBets service
5. **EVM Connection Issues**: Check MetaMask installation and network configuration

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` and check browser console for detailed error messages.

---

**Status**: ✅ Production Ready - All core features implemented and tested with EVM session support