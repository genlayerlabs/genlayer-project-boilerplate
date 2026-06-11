import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  GenLayerTransactionPanel,
  createMockKit,
  type SubmitInput,
  type TransactionKit,
  type TrackedStatus,
} from "@genlayer/transaction-kit-react";

const tx: SubmitInput = {
  kind: "write",
  address: "0x1234567890123456789012345678901234567890",
  method: "create_bet",
  args: ["2026-06-12", "Team A", "Team B", "1"],
};

function renderPanel(
  onDone?: (status: TrackedStatus) => void,
  kit: TransactionKit = createMockKit({ delays: { estimate: 0, submit: 0, step: 0 } }),
) {
  return render(
    <GenLayerTransactionPanel
      kit={kit}
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
    expect(screen.getByText(/Sized from network defaults/)).toBeInTheDocument();

    const holdButton = document.querySelector<HTMLButtonElement>("button.gltk-hold");
    expect(holdButton).toBeInTheDocument();
    expect(holdButton).toBeEnabled();
  });

  it("renders developer fee profile source when suggestions match", async () => {
    renderPanel(
      undefined,
      createMockKit({
        suggestions: true,
        delays: { estimate: 0, submit: 0, step: 0 },
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Sized from the developer’s measured fee profile/),
      ).toBeInTheDocument();
    });
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
