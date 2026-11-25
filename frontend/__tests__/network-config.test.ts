import { describe, expect, it } from "vitest";
import { studioDevnet, testnetBradbury } from "genlayer-js/chains";
import {
  GENLAYER_CHAIN,
  GENLAYER_CHAIN_ID,
  GENLAYER_CHAIN_ID_HEX,
  GENLAYER_NETWORK,
  createGenLayerNetworkConfig,
} from "../lib/genlayer/network";

describe("GenLayer network configuration", () => {
  it("defaults every consumer to Studio Next", () => {
    expect(GENLAYER_CHAIN).toMatchObject({
      id: studioDevnet.id,
      name: "GenLayer Studio Next",
      rpcUrls: { default: { http: ["https://studio-next.genlayer.com/api"] } },
    });
    expect(GENLAYER_CHAIN_ID).toBe(studioDevnet.id);
    expect(GENLAYER_CHAIN_ID_HEX).toBe(`0x${studioDevnet.id.toString(16).toUpperCase()}`);
    expect(GENLAYER_NETWORK).toMatchObject({
      chainId: GENLAYER_CHAIN_ID_HEX,
      chainName: GENLAYER_CHAIN.name,
      rpcUrls: [...GENLAYER_CHAIN.rpcUrls.default.http],
    });
  });

  it("keeps SDK signing and wallet configuration aligned under overrides", () => {
    const { chain, wallet } = createGenLayerNetworkConfig({
      chainId: "12345",
      chainName: "Custom GenLayer",
      rpcUrl: "https://rpc.example.test/api",
      symbol: "TEST",
    });

    expect(chain.id).toBe(12345);
    expect(chain.name).toBe("Custom GenLayer");
    expect(chain.rpcUrls.default.http).toEqual(["https://rpc.example.test/api"]);
    expect(wallet).toMatchObject({
      chainId: "0x3039",
      chainName: chain.name,
      rpcUrls: [...chain.rpcUrls.default.http],
      nativeCurrency: chain.nativeCurrency,
    });
  });

  it("selects Bradbury Phase 3 with its consensus contracts", () => {
    const { chain, wallet } = createGenLayerNetworkConfig({ network: "testnet-bradbury" });

    expect(chain).toMatchObject({
      id: testnetBradbury.id,
      name: testnetBradbury.name,
      rpcUrls: { default: { http: [...testnetBradbury.rpcUrls.default.http] } },
      consensusMainContract: testnetBradbury.consensusMainContract,
    });
    expect(chain.consensusMainContract?.address).toBe(
      "0x0f4F0e05475723790E4a2ed0598370783C300926",
    );
    expect(wallet.blockExplorerUrls).toEqual([testnetBradbury.blockExplorers?.default.url]);
  });

  it("rejects a chain ID that does not belong to a testnet preset", () => {
    expect(() =>
      createGenLayerNetworkConfig({ network: "testnet-bradbury", chainId: "61997" }),
    ).toThrow(/does not match/);
    expect(
      createGenLayerNetworkConfig({
        network: "testnet-bradbury",
        chainId: String(testnetBradbury.id),
      }).chain.id,
    ).toBe(testnetBradbury.id);
  });

  it("rejects unknown network presets", () => {
    expect(() => createGenLayerNetworkConfig({ network: "asimov" })).toThrow(
      /must be one of studio-next, testnet-bradbury/,
    );
  });

  it("rejects invalid chain IDs before a transaction can be signed", () => {
    expect(() => createGenLayerNetworkConfig({ chainId: "not-a-number" })).toThrow(
      /must be a positive integer/,
    );
    expect(() => createGenLayerNetworkConfig({ chainId: "0" })).toThrow(
      /must be a positive integer/,
    );
  });
});
