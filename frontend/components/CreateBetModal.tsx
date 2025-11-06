"use client";

import { useState } from "react";
import { Plus, Loader2, Calendar, Users } from "lucide-react";
import { useCreateBet } from "@/lib/hooks/useFootballBets";
import { useWallet } from "@/lib/genlayer/wallet";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function CreateBetModal() {
  const { isConnected } = useWallet();
  const { createBet, isCreating, isSuccess } = useCreateBet();

  const [isOpen, setIsOpen] = useState(false);
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

    if (!isConnected) {
      alert("Please connect your wallet first");
      return;
    }

    if (!validateForm()) {
      return;
    }

    try {
      await createBet({
        gameDate,
        team1,
        team2,
        predictedWinner: predictedWinner, // Send "1", "2", or "0" directly
      });

      // Reset form on success
      setGameDate("");
      setTeam1("");
      setTeam2("");
      setPredictedWinner("");
      setErrors({ gameDate: "", team1: "", team2: "", predictedWinner: "" });
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to create bet:", error);
      alert("Failed to create bet. Please try again.");
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && !isCreating) {
      // Reset form when closing
      setGameDate("");
      setTeam1("");
      setTeam2("");
      setPredictedWinner("");
      setErrors({ gameDate: "", team1: "", team2: "", predictedWinner: "" });
    }
    setIsOpen(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="glass-button-primary" disabled={!isConnected}>
          <Plus className="w-4 h-4 mr-2" />
          Create Bet
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border-2 sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create Football Bet</DialogTitle>
          <DialogDescription>
            Make your prediction for an upcoming football match
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Game Date */}
          <div className="space-y-2">
            <Label htmlFor="gameDate" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
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
              variant="outline"
              className="flex-1 glass-button-secondary"
              onClick={() => setIsOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 glass-button-primary"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Bet"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
