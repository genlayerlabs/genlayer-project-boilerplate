# Sample GenLayer project
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/license/mit/)
[![Discord](https://dcbadge.vercel.app/api/server/8Jm4v89VAu?compact=true&style=flat)](https://discord.gg/8Jm4v89VAu)
[![Telegram](https://img.shields.io/badge/Telegram--T.svg?style=social&logo=telegram)](https://t.me/genlayer)
[![Twitter](https://img.shields.io/twitter/url/https/twitter.com/yeagerai.svg?style=social&label=Follow%20%40GenLayer)](https://x.com/GenLayer)
[![GitHub star chart](https://img.shields.io/github/stars/yeagerai/genlayer-project-boilerplate?style=social)](https://star-history.com/#yeagerai/genlayer-js)

## 👀 About
This project includes the boilerplate code for a GenLayer use case implementation, specifically a football bets game.

## 📦 What's included
- Basic requirements to deploy and test your intelligent contracts locally
- Configuration file template
<!-- - Test functions to write complete end-to-end tests -->
- An example of an intelligent contract (Football Bets)
- Example end-to-end tests for the contract provided
- A production-ready Next.js 15 frontend with TypeScript, TanStack Query, and Radix UI

## 🛠️ Requirements
- A running GenLayer Studio (Install from [Docs](https://docs.genlayer.com/developers/intelligent-contracts/tooling-setup#using-the-genlayer-studio) or work with the hosted version of [GenLayer Studio](https://studio.genlayer.com/)). If you are working locally, this repository code does not need to be located in the same directory as the Genlayer Studio.
- [GenLayer CLI](https://github.com/genlayerlabs/genlayer-cli) globally installed. To install or update the GenLayer CLI run `npm install -g genlayer`

## 🚀 Steps to run this example

### 1. Deploy the contract
   Deploy the contract from `/contracts/football_bets.py` using the GenLayer CLI:
   1. Choose the network that you want to use (studionet, localnet, or tesnet-*): `genlayer network`
   2. Execute the deploy command `genlayer deploy`. This command is going to execute the deploy script located in `/deploy/deployScript.ts`

### 2. Setup the frontend environment
  1. All the content of the dApp is located in the `/frontend` folder.
  2. Copy the `.env.example` file in the `frontend` folder and rename it to `.env`, then fill in the values for your configuration. The provided NEXT_PUBLIC_GENLAYER_RPC_URL value is the backend of the hosted GenLayer Studio.
  3. Add the deployed contract address to the `/frontend/.env` under the variable `NEXT_PUBLIC_CONTRACT_ADDRESS`

### 4. Run the frontend Next.js app
   Execute the following commands in your terminal:

   **Using bun:**
   ```shell
   cd frontend
   bun install
   bun dev
   ```

   **Using npm:**
   ```shell
   cd frontend
   npm install
   npm run dev
   ```

   The terminal should display a link to access your frontend app (usually at <http://localhost:3000/>).
   For more information on the code see [GenLayerJS](https://github.com/yeagerai/genlayer-js).
   
### 5. Test contracts
1. Install the Python packages listed in the `requirements.txt` file in a virtual environment.
2. Make sure your GenLayer Studio is running. Then execute the following command in your terminal:
   ```shell
   gltest
   ```

## ⚽ How the Football Bets Contract Works

The Football Bets contract allows users to create bets for football matches, resolve those bets, and earn points for correct bets. Here's a breakdown of its main functionalities:

1. Creating Bets:
   - Users can create a bet for a specific football match by providing the game date, team names, and their predicted winner.
   - The contract checks if the game has already finished and if the user has already made a bet for this match.

2. Resolving Bets:
   - After a match has concluded, users can resolve their bets.
   - The contract fetches the actual match result from a specified URL.
   - If the Bet was correct, the user earns a point.

3. Querying Data:
   - Users can retrieve all bets.
   - The contract also allows querying of points, either for all players or for a specific player.

4. Getting Points:
   - Points are awarded for correct bets.
   - Users can check their total points or the points of any player.

## 🧪 Tests

This project includes integration tests that interact with the contract deployed in the Studio. These tests cover the main functionalities of the Football Bets contract:

1. Creating a bet
2. Resolving a bet
3. Querying bets for a player
4. Querying points for a player

The tests simulate real-world interactions with the contract, ensuring that it behaves correctly under various scenarios. They use the GenLayer Studio to deploy and interact with the contract, providing a comprehensive check of the contract's functionality in a controlled environment.

To run the tests, use the `gltest` command as mentioned in the "Steps to run this example" section.


## 💬 Community
Connect with the GenLayer community to discuss, collaborate, and share insights:
- **[Discord Channel](https://discord.gg/8Jm4v89VAu)**: Our primary hub for discussions, support, and announcements.
- **[Telegram Group](https://t.me/genlayer)**: For more informal chats and quick updates.

Your continuous feedback drives better product development. Please engage with us regularly to test, discuss, and improve GenLayer.

## 📖 Documentation
For detailed information on how to use GenLayerJS SDK, please refer to our [documentation](https://docs.genlayer.com/).

## 📜 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
