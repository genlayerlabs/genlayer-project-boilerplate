"use client";

import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { BetsTable } from "@/components/BetsTable";
import { Leaderboard } from "@/components/Leaderboard";
import { ClaimsTable } from "@/components/ClaimsTable";
import { CreateClaimModal } from "@/components/CreateClaimModal";
import { Sparkles, HelpCircle, Trophy } from "lucide-react";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<"football" | "fact-checker">("football");

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <Navbar />

      {/* Main Content - Padding to account for fixed navbar */}
      <main className="flex-grow pt-24 pb-12 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          
          {/* Tab Toggle Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/5 p-1.5 rounded-xl border border-white/10 flex gap-2">
              <button
                onClick={() => setActiveTab("football")}
                className={`py-2 px-6 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeTab === "football"
                    ? "bg-accent text-accent-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Trophy className="w-4 h-4" />
                Football Bets
              </button>
              <button
                onClick={() => setActiveTab("fact-checker")}
                className={`py-2 px-6 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                  activeTab === "fact-checker"
                    ? "bg-accent text-accent-foreground shadow"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                AI Fact-Checker
              </button>
            </div>
          </div>

          {activeTab === "football" ? (
            <>
              {/* Hero Section */}
              <div className="text-center mb-8 animate-fade-in">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4">
                  Football Prediction Betting
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                  AI-powered football match predictions on GenLayer blockchain.
                  <br />
                  Create bets, make predictions, and compete for points.
                </p>
              </div>

              {/* Main Grid Layout - Bets */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                {/* Left Column - Bets Table (67% on desktop) */}
                <div className="lg:col-span-8 animate-slide-up">
                  <BetsTable />
                </div>

                {/* Right Column - Leaderboard (33% on desktop) */}
                <div className="lg:col-span-4 animate-slide-up" style={{ animationDelay: "100ms" }}>
                  <Leaderboard />
                </div>
              </div>

              {/* Info Section */}
              <div className="mt-8 glass-card p-6 md:p-8 animate-fade-in" style={{ animationDelay: "200ms" }}>
                <h2 className="text-2xl font-bold mb-4">How it Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="text-accent font-bold text-lg">1. Create a Bet</div>
                    <p className="text-sm text-muted-foreground">
                      Connect your wallet and create a football match prediction. Choose the teams, date, and your predicted winner.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-accent font-bold text-lg">2. Wait for Resolution</div>
                    <p className="text-sm text-muted-foreground">
                      After the match, the bet creator resolves the bet. GenLayer's AI verifies the actual match result.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-accent font-bold text-lg">3. Earn Points</div>
                    <p className="text-sm text-muted-foreground">
                      Correct predictions earn you points. Climb the leaderboard and prove your football knowledge!
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Fact Checker Hero Section */}
              <div className="text-center mb-8 animate-fade-in">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 flex items-center justify-center gap-3">
                  AI Fact-Checking Market
                </h1>
                <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
                  Decentralized prediction market for statement verifications.
                  Staking pools resolved by GenLayer's web scraping and LLM consensus.
                </p>
                <div className="flex justify-center">
                  <CreateClaimModal />
                </div>
              </div>

              {/* Claims Section */}
              <div className="animate-slide-up">
                <ClaimsTable />
              </div>

              {/* Info Section */}
              <div className="mt-8 glass-card p-6 md:p-8 animate-fade-in" style={{ animationDelay: "150ms" }}>
                <h2 className="text-2xl font-bold mb-4">How it Works</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="text-accent font-bold text-lg">1. Post a Claim</div>
                    <p className="text-sm text-muted-foreground">
                      State a claim and supply a verification URL. Stake your initial coins on True or False to seed the prediction pool.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-accent font-bold text-lg">2. Public Betting</div>
                    <p className="text-sm text-muted-foreground">
                      Other users place stakes supporting (True) or debunking (False) the claim, growing the reward pool.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-accent font-bold text-lg">3. AI Resolution & Payout</div>
                    <p className="text-sm text-muted-foreground">
                      Any network user can trigger resolution. GenVM renders the webpage, prompts LLM consensus, and distributes reward pools to correct stakers.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <a
              href="https://genlayer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              Powered by GenLayer
            </a>
            <a
              href="https://studio.genlayer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              Studio
            </a>
            <a
              href="https://docs.genlayer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              Docs
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
