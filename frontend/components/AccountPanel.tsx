"use client";

import { useState } from "react";
import { User, LogOut, AlertCircle, ExternalLink } from "lucide-react";
import { useWallet } from "@/lib/genlayer/wallet";
import { usePlayerPoints } from "@/lib/hooks/useFootballBets";
import { success, error, userRejected } from "@/lib/utils/toast";
import { AddressDisplay } from "./AddressDisplay";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

const METAMASK_INSTALL_URL = "https://metamask.io/download/";

export function AccountPanel() {
  const {
    address,
    isConnected,
    isMetaMaskInstalled,
    isOnCorrectNetwork,
    isLoading,
    connectWallet,
    disconnectWallet,
    switchWalletAccount,
  } = useWallet();

  const { data: points = 0 } = usePlayerPoints(address);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleConnect = async () => {
    if (!isMetaMaskInstalled) {
      return;
    }

    try {
      setIsConnecting(true);
      setConnectionError("");
      await connectWallet();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Failed to connect wallet:", err);
      setConnectionError(err.message || "Failed to connect to MetaMask");

      if (err.message?.includes("rejected")) {
        userRejected("Connection cancelled");
      } else {
        error("Failed to connect wallet", {
          description: err.message || "Check your MetaMask and try again."
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setIsModalOpen(false);
  };

  const handleSwitchAccount = async () => {
    try {
      setIsSwitching(true);
      setConnectionError("");
      await switchWalletAccount();
      // Keep modal open to show new account info
    } catch (err: any) {
      console.error("Failed to switch account:", err);

      // Don't show error if user cancelled
      if (!err.message?.includes("rejected")) {
        setConnectionError(err.message || "Failed to switch account");
        error("Failed to switch account", {
          description: err.message || "Please try again."
        });
      } else {
        userRejected("Account switch cancelled");
      }
    } finally {
      setIsSwitching(false);
    }
  };

  // Not connected state
  if (!isConnected) {
    return (
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger asChild>
          <Button variant="gradient" disabled={isLoading}>
            <User className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        </DialogTrigger>
        <DialogContent className="brand-card border-2">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Connect to GenLayer
            </DialogTitle>
            <DialogDescription>
              Connect your MetaMask wallet to start betting
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {!isMetaMaskInstalled ? (
              <>
                <Alert variant="default" className="bg-accent/10 border-accent/20">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>MetaMask Not Detected</AlertTitle>
                  <AlertDescription>
                    Please install MetaMask to continue. MetaMask is a crypto
                    wallet that allows you to interact with blockchain applications.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={() => window.open(METAMASK_INSTALL_URL, "_blank")}
                  variant="gradient"
                  className="w-full h-14 text-lg"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Install MetaMask
                </Button>

                <div className="p-4 rounded-lg bg-muted/10 border border-muted/20">
                  <p className="text-xs text-muted-foreground">
                    After installing MetaMask, refresh this page and click
                    &quot;Connect Wallet&quot; again.
                  </p>
                </div>
              </>
            ) : (
              <>
                <Button
                  onClick={handleConnect}
                  variant="gradient"
                  className="w-full h-14 text-lg"
                  disabled={isConnecting}
                >
                  <User className="w-5 h-5 mr-2" />
                  {isConnecting ? "Connecting..." : "Connect MetaMask"}
                </Button>

                {connectionError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Connection Error</AlertTitle>
                    <AlertDescription>{connectionError}</AlertDescription>
                  </Alert>
                )}

                <div className="p-4 rounded-lg bg-muted/10 border border-muted/20">
                  <p className="text-xs text-muted-foreground">
                    This will open MetaMask and prompt you to:
                  </p>
                  <ol className="text-xs text-muted-foreground list-decimal list-inside mt-2 space-y-1">
                    <li>Connect your wallet to this application</li>
                    <li>Add the GenLayer network to MetaMask</li>
                    <li>Switch to the GenLayer network</li>
                  </ol>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Connected state
  return (
    <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
      <div className="flex items-center gap-4">
        <div className="brand-card px-4 py-2 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-accent" />
            <AddressDisplay address={address} maxLength={12} />
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-accent">{points}</span>
            <span className="text-xs text-muted-foreground">pts</span>
          </div>
        </div>

        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <User className="w-4 h-4" />
          </Button>
        </DialogTrigger>
      </div>

      <DialogContent className="brand-card border-2">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Wallet Details
          </DialogTitle>
          <DialogDescription>
            Your connected MetaMask wallet information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="brand-card p-4 space-y-2">
            <p className="text-sm text-muted-foreground">Your Address</p>
            <code className="text-sm font-mono break-all">{address}</code>
          </div>

          <div className="brand-card p-4 space-y-2">
            <p className="text-sm text-muted-foreground">Your Points</p>
            <p className="text-2xl font-bold text-accent">{points}</p>
          </div>

          <div className="brand-card p-4 space-y-2">
            <p className="text-sm text-muted-foreground">Network Status</p>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  isOnCorrectNetwork
                    ? "bg-green-500"
                    : "bg-yellow-500 animate-pulse"
                }`}
              />
              <span className="text-sm">
                {isOnCorrectNetwork
                  ? "Connected to GenLayer"
                  : "Wrong Network"}
              </span>
            </div>
          </div>

          {!isOnCorrectNetwork && (
            <Alert variant="default" className="bg-yellow-500/10 border-yellow-500/20">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertTitle>Network Warning</AlertTitle>
              <AlertDescription>
                You&apos;re not on the GenLayer network. Please switch networks in
                MetaMask or try reconnecting.
              </AlertDescription>
            </Alert>
          )}

          {connectionError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{connectionError}</AlertDescription>
            </Alert>
          )}

          <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
            <Button
              onClick={handleSwitchAccount}
              variant="outline"
              className="w-full"
              disabled={isSwitching || isLoading}
            >
              <User className="w-4 h-4 mr-2" />
              {isSwitching ? "Switching..." : "Switch Account"}
            </Button>

            <Button
              onClick={handleDisconnect}
              className="w-full text-destructive hover:text-destructive"
              variant="outline"
              disabled={isSwitching || isLoading}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect Wallet
            </Button>
          </div>

          <div className="p-4 rounded-lg bg-muted/10 border border-muted/20">
            <p className="text-xs text-muted-foreground">
              Use &quot;Switch Account&quot; to select a different MetaMask
              account. Use &quot;Disconnect&quot; to remove this site from
              MetaMask.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
