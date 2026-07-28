"use client";

import { useState, useEffect } from "react";
import { Plus, Loader2, Link2, HelpCircle } from "lucide-react";
import { useCreateClaim } from "@/lib/hooks/useFactChecker";
import type { FeePresetLevel } from "@/lib/genlayer/fees";
import { useWallet } from "@/lib/genlayer/wallet";
import { error } from "@/lib/utils/toast";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { parseEther } from "viem";

export function CreateClaimModal() {
  const { isConnected, address, isLoading } = useWallet();
  const { createClaim, isCreating, isSuccess } = useCreateClaim();

  const [isOpen, setIsOpen] = useState(false);
  const [claimText, setClaimText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [initialVote, setInitialVote] = useState<boolean | null>(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [feePresetLevel, setFeePresetLevel] = useState<FeePresetLevel>("standard");

  const [errors, setErrors] = useState({
    claimText: "",
    sourceUrl: "",
    initialVote: "",
    stakeAmount: "",
  });

  // Auto-close modal when wallet disconnects unless writing tx
  useEffect(() => {
    if (!isConnected && isOpen && !isCreating) {
      setIsOpen(false);
    }
  }, [isConnected, isOpen, isCreating]);

  const validateForm = (): boolean => {
    const newErrors = {
      claimText: "",
      sourceUrl: "",
      initialVote: "",
      stakeAmount: "",
    };

    if (!claimText.trim()) {
      newErrors.claimText = "Claim text is required";
    }

    if (!sourceUrl.trim()) {
      newErrors.sourceUrl = "Source URL is required";
    } else {
      try {
        new URL(sourceUrl);
      } catch (err) {
        newErrors.sourceUrl = "Please enter a valid URL (including https://)";
      }
    }

    if (initialVote === null) {
      newErrors.initialVote = "Please select your initial vote stance";
    }

    if (!stakeAmount.trim() || isNaN(Number(stakeAmount)) || Number(stakeAmount) <= 0) {
      newErrors.stakeAmount = "Please enter a valid stake amount greater than zero";
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== "");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected || !address) {
      error("Please connect your wallet first");
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      const stakeWei = parseEther(stakeAmount);
      createClaim({
        claimText,
        sourceUrl,
        initialVote: initialVote as boolean,
        stakeAmountWei: stakeWei,
        feePresetLevel,
      });
    } catch (err: any) {
      error("Transaction failed", { description: err.message });
    }
  };

  const resetForm = () => {
    setClaimText("");
    setSourceUrl("");
    setInitialVote(null);
    setStakeAmount("");
    setErrors({ claimText: "", sourceUrl: "", initialVote: "", stakeAmount: "" });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isCreating) {
      resetForm();
    }
    setIsOpen(open);
  };

  // Reset form and close modal on successful claim creation
  useEffect(() => {
    if (isSuccess) {
      resetForm();
      setIsOpen(false);
    }
  }, [isSuccess]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="gradient" disabled={!isConnected || !address || isLoading}>
          <Plus className="w-4 h-4 mr-2" />
          Create Claim
        </Button>
      </DialogTrigger>
      <DialogContent className="brand-card border-2 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-accent" />
            Create Claim
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Publish a fact-checking statement, provide a validation URL, and stake coins to seed the prediction market.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Claim Text Input */}
          <div className="space-y-2">
            <Label htmlFor="claimText">Claim Statement</Label>
            <div className="relative">
              <Input
                id="claimText"
                placeholder="e.g. SpaceX successfully launched its Starship rocket on June 6, 2024"
                value={claimText}
                onChange={(e) => setClaimText(e.target.value)}
                disabled={isCreating}
                className={errors.claimText ? "border-destructive focus-visible:ring-destructive" : ""}
              />
            </div>
            {errors.claimText && (
              <p className="text-xs text-destructive mt-1">{errors.claimText}</p>
            )}
          </div>

          {/* Source URL Input */}
          <div className="space-y-2">
            <Label htmlFor="sourceUrl">Source Webpage URL</Label>
            <div className="relative">
              <Link2 className="absolute left-3 top-3 h-4 h-4 text-muted-foreground" />
              <Input
                id="sourceUrl"
                placeholder="https://example.com/article-verifying-the-claim"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                disabled={isCreating}
                className={`pl-10 ${errors.sourceUrl ? "border-destructive focus-visible:ring-destructive" : ""}`}
              />
            </div>
            {errors.sourceUrl && (
              <p className="text-xs text-destructive mt-1">{errors.sourceUrl}</p>
            )}
          </div>

          {/* Stance Choice (Initial Vote) */}
          <div className="space-y-2">
            <Label>Your Vote / Stance</Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setInitialVote(true)}
                disabled={isCreating}
                className={`py-3 px-4 rounded-xl border text-center font-semibold transition-all ${
                  initialVote === true
                    ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-md"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                True (Support)
              </button>
              <button
                type="button"
                onClick={() => setInitialVote(false)}
                disabled={isCreating}
                className={`py-3 px-4 rounded-xl border text-center font-semibold transition-all ${
                  initialVote === false
                    ? "border-destructive bg-destructive/10 text-destructive hover:border-destructive hover:bg-destructive/20"
                    : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                }`}
              >
                False (Debunk)
              </button>
            </div>
            {errors.initialVote && (
              <p className="text-xs text-destructive mt-1">{errors.initialVote}</p>
            )}
          </div>

          {/* Deposit Staking Amount */}
          <div className="space-y-2">
            <Label htmlFor="stakeAmount">Initial Stake (GEN)</Label>
            <div className="relative">
              <Input
                id="stakeAmount"
                type="text"
                placeholder="10.0"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                disabled={isCreating}
                className={errors.stakeAmount ? "border-destructive focus-visible:ring-destructive" : ""}
              />
              <span className="absolute right-3 top-3 text-xs text-muted-foreground font-semibold">
                GEN
              </span>
            </div>
            {errors.stakeAmount && (
              <p className="text-xs text-destructive mt-1">{errors.stakeAmount}</p>
            )}
          </div>

          {/* Fee Preset Level Selector */}
          <div className="space-y-2">
            <Label>Transaction Fee Priority</Label>
            <div className="grid grid-cols-3 gap-2">
              {(["slow", "standard", "fast"] as FeePresetLevel[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setFeePresetLevel(level)}
                  disabled={isCreating}
                  className={`py-2 px-3 text-xs rounded-lg border capitalize transition-all ${
                    feePresetLevel === level
                      ? "border-accent bg-accent/10 text-accent font-semibold"
                      : "border-white/5 bg-white/5 text-muted-foreground hover:bg-white/10"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" variant="gradient" disabled={isCreating}>
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Claim & Stake"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
