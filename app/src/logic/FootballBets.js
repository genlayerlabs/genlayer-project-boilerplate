import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

class FootballBets {
  contractAddress;
  client;
  studioUrl;
  consensusInitialized = false;

  constructor(contractAddress, account = null, studioUrl = null) {
    this.contractAddress = contractAddress;
    this.studioUrl = studioUrl;
    // Always create a client with an account (even if dummy) for read operations
    const clientAccount = account || createAccount();
    const config = {
      chain: studionet,
      account: clientAccount,
      ...(studioUrl ? { endpoint: studioUrl } : {}),
    };
    this.client = createClient(config);
  }

  async ensureConsensusInitialized() {
    if (!this.consensusInitialized) {
      await this.client.initializeConsensusSmartContract();
      this.consensusInitialized = true;
    }
  }

  updateAccount(account) {
    // Always create a client with an account (even if dummy) for read operations
    const clientAccount = account || createAccount();
    const config = {
      chain: studionet,
      account: clientAccount,
      ...(this.studioUrl ? { endpoint: this.studioUrl } : {}),
    };
    this.client = createClient(config);
    this.consensusInitialized = false; // Reset consensus flag for new client
  }

  async getBets() {
    try {
      const bets = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_bets",
        args: [],
      });
      return Array.from(bets.entries()).flatMap(([owner, bet]) => {
        return Array.from(bet.entries()).map(([id, betData]) => {
          const betObj = Array.from(betData.entries()).reduce((obj, [key, value]) => {
            obj[key] = value;
            return obj;
          }, {});

          return {
            id,
            ...betObj,
            owner,
          };
        });
      });
    } catch (error) {
      console.error("Error fetching bets:", error);
      return [];
    }
  }

  async getPlayerPoints(address) {
    if (!address) {
      return 0;
    }
    try {
      const points = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_player_points",
        args: [address],
      });
      return points;
    } catch (error) {
      console.error("Error fetching player points:", error);
      return 0;
    }
  }

  async getLeaderboard() {
    try {
      const points = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_points",
        args: [],
      });
      return Array.from(points.entries())
        .map(([address, points]) => ({
          address,
          points: Number(points),
        }))
        .sort((a, b) => b.points - a.points);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return [];
    }
  }

  async createBet(gameDate, team1, team2, predictedWinner) {
    await this.ensureConsensusInitialized();
    
    const txHash = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "create_bet",
      args: [gameDate, team1, team2, predictedWinner],
    });
    const receipt = await this.client.waitForTransactionReceipt({
      hash: txHash,
      status: "FINALIZED",
      interval: 10000,
    });
    return receipt;
  }

  async resolveBet(betId) {
    await this.ensureConsensusInitialized();
    
    const txHash = await this.client.writeContract({
      address: this.contractAddress,
      functionName: "resolve_bet",
      args: [betId],
    });
    const receipt = await this.client.waitForTransactionReceipt({
      hash: txHash,
      status: "FINALIZED",
      interval: 10000,
      retries: 20,
    });
    return receipt;
  }

  // --- NEW: write-only helpers that return tx hash quickly (no waiting) ---
  async createBetTx(gameDate, team1, team2, predictedWinner) {
    await this.ensureConsensusInitialized();
    
    // return tx hash quickly; you can track phases outside
    return this.client.writeContract({
      address: this.contractAddress,
      functionName: "create_bet",
      args: [gameDate, team1, team2, predictedWinner],
    });
  }

  async resolveBetTx(betId) {
    await this.ensureConsensusInitialized();
    
    return this.client.writeContract({
      address: this.contractAddress,
      functionName: "resolve_bet",
      args: [betId],
    });
  }
}

export default FootballBets;
