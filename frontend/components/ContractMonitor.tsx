/**
 * @component ContractMonitor
 * @description 
 * A production-ready dashboard component designed for the GenLayer boilerplate.
 * * KEY FEATURES:
 * 1. Real-time State Tracking: Automatically polls the GenLayer Intelligent Contract 
 * every 5 seconds to fetch updated player points.
 * 2. Visual Status Indicator: Includes a pulsing LED-style status light that 
 * distinguishes between "Loading/Connecting" (Blue) and "Live" (Green).
 * 3. Robust Error Handling: Displays human-readable error messages if the 
 * RPC connection fails or the contract address is invalid.
 * * USAGE:
 * Place this component in any Next.js Page. Requires 'contractAddress' and 
 * 'playerAddress' as props.
 */

'use client';
import { useContractState } from '../hooks/useContractState';

interface Props {
  contractAddress: string;
  playerAddress: string;
}

export function ContractMonitor({ contractAddress, playerAddress }: Props) {
  const { points, loading, error } = useContractState(contractAddress, playerAddress);

  return (
    <div className="rounded-xl border bg-card text-card-foreground shadow p-6 mb-6">
      <div className="flex items-center justify-between space-y-0 pb-2">
        <h3 className="tracking-tight text-sm font-medium">Your Performance</h3>
        <div className={`h-2 w-2 rounded-full ${loading ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
      </div>
      
      <div className="flex flex-col gap-1">
        {error ? (
          <p className="text-xs text-red-500 font-mono">Error: {error}</p>
        ) : (
          <>
            <div className="text-3xl font-bold">{points} Points</div>
            <p className="text-xs text-muted-foreground">
              Live data from Intelligent Contract
            </p>
          </>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-border/50">
        <p className="text-[10px] font-mono text-muted-foreground truncate">
          Contract: {contractAddress}
        </p>
      </div>
    </div>
  );
}
