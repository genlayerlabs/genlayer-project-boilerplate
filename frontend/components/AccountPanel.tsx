"use client";

import { useState } from "react";
import { User, LogOut, Key, Download, Upload } from "lucide-react";
import { useWallet, copyToClipboard, downloadAsFile } from "@/lib/genlayer/wallet";
import { usePlayerPoints } from "@/lib/hooks/useFootballBets";
import { AddressDisplay } from "./AddressDisplay";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";

export function AccountPanel() {
  const { address, isConnected, createAccount, importAccount, disconnectAccount } = useWallet();
  const { data: points = 0 } = usePlayerPoints(address);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importKey, setImportKey] = useState("");
  const [importError, setImportError] = useState("");
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCreateAccount = () => {
    try {
      createAccount();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Failed to create account:", error);
    }
  };

  const handleImportAccount = () => {
    if (!importKey.trim()) {
      setImportError("Please enter a private key");
      return;
    }

    try {
      importAccount(importKey.trim());
      setImportKey("");
      setImportError("");
      setIsModalOpen(false);
    } catch (error) {
      setImportError("Invalid private key. Please check and try again.");
    }
  };

  const handleDisconnect = () => {
    disconnectAccount();
    setShowPrivateKey(false);
    setIsModalOpen(false);
  };

  const handleCopyPrivateKey = async () => {
    if (!address) return;
    const privateKey = localStorage.getItem("genlayer_account_private_key");
    if (privateKey) {
      const success = await copyToClipboard(privateKey);
      if (success) {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    }
  };

  const handleExportPrivateKey = () => {
    if (!address) return;
    const privateKey = localStorage.getItem("genlayer_account_private_key");
    if (privateKey) {
      downloadAsFile(privateKey, `genlayer-${address.slice(0, 8)}.key`);
    }
  };

  if (!isConnected) {
    return (
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger asChild>
          <Button variant="gradient">
            <User className="w-4 h-4 mr-2" />
            Connect Wallet
          </Button>
        </DialogTrigger>
        <DialogContent className="brand-card border-2">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Connect to GenLayer</DialogTitle>
            <DialogDescription>
              Create a new account or import an existing one using your private key
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <Button
              onClick={handleCreateAccount}
              variant="gradient"
              className="w-full h-14 text-lg"
            >
              <User className="w-5 h-5 mr-2" />
              Create New Account
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[oklch(0.15_0.01_0)] px-2 text-muted-foreground">
                  Or import existing
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter your private key"
                value={importKey}
                onChange={(e) => {
                  setImportKey(e.target.value);
                  setImportError("");
                }}
                className="font-mono text-sm"
              />
              {importError && (
                <p className="text-destructive text-sm">{importError}</p>
              )}
              <Button
                onClick={handleImportAccount}
                variant="secondary"
                className="w-full"
                disabled={!importKey.trim()}
              >
                <Upload className="w-4 h-4 mr-2" />
                Import Account
              </Button>
            </div>

            <div className="mt-4 p-4 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-xs text-muted-foreground">
                <strong className="text-accent">Security Note:</strong> Your private key is stored locally in your browser.
                Make sure to export and backup your key before clearing browser data.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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
            <Key className="w-4 h-4" />
          </Button>
        </DialogTrigger>
      </div>

      <DialogContent className="brand-card border-2">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Account Settings</DialogTitle>
          <DialogDescription>
            Manage your GenLayer account and private key
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="brand-card p-4 space-y-2">
            <p className="text-sm text-muted-foreground">Your Address</p>
            <div className="flex items-center justify-between">
              <code className="text-sm font-mono">{address}</code>
            </div>
          </div>

          <div className="brand-card p-4 space-y-2">
            <p className="text-sm text-muted-foreground">Your Points</p>
            <p className="text-2xl font-bold text-accent">{points}</p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleCopyPrivateKey}
              className="w-full"
              variant="outline"
            >
              <Key className="w-4 h-4 mr-2" />
              {copySuccess ? "Copied!" : "Copy Private Key"}
            </Button>

            <Button
              onClick={handleExportPrivateKey}
              className="w-full"
              variant="outline"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Private Key
            </Button>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <Button
              onClick={handleDisconnect}
              className="w-full text-destructive hover:text-destructive"
              variant="outline"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect Account
            </Button>
          </div>

          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-xs text-muted-foreground">
              <strong className="text-destructive">Warning:</strong> Never share your private key with anyone.
              Anyone with access to your private key can control your account.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
