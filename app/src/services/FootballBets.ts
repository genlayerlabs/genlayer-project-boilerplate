'use client'

import { read, writeWithFinality } from './genlayer'

// Cache for API responses
const responseCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30 * 1000; // 30 seconds for read operations

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
  constructor() {
    // Contract address is handled by genlayer service
  }

  async getBets(): Promise<Bet[]> {
    const cacheKey = 'get_bets';
    const cached = responseCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Using cached bets data');
      return cached.data;
    }

    try {
      const bets = await read('get_bets', []);
      console.log('Raw bets data:', bets)
      const formattedBets = Array.from((bets as any).entries()).flatMap((entry: any) => {
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

      // Cache the result
      responseCache.set(cacheKey, {
        data: formattedBets,
        timestamp: Date.now()
      });

      return formattedBets;
    } catch (error) {
      console.error("Error fetching bets:", error);
      throw error;
    }
  }

  async getPlayerPoints(address: string): Promise<number> {
    if (!address) return 0;
    try {
      const points = await read('get_player_points', [address]);
      return Number(points ?? 0);
    } catch (error) {
      console.error("Error fetching player points:", error);
      return 0;
    }
  }

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const cacheKey = 'get_leaderboard';
    const cached = responseCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('Using cached leaderboard data');
      return cached.data;
    }

    try {
      const points = await read('get_points', []);
      console.log('Raw leaderboard data:', points)
      const formattedLeaderboard = Array.from((points as any).entries())
        .map((entry: any) => {
          const [address, points] = entry as [string, any];
          return {
            address,
            points: Number(points),
          };
        })
        .sort((a, b) => b.points - a.points);

      // Cache the result
      responseCache.set(cacheKey, {
        data: formattedLeaderboard,
        timestamp: Date.now()
      });

      return formattedLeaderboard;
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      throw error;
    }
  }

  async createBet(gameDate: string, team1: string, team2: string, predictedWinner: string) {
    const result = await writeWithFinality('create_bet', [gameDate, team1, team2, predictedWinner], {
      status: 'FINALIZED',
      retries: 200,
      interval: 3000
    });
    
    // Invalidate cache after successful write
    responseCache.delete('get_bets');
    responseCache.delete('get_leaderboard');
    
    return result;
  }

  async waitForTransactionReceipt({ hash }: { hash: string }) {
    // This would typically call the genlayer service's waitForTransactionReceipt
    // For now, return a mock receipt
    return {
      hash,
      status: 'FINALIZED' as const,
      blockNumber: 12345,
      gasUsed: 21000,
    }
  }

  async createBetTx(gameDate: string, team1: string, team2: string, predictedWinner: string) {
    return await writeWithFinality('create_bet', [gameDate, team1, team2, predictedWinner], {
      status: 'FINALIZED',
      retries: 200,
      interval: 3000
    });
  }

  async resolveBetTx(betId: string) {
    const result = await writeWithFinality('resolve_bet', [betId], {
      status: 'FINALIZED',
      retries: 200,
      interval: 3000
    });
    
    // Invalidate cache after successful write
    responseCache.delete('get_bets');
    responseCache.delete('get_leaderboard');
    
    return result.hash;
  }
}
