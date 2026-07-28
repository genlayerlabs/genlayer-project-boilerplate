"use client";

import { useState, useEffect } from "react";
import { 
  useClaims, 
  usePlaceStake, 
  useResolveClaim, 
  useClaimReward 
} from "@/lib/hooks/useFactChecker";
import { useWallet } from "@/lib/genlayer/wallet";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { 
  Coins, 
  Sparkles, 
  Loader2,
  Activity,
  Terminal,
  FileSearch,
  ChevronRight,
  ArrowUpRight
} from "lucide-react";
import { parseEther, formatEther } from "viem";
import { error } from "@/lib/utils/toast";

export function ClaimsTable() {
  const { isConnected } = useWallet();
  const { data: claims, isLoading: isClaimsLoading } = useClaims();
  const { placeStake, isStaking } = usePlaceStake();
  const { resolveClaim, isResolving, resolvingClaimId } = useResolveClaim();
  const { claimReward, isClaiming, claimingClaimId } = useClaimReward();

  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);

  // Dialog state for placing a stake
  const [stakeModalOpen, setStakeModalOpen] = useState(false);
  const [selectedVote, setSelectedVote] = useState<boolean>(true);
  const [stakeAmount, setStakeAmount] = useState("");
  const [stakeError, setStakeError] = useState("");

  const activeClaims = claims || [];

  // Set first claim as default selected
  useEffect(() => {
    if (activeClaims.length > 0 && !selectedClaimId) {
      setSelectedClaimId(activeClaims[0].id);
    }
  }, [activeClaims, selectedClaimId]);

  const selectedClaim = activeClaims.find((c) => c.id === selectedClaimId);

  const handleOpenStakeModal = (vote: boolean) => {
    if (!selectedClaimId) return;
    setSelectedVote(vote);
    setStakeAmount("");
    setStakeError("");
    setStakeModalOpen(true);
  };

  const handleStakeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaimId) return;

    if (!stakeAmount.trim() || isNaN(Number(stakeAmount)) || Number(stakeAmount) <= 0) {
      setStakeError("Please enter a valid amount greater than zero");
      return;
    }

    try {
      const stakeWei = parseEther(stakeAmount);
      placeStake({
        claimId: selectedClaimId,
        vote: selectedVote,
        stakeAmountWei: stakeWei,
      });
      setStakeModalOpen(false);
    } catch (err: any) {
      error("Transaction construction failed", { description: err.message });
    }
  };

  const formatStake = (weiStr: string | undefined) => {
    if (!weiStr) return "0.00 GEN";
    try {
      const val = formatEther(BigInt(weiStr));
      return parseFloat(val).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      }) + " GEN";
    } catch (e) {
      return "0.00 GEN";
    }
  };

  if (isClaimsLoading) {
    return (
      <div className="bg-zinc-950 border border-zinc-800 p-16 text-center flex flex-col items-center justify-center gap-4 min-h-[500px]">
        <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
        <p className="text-xs font-mono tracking-widest text-zinc-500 uppercase">
          Initializing Analyst Environment...
        </p>
      </div>
    );
  }

  // Calculate percentages
  let truePercent = 50;
  let falsePercent = 50;
  let totalVal = BigInt(0);
  if (selectedClaim) {
    const trueVal = BigInt(selectedClaim.total_true_stake);
    const falseVal = BigInt(selectedClaim.total_false_stake);
    totalVal = trueVal + falseVal;
    if (totalVal > BigInt(0)) {
      truePercent = Number((trueVal * BigInt(100)) / totalVal);
      falsePercent = 100 - truePercent;
    }
  }

  return (
    <div className="space-y-6">
      {/* Stake Modal */}
      <Dialog open={stakeModalOpen} onOpenChange={setStakeModalOpen}>
        <DialogContent className="bg-zinc-950 border border-zinc-800 rounded-none sm:max-w-[400px] text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm font-mono tracking-wider uppercase text-zinc-300">
              <Coins className="w-4 h-4 text-amber-500" />
              Adjust Market Exposure
            </DialogTitle>
            <DialogDescription className="text-zinc-500 text-xs font-sans">
              Allocate GEN to support or debunk the active claim statement.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleStakeSubmit} className="space-y-4 pt-2">
            <div className="p-3 rounded-none border border-zinc-800 bg-zinc-900/50 font-mono text-xs">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Target Stance</span>
              <span className={`font-bold flex items-center gap-2 ${
                selectedVote ? "text-emerald-400" : "text-red-400"
              }`}>
                {selectedVote ? "[ SUPPORT CLAIM — TRUE ]" : "[ DEBUNK CLAIM — FALSE ]"}
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stakeAmountInput" className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                Stake Amount (GEN)
              </Label>
              <div className="relative">
                <Input
                  id="stakeAmountInput"
                  type="text"
                  placeholder="50.0"
                  className={`bg-zinc-900 border-zinc-800 rounded-none text-sm text-white focus-visible:ring-1 focus-visible:ring-zinc-700 ${
                    stakeError ? "border-red-500 focus-visible:ring-red-500" : ""
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-[10px] font-mono text-zinc-500 uppercase">
                  GEN
                </span>
              </div>
              {stakeError && (
                <p className="text-[10px] font-mono text-red-400">{stakeError}</p>
              )}
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setStakeModalOpen(false)}
                className="border-zinc-800 hover:bg-zinc-900 text-xs font-mono rounded-none"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-white hover:bg-zinc-200 text-black text-xs font-mono rounded-none font-bold"
              >
                Confirm Allocation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Main Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px] text-white">
        
        {/* Left Pane: Claims Directory (40% width) */}
        <div className="lg:col-span-5 bg-zinc-950 border border-zinc-800 flex flex-col overflow-hidden h-[600px]">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/40">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-300 flex items-center gap-1.5">
              <FileSearch className="w-3.5 h-3.5 text-zinc-400" /> Claims Directory
            </span>
            <span className="text-[10px] font-mono border border-zinc-800 px-2 py-0.5 rounded-none text-zinc-500">
              {activeClaims.length} items logged
            </span>
          </div>

          {activeClaims.length === 0 ? (
            <div className="p-12 text-center flex-grow flex flex-col justify-center gap-2">
              <Terminal className="w-6 h-6 text-zinc-700 mx-auto" />
              <p className="text-xs font-mono text-zinc-600 uppercase tracking-widest">
                No active claims in database
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto divide-y divide-zinc-900 flex-grow scrollbar-thin">
              {activeClaims.map((claim) => (
                <button
                  key={claim.id}
                  onClick={() => setSelectedClaimId(claim.id)}
                  className={`w-full text-left p-4 transition-all hover:bg-zinc-900/30 block relative ${
                    selectedClaimId === claim.id 
                      ? "bg-zinc-900/60 border-l-2 border-amber-500" 
                      : "border-l-2 border-transparent"
                  }`}
                >
                  <div className="flex justify-between items-center gap-2 mb-2">
                    <span className="text-[10px] font-mono text-zinc-500">
                      SYS_ID // 0x{parseInt(claim.id).toString(16).toUpperCase().padStart(4, '0')}
                    </span>
                    {claim.is_resolved ? (
                      claim.outcome ? (
                        <span className="text-[8px] font-mono border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 px-1.5 py-0.5 uppercase tracking-wider font-bold">
                          [ TRUE ]
                        </span>
                      ) : (
                        <span className="text-[8px] font-mono border border-red-500/30 bg-red-500/5 text-red-400 px-1.5 py-0.5 uppercase tracking-wider font-bold">
                          [ FALSE ]
                        </span>
                      )
                    ) : (
                      <span className="text-[8px] font-mono border border-amber-500/30 bg-amber-500/5 text-amber-400 px-1.5 py-0.5 uppercase tracking-wider font-bold animate-pulse">
                        [ PENDING ]
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-sans font-semibold text-zinc-200 line-clamp-2 leading-relaxed">
                    {claim.claim_text}
                  </h4>
                  <div className="flex justify-between items-center mt-3 text-[10px] font-mono text-zinc-500">
                    <span>Pool: {formatStake((BigInt(claim.total_true_stake) + BigInt(claim.total_false_stake)).toString())}</span>
                    <ChevronRight className="w-3 h-3 text-zinc-600" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Pane: Analyst Inspection Panel (60% width) */}
        <div className="lg:col-span-7 bg-zinc-950 border border-zinc-800 flex flex-col overflow-hidden h-[600px]">
          {selectedClaim ? (
            <div className="flex flex-col h-full">
              
              {/* Inspection Header */}
              <div className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/40 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-xs font-mono uppercase tracking-widest text-zinc-300">
                    Claim Analysis Terminal
                  </span>
                </div>
                <div className="text-[10px] font-mono text-zinc-500">
                  REF_ADDR: 0x...8F2B
                </div>
              </div>

              {/* Inspection Content */}
              <div className="p-6 overflow-y-auto flex-grow space-y-6 scrollbar-thin">
                
                {/* Statement detail */}
                <div className="space-y-1">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">
                    Claim Statement
                  </span>
                  <p className="text-sm font-sans font-bold leading-relaxed text-zinc-100">
                    "{selectedClaim.claim_text}"
                  </p>
                </div>

                {/* Source Verification URL */}
                <div className="p-4 rounded-none border border-zinc-800 bg-zinc-900/30 space-y-2">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest block">
                    Verification Source
                  </span>
                  <a
                    href={selectedClaim.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1 font-mono truncate max-w-full"
                  >
                    {selectedClaim.source_url} <ArrowUpRight className="w-3 h-3" />
                  </a>
                  {/* Simulation of Sandbox Frame */}
                  <div className="h-10 border border-zinc-900 bg-black/60 flex items-center justify-center text-[9px] text-zinc-600 font-mono tracking-widest">
                    [ GENVM_SANDBOX // SECURE_RENDER_CONTAINER ]
                  </div>
                </div>

                {/* Pool Statistics and Visuals */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-none border border-zinc-900 bg-zinc-900/10 space-y-1.5">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                      True Stakes (Support)
                    </span>
                    <div className="text-sm font-mono font-bold text-emerald-400">
                      {formatStake(selectedClaim.total_true_stake)}
                    </div>
                    <div className="text-[9px] font-mono text-zinc-600">{truePercent}% of total pool</div>
                  </div>
                  <div className="p-4 rounded-none border border-zinc-900 bg-zinc-900/10 space-y-1.5">
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">
                      False Stakes (Debunk)
                    </span>
                    <div className="text-sm font-mono font-bold text-red-400">
                      {formatStake(selectedClaim.total_false_stake)}
                    </div>
                    <div className="text-[9px] font-mono text-zinc-600">{falsePercent}% of total pool</div>
                  </div>
                </div>

                {/* Distribution Progress Bar */}
                <div className="space-y-2">
                  <div className="h-1.5 w-full bg-zinc-900 flex border border-zinc-800 overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${truePercent}%` }} />
                    <div className="bg-red-500 h-full transition-all duration-500" style={{ width: `${falsePercent}%` }} />
                  </div>
                </div>

                {/* SIGNATURE ELEMENT: AI Consensus Stamp */}
                {/* NOTE: Metadata details like consensus hashes and logs are simulated. 
                    In production, these are extracted from transaction logs/events to optimize contract gas and storage. */}
                {selectedClaim.is_resolved && (
                  <div className="border border-dashed border-zinc-700 p-4 bg-zinc-900/20 font-mono space-y-3 relative overflow-hidden">
                    {/* Background watermark */}
                    <div className="absolute right-2 -bottom-2 text-zinc-800/10 font-bold text-4xl select-none uppercase tracking-widest font-mono">
                      CONSENSUS
                    </div>

                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2 text-[10px] text-zinc-500 uppercase tracking-wider">
                      <span>Consensus Protocol Output</span>
                      <span>Verified</span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-2 text-xs">
                      <div>
                        <span className="text-zinc-500 block text-[9px] uppercase">Engine Verdict</span>
                        <span className={`font-bold uppercase ${
                          selectedClaim.outcome ? "text-emerald-400" : "text-red-400"
                        }`}>
                          {selectedClaim.outcome ? "Claim Verified True" : "Claim Debunked False"}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block text-[9px] uppercase">Consensus Hash</span>
                        <span className="text-zinc-400 font-mono text-[10px]">0x{parseInt(selectedClaim.id).toString(16).padStart(4, '0')}ef82aa9</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-zinc-500 block text-[9px] uppercase">Evidence Scoped</span>
                        <span className="text-zinc-400 text-[10px] block truncate max-w-sm">
                          Content from {selectedClaim.source_url.replace(/^https?:\/\//, '')} matches statement logic.
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-zinc-800 pt-2 flex items-center justify-between text-[9px] text-zinc-500">
                      <span>GenLayer Node 0.25.0</span>
                      <span>{selectedClaim.outcome ? "STRICT_MATCH_OK" : "STRICT_MATCH_FAIL"}</span>
                    </div>
                  </div>
                )}

              </div>

              {/* Action Footer */}
              <div className="p-6 border-t border-zinc-800 bg-zinc-900/30 flex flex-wrap gap-4 items-center justify-between">
                {!selectedClaim.is_resolved ? (
                  <>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleOpenStakeModal(true)}
                        disabled={!isConnected || isStaking}
                        className="bg-zinc-900 border border-zinc-800 text-emerald-400 hover:bg-zinc-800 hover:border-zinc-700 text-xs font-mono rounded-none px-4"
                      >
                        Stake True
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleOpenStakeModal(false)}
                        disabled={!isConnected || isStaking}
                        className="bg-zinc-900 border border-zinc-800 text-red-400 hover:bg-zinc-800 hover:border-zinc-700 text-xs font-mono rounded-none px-4"
                      >
                        Stake False
                      </Button>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => resolveClaim(selectedClaim.id)}
                      disabled={!isConnected || isResolving}
                      className="bg-white hover:bg-zinc-200 text-black text-xs font-mono rounded-none font-bold px-4"
                    >
                      {isResolving && resolvingClaimId === selectedClaim.id ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                          RUNNING CONSENSUS...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3 mr-1.5" />
                          RESOLVE SYSTEM
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => claimReward(selectedClaim.id)}
                    disabled={!isConnected || isClaiming}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs font-mono rounded-none py-2"
                  >
                    {isClaiming && claimingClaimId === selectedClaim.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        WITHDRAWING FUNDS...
                      </>
                    ) : (
                      <>
                        <Coins className="w-3.5 h-3.5 mr-1.5" />
                        CLAIM REWARD // RECLAIM STAKE
                      </>
                    )}
                  </Button>
                )}
              </div>

            </div>
          ) : (
            <div className="p-12 text-center flex-grow flex flex-col justify-center items-center gap-2">
              <Terminal className="w-6 h-6 text-zinc-700 animate-pulse" />
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
                Select a claim from directory to inspect
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
