import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GenLayerTransactionPanel,
  createMockKit,
  type SubmitInput,
  type TrackedStatus,
} from "@genlayer/transaction-kit-react";

const tx: SubmitInput = {
  kind: "write",
  address: "0x1234567890123456789012345678901234567890",
  method: "create_bet",
  args: ["2026-06-12", "Team A", "Team B", "1"],
};

function renderPanel(onDone?: (status: TrackedStatus) => void) {
  return render(
    <GenLayerTransactionPanel
      kit={createMockKit({ delays: { estimate: 0, submit: 0, step: 0 } })}
      tx={tx}
      network="GenLayer Studio"
      theme="dark"
      trackUntil="decided"
      onDone={onDone}
    />,
  );
}

afterEach(() => {
  cleanup();
});

describe("GenLayerTransactionPanel", () => {
  it("renders a fee quote and enables hold to sign", async () => {
    renderPanel();

    await waitFor(() => {
      expect(screen.getAllByText("GEN").length).toBeGreaterThan(0);
    });

    const holdButton = document.querySelector<HTMLButtonElement>("button.gltk-hold");
    expect(holdButton).toBeInTheDocument();
    expect(holdButton).toBeEnabled();
  });

  it("approving drives the flow to done", async () => {
    const onDone = vi.fn<(status: TrackedStatus) => void>();
    renderPanel(onDone);

    const holdButton = await waitFor(() => {
      const button = document.querySelector<HTMLButtonElement>("button.gltk-hold");
      if (!button) {
        throw new Error("Hold to sign button was not rendered");
      }
      expect(button).toBeEnabled();
      return button;
    });

    fireEvent.keyDown(holdButton, { key: "Enter" });

    await waitFor(
      () => {
        expect(onDone).toHaveBeenCalledWith(
          expect.objectContaining({ phase: "decided" }),
        );
      },
      { timeout: 3000 },
    );
  });
});
