# GenLayer project boilerplate
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/license/mit/)
[![Discord](https://img.shields.io/badge/Discord-Join%20us-5865F2?logo=discord&logoColor=white)](https://discord.gg/8Jm4v89VAu)
[![Telegram](https://img.shields.io/badge/Telegram--T.svg?style=social&logo=telegram)](https://t.me/genlayer)
[![Twitter](https://img.shields.io/twitter/url/https/twitter.com/yeagerai.svg?style=social&label=Follow%20%40GenLayer)](https://x.com/GenLayer)
[![GitHub star chart](https://img.shields.io/github/stars/yeagerai/genlayer-project-boilerplate?style=social)](https://star-history.com/#yeagerai/genlayer-js)

## 👀 About
This repository is a starter template for building GenLayer applications. It ships with:

- a sample intelligent contract (`FootballBets`)
- a TypeScript deployment flow
- fast direct-mode tests for contract logic
- Studio-backed integration tests
- a production-ready Next.js frontend wired to `genlayer-js`

## 📦 What's included
- a GenLayer contract example that uses validator-aware nondeterministic execution
- direct tests for fast feedback without Studio
- integration tests for live GenLayer Studio or localnet runs
- a production-safe frontend build that does not depend on remote fonts
- CI checks for direct tests, frontend typechecking, and frontend build
- a setup guide route at `frontend/app/setup/page.tsx`

## 🛠️ Requirements
- A running GenLayer Studio (Install from [Docs](https://docs.genlayer.com/developers/intelligent-contracts/tooling-setup#using-the-genlayer-studio) or work with the hosted version of [GenLayer Studio](https://studio.genlayer.com/)). If you are working locally, this repository code does not need to be located in the same directory as the Genlayer Studio.
- [GenLayer CLI](https://github.com/genlayerlabs/genlayer-cli) globally installed. To install or update the GenLayer CLI run `npm install -g genlayer`
- Python 3.12+
- Node.js 22+

## 🚀 Quickstart

### 1. Install dependencies
```bash
npm install
python3 -m pip install -r requirements.txt
```

### 2. Configure the frontend
```bash
cp frontend/.env.example frontend/.env
```

Set:
- `NEXT_PUBLIC_GENLAYER_RPC_URL`
- `NEXT_PUBLIC_GENLAYER_CHAIN_ID`
- `NEXT_PUBLIC_GENLAYER_CHAIN_NAME`
- `NEXT_PUBLIC_GENLAYER_SYMBOL`
- `NEXT_PUBLIC_CONTRACT_ADDRESS`

### 3. Validate the starter locally
```bash
npm run validate
```

This runs:
- frontend typechecking
- direct-mode contract tests

### 4. Deploy the sample contract
```bash
genlayer network
npm run deploy
```

### 5. Run the frontend
```bash
npm run dev
```

## ⚡ Validation modes

### Direct tests
Fast tests that do not need GenLayer Studio:

```bash
npm run test:direct
```

### Integration tests
Tests that require Studio or localnet:

```bash
pytest -m integration -q
```

If you need explicit network configuration, start from:

```bash
cp gltest.config.yaml.example gltest.config.yaml
```

## 🧱 Customize this boilerplate

When turning this into your own GenLayer app, edit these first:

1. `contracts/football_bets.py` for contract logic
2. `deploy/deployScript.ts` for deployment arguments and contract path
3. `frontend/lib/contracts/FootballBets.ts` for frontend contract calls
4. `frontend/lib/hooks/useFootballBets.ts` for frontend data flow
5. `frontend/.env` for runtime network and contract settings

The sample app remains football-themed, but the repo structure is intended to be copied into other GenLayer products.

## ⚽ How the sample contract works

The Football Bets contract allows users to create bets for football matches, resolve those bets, and earn points for correct bets. Here's a breakdown of its main functionalities:

1. Creating Bets:
   - Users create a bet with a game date, two team names, and a predicted winner.
   - The contract rejects invalid winner codes, duplicate bets, empty team names, and same-team matchups.

2. Resolving Bets:
   - The contract fetches match data and asks the LLM for a normalized result.
   - Consensus is reached through a validator-based nondeterministic flow instead of raw `strict_eq`.
   - Correct predictions earn one point.

3. Querying Data:
   - Users can retrieve all bets.
   - The contract also allows querying of points, either for all players or for a specific player.

4. Getting Points:
   - Points are awarded for correct bets.
   - Users can check their total points or the points of any player.

## 🧪 Tests

This repo uses two layers of tests:

1. Direct tests for contract logic and validator capture
2. Integration tests for live Studio-backed flows

That split gives contributors a fast feedback loop without losing end-to-end coverage.

## 💬 Community
Connect with the GenLayer community to discuss, collaborate, and share insights:
- **[Discord Channel](https://discord.gg/8Jm4v89VAu)**: Our primary hub for discussions, support, and announcements.
- **[Telegram Group](https://t.me/genlayer)**: For more informal chats and quick updates.

Your continuous feedback drives better product development. Please engage with us regularly to test, discuss, and improve GenLayer.

## 📖 Documentation
For detailed information on how to use GenLayerJS SDK, please refer to our [documentation](https://docs.genlayer.com/).

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
