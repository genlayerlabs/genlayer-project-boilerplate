"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Calendar, Users, ArrowLeft } from "lucide-react";
import { GenLayerTransactionPanel, type SubmitInput, type TrackedStatus } from "@genlayer/transaction-kit-react";
import { useInvalidateBetsData } from "@/lib/hooks/useFootballBets";
import { GENLAYER_NETWORK, getContractAddress } from "@/lib/genlayer/client";
import { useTransactionKit } from "@/lib/genlayer/kit";
import { useWallet } from "@/lib/genlayer/wallet";
import { error, success } from "@/lib/utils/toast";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function CreateBetModal() {
  const { isConnected, address, isLoading } = useWallet();
  const kit = useTransactionKit(address);
  const invalidateBetsData = useInvalidateBetsData();
  const contractAddress = getContractAddress();

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"form" | "review">("form");
  const [gameDate, setGameDate] = useState("");
  const [team1, setTeam1] = useState("");
  const [team2, setTeam2] = useState("");
  const [predictedWinner, setPredictedWinner] = useState<"1" | "2" | "0" | "">("");

  const [errors, setErrors] = useState({
    gameDate: "",
    team1: "",
    team2: "",
    predictedWinner: "",
  });

  // Stable tx identity: useTransactionFlow re-estimates (and resets the flow)
  // whenever the tx object reference changes, so it must not be re-created on
  // unrelated re-renders while the panel is mounted.
  const createBetTx = useMemo<SubmitInput>(
    () => ({
      kind: "write",
      address: contractAddress as `0x${string}`,
      method: "create_bet",
      args: [gameDate, team1, team2, predictedWinner],
    }),
    [contractAddress, gameDate, team1, team2, predictedWinner],
  );

  // Auto-close modal when wallet disconnects
  useEffect(() => {
    if (!isConnected && isOpen && step === "form") {
      setIsOpen(false);
    }
  }, [isConnected, isOpen, step]);

  const validateForm = (): boolean => {
    const newErrors = {
      gameDate: "",
      team1: "",
      team2: "",
      predictedWinner: "",
    };

    if (!gameDate.trim()) {
      newErrors.gameDate = "Game date is required";
    }

    if (!team1.trim()) {
      newErrors.team1 = "Team 1 name is required";
    }

    if (!team2.trim()) {
      newErrors.team2 = "Team 2 name is required";
    }

    if (!predictedWinner) {
      newErrors.predictedWinner = "Please select your predicted winner";
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

    if (!kit) {
      error("Transaction kit unavailable", {
        description: "Please check your wallet connection and try again."
      });
      return;
    }

    if (!contractAddress) {
      error("Contract address not configured", {
        description: "Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your .env file."
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setStep("review");
  };

  const resetForm = () => {
    setGameDate("");
    setTeam1("");
    setTeam2("");
    setPredictedWinner("");
    setStep("form");
    setErrors({ gameDate: "", team1: "", team2: "", predictedWinner: "" });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    setIsOpen(open);
  };

  const handleDone = (status: TrackedStatus) => {
    if (status.successful !== false) {
      invalidateBetsData();
      success("Bet created successfully!", {
        description: "Your prediction has been recorded on the blockchain."
      });
      resetForm();
      setIsOpen(false);
      return;
    }

    error("Failed to create bet", {
      description: "The transaction completed without a successful outcome."
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="gradient" disabled={!isConnected || !address || isLoading}>
          <Plus className="w-4 h-4 mr-2" />
          Create Bet
        </Button>
      </DialogTrigger>
      <DialogContent className="brand-card border-2 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create Football Bet</DialogTitle>
          <DialogDescription>
            Make your prediction for an upcoming football match
          </DialogDescription>
        </DialogHeader>

        {step === "review" && kit && contractAddress ? (
          <div className="mt-4 space-y-4">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setStep("form")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <GenLayerTransactionPanel
              kit={kit}
              tx={createBetTx}
              network={GENLAYER_NETWORK.chainName}
              theme="dark"
              trackUntil="decided"
              onDone={handleDone}
            />
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Game Date */}
          <div className="space-y-2">
            <Label htmlFor="gameDate" className="flex items-center gap-2">
              <Calendar className="w-4 h-4 !text-white" />
              Game Date
            </Label>
            <Input
              id="gameDate"
              type="date"
              value={gameDate}
              onChange={(e) => {
                setGameDate(e.target.value);
                setErrors({ ...errors, gameDate: "" });
              }}
              className={errors.gameDate ? "border-destructive" : ""}
            />
            {errors.gameDate && (
              <p className="text-xs text-destructive">{errors.gameDate}</p>
            )}
          </div>

          {/* Teams */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Teams
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Input
                  id="team1"
                  type="text"
                  placeholder="Team 1"
                  value={team1}
                  onChange={(e) => {
                    setTeam1(e.target.value);
                    setErrors({ ...errors, team1: "" });
                  }}
                  className={errors.team1 ? "border-destructive" : ""}
                />
                {errors.team1 && (
                  <p className="text-xs text-destructive">{errors.team1}</p>
                )}
              </div>
              <div className="space-y-2">
                <Input
                  id="team2"
                  type="text"
                  placeholder="Team 2"
                  value={team2}
                  onChange={(e) => {
                    setTeam2(e.target.value);
                    setErrors({ ...errors, team2: "" });
                  }}
                  className={errors.team2 ? "border-destructive" : ""}
                />
                {errors.team2 && (
                  <p className="text-xs text-destructive">{errors.team2}</p>
                )}
              </div>
            </div>
          </div>

          {/* Predicted Winner */}
          <div className="space-y-3">
            <Label>Your Prediction</Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPredictedWinner("1");
                  setErrors({ ...errors, predictedWinner: "" });
                }}
                disabled={!team1.trim()}
                className={`p-4 rounded-lg border-2 transition-all ${
                  predictedWinner === "1"
                    ? "border-accent bg-accent/20 text-accent"
                    : "border-white/10 hover:border-white/20"
                } ${!team1.trim() ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="font-semibold text-sm">{team1 || "Team 1"}</div>
                <div className="text-xs text-muted-foreground mt-1">Wins</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPredictedWinner("0");
                  setErrors({ ...errors, predictedWinner: "" });
                }}
                disabled={!team1.trim() || !team2.trim()}
                className={`p-4 rounded-lg border-2 transition-all ${
                  predictedWinner === "0"
                    ? "border-yellow-500 bg-yellow-500/20 text-yellow-400"
                    : "border-white/10 hover:border-white/20"
                } ${!team1.trim() || !team2.trim() ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="font-semibold text-sm">Draw</div>
                <div className="text-xs text-muted-foreground mt-1">Tie</div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPredictedWinner("2");
                  setErrors({ ...errors, predictedWinner: "" });
                }}
                disabled={!team2.trim()}
                className={`p-4 rounded-lg border-2 transition-all ${
                  predictedWinner === "2"
                    ? "border-accent bg-accent/20 text-accent"
                    : "border-white/10 hover:border-white/20"
                } ${!team2.trim() ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <div className="font-semibold text-sm">{team2 || "Team 2"}</div>
                <div className="text-xs text-muted-foreground mt-1">Wins</div>
              </button>
            </div>
            {errors.predictedWinner && (
              <p className="text-xs text-destructive">{errors.predictedWinner}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="gradient"
              className="flex-1"
              disabled={!kit}
            >
              Create Bet
            </Button>
          </div>
        </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
