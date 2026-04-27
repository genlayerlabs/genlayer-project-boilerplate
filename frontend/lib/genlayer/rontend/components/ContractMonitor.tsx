'use client';

import React, { useEffect, useState } from 'react';
import { useGenLayer } from '@/hooks/useGenLayer'; // Adjust path based on your boilerplate

export default function ContractMonitor({ contractAddress }: { contractAddress: string }) {
  const { client, account } = useGenLayer();
  const [points, setPoints] = useState<number | null>(null);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const updateState = async () => {
      try {
        // 1. Check RPC Connection
        if (client) {
          setIsLive(true);
          
          // 2. Fetch State (get_points)
          // Note: readContract is used for view methods that don't require a transaction
          const data = await client.readContract({
            address: contractAddress,
            functionName: 'get_points',
            args: [account?.address],
          });
          setPoints(Number(data));
        }
      } catch (err) {
        setIsLive(false);
        console.error("Monitor sync failed:", err);
      }
    };

    const interval = setInterval(updateState, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, [client, account, contractAddress]);

  return (
    <div className="p-4 border rounded-lg bg-card flex items-center justify-between shadow-sm">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          {/* Pulsing Live Indicator */}
          <div className={`h-2 w-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs font-mono uppercase tracking-wider opacity-70">
            {isLive ? 'Network Live' : 'Disconnected'}
          </span>
        </div>
        <p className="text-xs font-mono truncate max-w-[200px]">
          Addr: <span className="text-primary">{contractAddress}</span>
        </p>
      </div>

      <div className="text-right">
        <p className="text-xs opacity-70 uppercase">Current Points</p>
        <p className="text-2xl font-bold">{points !== null ? points : '--'}</p>
      </div>
    </div>
  );
}
