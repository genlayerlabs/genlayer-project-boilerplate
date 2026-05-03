"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useWallet } from "@/lib/genlayer/wallet";
import { usePlayerPoints } from "@/lib/hooks/useFootballBets";

export function AccountPanel() {
  const { address } = useWallet();
  const { data: points = 0 } = usePlayerPoints(address);

  return (
    <div className="flex items-center gap-3">
      {/* Show points when connected */}
      {address && (
        <div className="brand-card px-3 py-1.5 flex items-center gap-1">
          <span className="text-sm font-semibold text-accent">{points}</span>
          <span className="text-xs text-muted-foreground">pts</span>
        </div>
      )}

      {/* RainbowKit Connect Button with custom styling */}
      <ConnectButton.Custom>
        {({
          account,
          chain,
          openAccountModal,
          openChainModal,
          openConnectModal,
          authenticationStatus,
          mounted,
        }) => {
          const ready = mounted && authenticationStatus !== "loading";
          const connected =
            ready &&
            account &&
            chain &&
            (!authenticationStatus || authenticationStatus === "authenticated");

          return (
            <div
              {...(!ready && {
                "aria-hidden": true,
                style: {
                  opacity: 0,
                  pointerEvents: "none",
                  userSelect: "none",
                },
              })}
            >
              {(() => {
                if (!connected) {
                  return (
                    <button
                      onClick={openConnectModal}
                      type="button"
                      className="btn-primary flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                      Connect Wallet
                    </button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="btn-primary bg-destructive hover:bg-destructive/90"
                    >
                      Wrong Network
                    </button>
                  );
                }

                return (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={openChainModal}
                      type="button"
                      className="brand-card px-3 py-1.5 flex items-center gap-2 hover:border-accent/50 transition-colors"
                    >
                      {chain.hasIcon && (
                        <div
                          className="w-4 h-4 rounded-full overflow-hidden"
                          style={{ background: chain.iconBackground }}
                        >
                          {chain.iconUrl && (
                            <img
                              alt={chain.name ?? "Chain icon"}
                              src={chain.iconUrl}
                              className="w-4 h-4"
                            />
                          )}
                        </div>
                      )}
                      <span className="text-sm hidden sm:inline">
                        {chain.name}
                      </span>
                    </button>

                    <button
                      onClick={openAccountModal}
                      type="button"
                      className="brand-card px-3 py-1.5 flex items-center gap-2 hover:border-accent/50 transition-colors"
                    >
                      <span className="text-sm font-medium">
                        {account.displayName}
                      </span>
                      {account.displayBalance && (
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          ({account.displayBalance})
                        </span>
                      )}
                    </button>
                  </div>
                );
              })()}
            </div>
          );
        }}
      </ConnectButton.Custom>
    </div>
  );
}
