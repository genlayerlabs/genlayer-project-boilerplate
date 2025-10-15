'use client'

import { read, writeWithFinality, waitForTransactionReceipt as glWait } from './genlayer'

// Lightweight cache for read operations to reduce RPC load
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
  constructor() {}

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

      // Guard against null/undefined bets
      const safeBets = bets || {};
      const outerEntries = (safeBets && typeof (safeBets as any).entries === 'function')
        ? Array.from((safeBets as any).entries())
        : Object.entries(safeBets as Record<string, any>);

      const formattedBets = outerEntries.flatMap((entry: any) => {
        const [owner, bet] = entry as [string, any];
        const innerEntries = (bet && typeof bet.entries === 'function')
          ? Array.from(bet.entries())
          : Object.entries(bet as Record<string, any>);

        return innerEntries.map((betEntry: any) => {
          const [id, betData] = betEntry as [string, any];
          const dataEntries = (betData && typeof betData.entries === 'function')
            ? Array.from(betData.entries())
            : Object.entries(betData as Record<string, any>);

          const betObj = dataEntries.reduce((obj: any, dataEntry: any) => {
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

      // Guard against null/undefined points
      const safePoints = points || {};
      const pointEntries = (safePoints && typeof (safePoints as any).entries === 'function')
        ? Array.from((safePoints as any).entries())
        : Object.entries(safePoints as Record<string, any>);

      const formattedLeaderboard = pointEntries
        .map((entry: any) => {
          const [address, pts] = entry as [string, any];
          return {
            address,
            points: Number(pts),
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
    
    // Return the transaction hash string for UI rendering
    return result.hash as string;
  }

  async waitForTransactionReceipt({ hash }: { hash: string }) {
    // Delegate to GenLayer service to poll Studionet
    return await glWait({ hash, status: 'FINALIZED', retries: 200, interval: 3000 })
  }

  async createBetTx(gameDate: string, team1: string, team2: string, predictedWinner: string) {
    const receipt = await writeWithFinality('create_bet', [gameDate, team1, team2, predictedWinner], {
      status: 'FINALIZED',
      retries: 200,
      interval: 3000
    });
    return receipt.hash as string;
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
