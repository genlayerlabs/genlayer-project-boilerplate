import { createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

class FootballBets {
  contractAddress;
  client;

  constructor(contractAddress, account = null, studioUrl = null) {
    this.contractAddress = contractAddress;
    const config = {
      chain: studionet,
      ...(account ? { account } : {}),
      ...(studioUrl ? { endpoint: studioUrl } : {}),
    };
    this.client = createClient(config);
  }

  updateAccount(account) {
    this.client = createClient({ chain: studionet, account });
  }

  async getBets() {
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
  }

  async getPlayerPoints(address) {
    if (!address) {
      return 0;
    }
    const points = await this.client.readContract({
      address: this.contractAddress,
      functionName: "get_player_points",
      args: [address],
    });
    return points;
  }

  async getLeaderboard() {
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
  }

  async createBet(gameDate, team1, team2, predictedWinner) {
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
}

export default FootballBets;
