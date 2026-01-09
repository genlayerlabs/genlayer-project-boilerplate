"use client";

import { useState, useEffect } from "react";
import { AccountPanel } from "./AccountPanel";
import { CreateBetModal } from "./CreateBetModal";
import { useBets } from "@/lib/hooks/useFootballBets";
import { useWallet } from "@/lib/genlayer/wallet";
import { Logo, LogoMark } from "./Logo";
import { Alert, AlertDescription } from "./ui/alert";
import { AlertCircle } from "lucide-react";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const { data: bets } = useBets();
  const { isConnected, isOnCorrectNetwork } = useWallet();

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const threshold = 80;

      setIsScrolled(scrollY > 20);

      // Calculate progress from 0 to 1 for smoother animations
      const progress = Math.min(Math.max((scrollY - 10) / threshold, 0), 1);
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Minimal variant with scroll animations
  const paddingTop = Math.round(scrollProgress * 16); // 0-16px padding
  const headerHeight = 64 - Math.round(scrollProgress * 8); // 64px to 56px

  // Only apply border radius on desktop (md breakpoint and up)
  const getBorderRadius = () => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      return Math.round(scrollProgress * 9999); // Fully rounded when scrolled on desktop
    }
    return 0; // No rounding on mobile
  };
  const borderRadius = getBorderRadius();

  const totalBets = bets?.length || 0;
  const resolvedBets = bets?.filter(bet => bet.has_resolved).length || 0;

  return (
    <>
      {/* Network Warning Banner */}
      {isConnected && !isOnCorrectNetwork && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-yellow-500/10 border-b border-yellow-500/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <Alert variant="default" className="bg-transparent border-0 p-0">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <AlertDescription className="text-sm text-yellow-400">
                You&apos;re not on the GenLayer network. Please switch networks to continue.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out"
        style={{ 
          paddingTop: `${paddingTop}px`, 
          marginTop: isConnected && !isOnCorrectNetwork ? '48px' : '0' 
        }}
      >
      <div
        className="transition-all duration-500 ease-out"
        style={{
          width: '100%',
          maxWidth: isScrolled ? '80rem' : '100%',
          margin: '0 auto',
          borderRadius: `${borderRadius}px`,
        }}
      >
        <div
          className="backdrop-blur-xl border transition-all duration-500 ease-out md:rounded-none"
          style={{
            borderColor: `oklch(0.3 0.02 0 / ${0.4 + scrollProgress * 0.4})`,
            background: `linear-gradient(135deg, oklch(0.18 0.01 0 / ${0.1 + scrollProgress * 0.3}) 0%, oklch(0.15 0.01 0 / ${0.05 + scrollProgress * 0.25}) 50%, oklch(0.16 0.01 0 / ${0.08 + scrollProgress * 0.27}) 100%)`,
            borderRadius: `${borderRadius}px`,
            borderWidth: '1px',
            borderLeftWidth: isScrolled ? '1px' : '0px',
            borderRightWidth: isScrolled ? '1px' : '0px',
            borderTopWidth: isScrolled ? '1px' : '0px',
            boxShadow: isScrolled
              ? '0 32px 64px 0 rgba(0, 0, 0, 0.2), inset 0 1px 0 0 oklch(0.3 0.02 0 / 0.3)'
              : 'none',
            backdropFilter: 'blur(16px) saturate(180%)',
            WebkitBackdropFilter: 'blur(16px) saturate(180%)',
          }}
        >
          <div
            className="px-6 transition-all duration-500 mx-auto"
            style={{
              maxWidth: isScrolled ? '80rem' : '112rem',
            }}
          >
            <div
              className="flex items-center justify-between transition-all duration-500"
              style={{ height: `${headerHeight}px` }}
            >
              {/* Left: Logo */}
              <div className="flex items-center gap-3">
                {/* Show mark only on mobile, full logo on desktop */}
                <LogoMark size="md" className="flex md:hidden" />
                <Logo size="md" className="hidden md:flex" />
                <span className="text-lg md:text-xl font-bold ml-2">Football Market</span>
              </div>

              {/* Center: Stats */}
              <div className="hidden md:flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Total Bets:</span>
                  <span className="text-foreground font-bold text-accent">{totalBets}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Resolved:</span>
                  <span className="text-foreground font-bold text-accent">{resolvedBets}</span>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center gap-3">
                <CreateBetModal />
                <AccountPanel />
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
