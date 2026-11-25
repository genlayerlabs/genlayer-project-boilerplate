import { describe, expect, it } from "vitest";
import { isSuccessfulDeploymentReceipt } from "../../deploy/deployScript";

describe("deployment receipt success", () => {
  it("does not treat UNDETERMINED as a successful deployment", () => {
    expect(
      isSuccessfulDeploymentReceipt({
        status: 6,
        statusName: "UNDETERMINED",
      }),
    ).toBe(false);
  });

  it("accepts only accepted or finalized decisions", () => {
    expect(isSuccessfulDeploymentReceipt({ status: 5 })).toBe(true);
    expect(isSuccessfulDeploymentReceipt({ statusName: "FINALIZED" })).toBe(
      true,
    );
    expect(
      isSuccessfulDeploymentReceipt({ statusName: "LEADER_TIMEOUT" }),
    ).toBe(false);
  });
});
