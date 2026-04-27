/**
 * @hook useContractState
 * @description 
 * A custom React hook for reactive data fetching from the GenLayer blockchain.
 * * * KEY FUNCTIONALITIES:
 * 1. Automated Polling: Implements a 5-second interval to ensure the UI stays 
 * synced with the Intelligent Contract's global state without manual refreshes.
 * 2. RPC Integration: Standardizes the JSON-RPC 'gen_call' structure required 
 * to interact with GenLayer's unique consensus-driven read methods.
 * 3. Lifecycle Management: Properly handles interval cleanup on component 
 * unmount to prevent memory leaks and unnecessary network overhead.
 * * * PARAMETERS:
 * @param contractAddress - The deployed hex address of the Intelligent Contract.
 * @param playerAddress - The wallet address of the user whose points are being queried.
 */

'use client';
import { useState, useEffect } from 'react';

// This hook fetches the current points for a specific player
export function useContractState(contractAddress: string, playerAddress: string) {
  const [data, setData] = useState({ 
    points: 0, 
    loading: true, 
    error: null as string | null 
  });

  useEffect(() => {
    if (!contractAddress || !playerAddress) return;

    const fetchState = async () => {
      try {
        // Note: In a real PR, ensure the 'client' import matches 
        // the boilerplate's existing RPC configuration
        const response = await fetch(`${process.env.NEXT_PUBLIC_GENLAYER_RPC_URL}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'gen_call',
            params: [contractAddress, 'get_points', [playerAddress]],
            id: 1,
          }),
        });

        const result = await response.json();
        
        if (result.error) throw new Error(result.error.message);
        
        setData({ 
          points: result.result || 0, 
          loading: false, 
          error: null 
        });
      } catch (err: any) {
        setData(prev => ({ ...prev, loading: false, error: err.message }));
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 5000); 
    return () => clearInterval(interval);
  }, [contractAddress, playerAddress]);

  return data;
}
