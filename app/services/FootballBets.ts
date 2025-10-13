'use client'

import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

export interface Bet {
  id: string;
  owner: string;
  has_resolved: boolean;
  game_date: string;
  team1: string;
  team2: string;
  predicted_winner: string;
  real_winner: string;
  real_score: string;
}

export interface LeaderboardEntry {
  address: string;
  points: number;
}

export class FootballBets {
  private contractAddress: string;
  private client: any;
  private studioUrl?: string;
  private consensusInitialized = false;

  constructor(contractAddress: string, account: any = null, studioUrl?: string) {
    this.contractAddress = contractAddress;
    this.studioUrl = studioUrl;
    
    // Only create client if we have an account
    if (account) {
      const config: any = {
        chain: studionet,
        account: account,
        ...(studioUrl ? { endpoint: studioUrl } : {}),
      };
      this.client = createClient(config);
    } else {
      // For read-only operations, create a temporary account
      const tempAccount = createAccount();
      const config: any = {
        chain: studionet,
        account: tempAccount,
        ...(studioUrl ? { endpoint: studioUrl } : {}),
      };
      this.client = createClient(config);
    }
  }

  private async ensureConsensusInitialized() {
    if (!this.consensusInitialized) {
      await this.client.initializeConsensusSmartContract();
      this.consensusInitialized = true;
    }
  }

  updateAccount(account: any) {
    // Always create account if none provided
    if (!account) {
      account = createAccount();
    }
    
    const config: any = {
      chain: studionet,
      account: account,
      ...(this.studioUrl ? { endpoint: this.studioUrl } : {}),
    };
    this.client = createClient(config);
    this.consensusInitialized = false;
  }

  async getBets(): Promise<Bet[]> {
    try {
      console.log('Getting bets from contract:', this.contractAddress)
      await this.ensureConsensusInitialized();
      const bets = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_bets",
        args: [],
      });
      console.log('Raw bets data:', bets)
      return Array.from((bets as any).entries()).flatMap((entry: any) => {
        const [owner, bet] = entry as [string, any];
        return Array.from((bet as any).entries()).map((betEntry: any) => {
          const [id, betData] = betEntry as [string, any];
          const betObj = Array.from((betData as any).entries()).reduce((obj: any, dataEntry: any) => {
            const [key, value] = dataEntry as [string, any];
            obj[key] = value;
            return obj;
          }, {});

          return {
            id,
            ...(betObj as object),
            owner,
          };
        });
      }) as Bet[];
    } catch (error) {
      console.error("Error fetching bets:", error);
      return [];
    }
  }

  async getPlayerPoints(address: string): Promise<number> {
    if (!address) return 0;
    try {
      await this.ensureConsensusInitialized();
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

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    try {
      console.log('Getting leaderboard from contract:', this.contractAddress)
      await this.ensureConsensusInitialized();
      const points = await this.client.readContract({
        address: this.contractAddress,
        functionName: "get_points",
        args: [],
      });
      console.log('Raw leaderboard data:', points)
      return Array.from((points as any).entries())
        .map((entry: any) => {
          const [address, points] = entry as [string, any];
          return {
            address,
            points: Number(points),
          };
        })
        .sort((a, b) => b.points - a.points);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      return [];
    }
  }

  async createBet(gameDate: string, team1: string, team2: string, predictedWinner: string) {
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

  async resolveBet(betId: string) {
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

  async createBetTx(gameDate: string, team1: string, team2: string, predictedWinner: string): Promise<string> {
    await this.ensureConsensusInitialized();
    return this.client.writeContract({
      address: this.contractAddress,
      functionName: "create_bet",
      args: [gameDate, team1, team2, predictedWinner],
    });
  }

  async resolveBetTx(betId: string): Promise<string> {
    await this.ensureConsensusInitialized();
    return this.client.writeContract({
      address: this.contractAddress,
      functionName: "resolve_bet",
      args: [betId],
    });
  }
}
