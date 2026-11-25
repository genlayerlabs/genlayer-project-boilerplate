import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  GENLAYER_CHAIN,
  GENLAYER_CHAIN_ID_HEX,
  GENLAYER_NETWORK,
} from "../lib/genlayer/network";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(() => ({ readContract: vi.fn() })),
  createTransactionKit: vi.fn(() => ({ configured: true })),
}));

vi.mock("genlayer-js", () => ({
  createClient: mocks.createClient,
}));

vi.mock("@genlayer/transaction-kit", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@genlayer/transaction-kit")>()),
  createTransactionKit: mocks.createTransactionKit,
}));

import FootballBets from "../lib/contracts/FootballBets";
import {
  addGenLayerNetwork,
  switchToGenLayerNetwork,
} from "../lib/genlayer/client";
import { useTransactionKit } from "../lib/genlayer/kit";

const account = "0x1234567890123456789012345678901234567890";
const providerRequest = vi.fn();

describe("network consumers", () => {
  beforeEach(() => {
    mocks.createClient.mockClear();
    mocks.createTransactionKit.mockClear();
    providerRequest.mockReset();
    Object.defineProperty(window, "ethereum", {
      configurable: true,
      value: {
        request: providerRequest,
        on: vi.fn(),
        removeListener: vi.fn(),
      },
    });
  });

  it("uses the shared chain for contract clients", () => {
    const contract = new FootballBets(account, account);

    expect(mocks.createClient).toHaveBeenLastCalledWith({
      account,
      chain: GENLAYER_CHAIN,
    });

    contract.updateAccount("0x0000000000000000000000000000000000000001");
    expect(mocks.createClient).toHaveBeenLastCalledWith({
      account: "0x0000000000000000000000000000000000000001",
      chain: GENLAYER_CHAIN,
    });
  });

  it("uses the same chain for Transaction Kit submissions", () => {
    renderHook(() => useTransactionKit(account));

    expect(mocks.createTransactionKit).toHaveBeenCalledWith({
      account,
      chain: GENLAYER_CHAIN,
      provider: expect.objectContaining({ request: providerRequest }),
    });
  });

  it("does not create a signing kit without an account", () => {
    const { result } = renderHook(() => useTransactionKit(null));
    expect(result.current).toBeNull();
    expect(mocks.createTransactionKit).not.toHaveBeenCalled();
  });

  it("does not create a signing kit without a wallet provider", () => {
    Object.defineProperty(window, "ethereum", { configurable: true, value: undefined });
    const { result } = renderHook(() => useTransactionKit(account));
    expect(result.current).toBeNull();
    expect(mocks.createTransactionKit).not.toHaveBeenCalled();
  });

  it("uses the shared wallet network for add and switch requests", async () => {
    await switchToGenLayerNetwork();
    expect(providerRequest).toHaveBeenCalledWith({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: GENLAYER_CHAIN_ID_HEX }],
    });

    await addGenLayerNetwork();
    expect(providerRequest).toHaveBeenCalledWith({
      method: "wallet_addEthereumChain",
      params: [GENLAYER_NETWORK],
    });
  });
});
