"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { formatAddress } from "@/lib/genlayer/wallet";

interface AddressDisplayProps {
  address: string | null;
  maxLength?: number;
  className?: string;
  showCopy?: boolean;
}

/**
 * Component to display shortened blockchain addresses with tooltip
 * Ported from Vue Address.vue component
 */
export function AddressDisplay({
  address,
  maxLength = 12,
  className = "",
  showCopy = false,
}: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  if (!address) {
    return <span className={className}>—</span>;
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy address:", error);
    }
  };

  const shortened = formatAddress(address, maxLength);

  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`}
      title={address}
    >
      <span className="font-mono">{shortened}</span>
      {showCopy && (
        <button
          onClick={handleCopy}
          className="opacity-50 hover:opacity-100 transition-opacity p-0.5 hover:bg-white/5 rounded"
          aria-label="Copy address"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      )}
    </span>
  );
}
