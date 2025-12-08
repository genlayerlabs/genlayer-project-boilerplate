"use client";

import { Loader2, Trophy, Clock, AlertCircle } from "lucide-react";
import { useBets, useResolveBet, useFootballBetsContract } from "@/lib/hooks/useFootballBets";
import { useWallet } from "@/lib/genlayer/wallet";
import { error } from "@/lib/utils/toast";
import { AddressDisplay } from "./AddressDisplay";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { Bet } from "@/lib/contracts/types";

export function BetsTable() {
  const contract = useFootballBetsContract();
  const { data: bets, isLoading, isError } = useBets();
  const { address, isConnected, isLoading: isWalletLoading } = useWallet();
  const { resolveBet, isResolving, resolvingBetId } = useResolveBet();

  const handleResolve = (betId: string) => {
    if (!address) {
      error("Please connect your wallet to resolve bets");
      return;
    }

    // Confirmation popup
    const confirmed = confirm("Are you sure you want to resolve this bet? This action will determine the winner.");

    if (confirmed) {
      resolveBet(betId);
    }
  };

  if (isLoading) {
    return (
      <div className="brand-card p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
          <p className="text-sm text-muted-foreground">Loading bets...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="brand-card p-12">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 mx-auto text-yellow-400 opacity-60" />
          <h3 className="text-xl font-bold">Setup Required</h3>
          <div className="space-y-2">
            <p className="text-muted-foreground">
              Contract address not configured.
            </p>
            <p className="text-sm text-muted-foreground">
              Please set <code className="bg-muted px-1 py-0.5 rounded text-xs">NEXT_PUBLIC_CONTRACT_ADDRESS</code> in your .env file.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="brand-card p-8">
        <div className="text-center">
          <p className="text-destructive">Failed to load bets. Please try again.</p>
        </div>
      </div>
    );
  }

  if (!bets || bets.length === 0) {
    return (
      <div className="brand-card p-12">
        <div className="text-center space-y-3">
          <Trophy className="w-16 h-16 mx-auto text-muted-foreground opacity-30" />
          <h3 className="text-xl font-bold">No Bets Yet</h3>
          <p className="text-muted-foreground">
            Be the first to create a football prediction bet!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="brand-card p-6 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Teams
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Prediction
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Owner
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {bets.map((bet) => (
              <BetRow
                key={bet.id}
                bet={bet}
                currentAddress={address}
                isConnected={isConnected}
                isWalletLoading={isWalletLoading}
                onResolve={handleResolve}
                isResolving={isResolving && resolvingBetId === bet.id}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface BetRowProps {
  bet: Bet;
  currentAddress: string | null;
  isConnected: boolean;
  isWalletLoading: boolean;
  onResolve: (betId: string) => void;
  isResolving: boolean;
}

// Helper function to format prediction/winner display
function formatWinner(winnerCode: string, team1?: string, team2?: string): string {
  if (winnerCode === "1") return team1 || "Team 1";
  if (winnerCode === "2") return team2 || "Team 2";
  if (winnerCode === "0") return "Draw";
  return winnerCode;
}

// Helper function to get badge color for prediction
function getPredictionColor(winnerCode: string): string {
  if (winnerCode === "0") return "text-yellow-400 border-yellow-500/30";
  return "text-accent border-accent/30";
}

function BetRow({ bet, currentAddress, isConnected, isWalletLoading, onResolve, isResolving }: BetRowProps) {
  const isOwner = currentAddress?.toLowerCase() === bet.owner?.toLowerCase();
  const canResolve = isConnected && currentAddress && isOwner && !bet.has_resolved && !isWalletLoading;

  return (
    <tr className="group hover:bg-white/5 transition-colors animate-fade-in">
      <td className="px-4 py-4">
        <span className="text-sm">{bet.game_date}</span>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{bet.team1}</span>
          <span className="text-xs text-muted-foreground">vs</span>
          <span className="text-sm font-semibold">{bet.team2}</span>
        </div>
      </td>
      <td className="px-4 py-4">
        <Badge variant="outline" className={getPredictionColor(bet.predicted_winner)}>
          {formatWinner(bet.predicted_winner, bet.team1, bet.team2)}
        </Badge>
      </td>
      <td className="px-4 py-4">
        {bet.has_resolved ? (
          <div className="flex items-center gap-2">
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <Trophy className="w-3 h-3 mr-1" />
              Resolved
            </Badge>
            {bet.real_winner && (
              <span className="text-xs text-muted-foreground">
                Winner: <span className={`font-semibold ${bet.real_winner === "0" ? "text-yellow-400" : "text-foreground"}`}>
                  {formatWinner(bet.real_winner, bet.team1, bet.team2)}
                </span>
              </span>
            )}
          </div>
        ) : (
          <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )}
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <AddressDisplay address={bet.owner} maxLength={10} showCopy={true} />
          {isOwner && (
            <Badge variant="secondary" className="text-xs">
              You
            </Badge>
          )}
        </div>
      </td>
      <td className="px-4 py-4">
        {canResolve && (
          <Button
            onClick={() => onResolve(bet.id)}
            disabled={isResolving}
            size="sm"
            variant="gradient"
          >
            {isResolving ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                Resolving...
              </>
            ) : (
              "Resolve"
            )}
          </Button>
        )}
      </td>
    </tr>
  );
}
