import { studioDevnet, testnetBradbury, testnetClarke } from "genlayer-js/chains";
import type { GenLayerChain } from "genlayer-js/types";

// The released SDK has no Studio Next preset yet: reuse the Studio Devnet
// consensus contracts with the developer-facing Studio Next endpoint.
const NETWORK_PRESETS = {
  "studio-next": {
    base: studioDevnet,
    chainName: "GenLayer Studio Next",
    rpcUrl: "https://studio-next.genlayer.com/api",
  },
  "testnet-bradbury": {
    base: testnetBradbury,
    chainName: testnetBradbury.name,
    rpcUrl: testnetBradbury.rpcUrls.default.http[0],
  },
  "testnet-clarke": {
    base: testnetClarke,
    chainName: testnetClarke.name,
    rpcUrl: testnetClarke.rpcUrls.default.http[0],
  },
} as const satisfies Record<string, { base: GenLayerChain; chainName: string; rpcUrl: string }>;

export type GenLayerNetworkName = keyof typeof NETWORK_PRESETS;

export interface GenLayerNetworkOverrides {
  network?: string;
  chainId?: string;
  chainName?: string;
  rpcUrl?: string;
  symbol?: string;
}

function resolvePreset(value: string | undefined) {
  const name = value?.trim() || "studio-next";
  if (!Object.hasOwn(NETWORK_PRESETS, name)) {
    throw new Error(
      `NEXT_PUBLIC_GENLAYER_NETWORK must be one of ${Object.keys(NETWORK_PRESETS).join(", ")}; received ${value}`,
    );
  }
  return NETWORK_PRESETS[name as GenLayerNetworkName];
}

function parseChainId(value: string | undefined, fallback: number): number {
  if (value === undefined || value.trim() === "") {
    return fallback;
  }

  const chainId = Number(value);
  if (!Number.isSafeInteger(chainId) || chainId <= 0) {
    throw new Error(`NEXT_PUBLIC_GENLAYER_CHAIN_ID must be a positive integer; received ${value}`);
  }

  return chainId;
}

/**
 * Resolve one network definition shared by MetaMask, genlayer-js, and
 * Transaction Kit. Keeping these consumers on the same object prevents an RPC
 * endpoint override from producing transactions signed for a different chain.
 */
export function createGenLayerNetworkConfig(
  overrides: GenLayerNetworkOverrides = {},
) {
  const preset = resolvePreset(overrides.network);
  const chainId = parseChainId(overrides.chainId, preset.base.id);
  // A testnet preset's consensus contracts exist only on its own chain; a
  // self-hosted Studio may run under any chain ID
  if (!preset.base.isStudio && chainId !== preset.base.id) {
    throw new Error(
      `NEXT_PUBLIC_GENLAYER_CHAIN_ID ${chainId} does not match the ${preset.chainName} chain ID ${preset.base.id}; unset it or fix it`,
    );
  }
  const chainName = overrides.chainName || preset.chainName;
  const rpcUrl = overrides.rpcUrl || preset.rpcUrl;
  const symbol = overrides.symbol || "GEN";

  const chain = {
    ...preset.base,
    id: chainId,
    name: chainName,
    nativeCurrency: {
      name: symbol,
      symbol,
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: [rpcUrl],
      },
    },
  } satisfies GenLayerChain;
  const explorerUrl = preset.base.blockExplorers?.default.url;

  return {
    chain,
    wallet: {
      chainId: `0x${chainId.toString(16).toUpperCase()}`,
      chainName,
      nativeCurrency: chain.nativeCurrency,
      rpcUrls: [rpcUrl],
      blockExplorerUrls: explorerUrl ? [explorerUrl] : [],
    },
  };
}

const networkConfig = createGenLayerNetworkConfig({
  network: process.env.NEXT_PUBLIC_GENLAYER_NETWORK,
  chainId: process.env.NEXT_PUBLIC_GENLAYER_CHAIN_ID,
  chainName: process.env.NEXT_PUBLIC_GENLAYER_CHAIN_NAME,
  rpcUrl: process.env.NEXT_PUBLIC_GENLAYER_RPC_URL,
  symbol: process.env.NEXT_PUBLIC_GENLAYER_SYMBOL,
});

export const GENLAYER_CHAIN = networkConfig.chain;
export const GENLAYER_NETWORK = networkConfig.wallet;
export const GENLAYER_CHAIN_ID = GENLAYER_CHAIN.id;
export const GENLAYER_CHAIN_ID_HEX = GENLAYER_NETWORK.chainId;
