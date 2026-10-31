import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const readJson = (path: string) =>
  JSON.parse(readFileSync(new URL(path, import.meta.url), "utf8"));
const root = readJson("../../package.json");
const frontend = readJson("../package.json");
const lock = readJson("../../package-lock.json");

describe("published GenLayer dependencies", () => {
  it.each([
    ["genlayer-js", "2.0.0-rc.1"],
    ["@genlayer/transaction-kit", "0.1.0-rc.2"],
    ["@genlayer/transaction-kit-react", "0.1.0-rc.2"],
  ])("installs %s from npm at the qualified version", (name, version) => {
    expect(frontend.dependencies[name]).toBe(version);
    expect(lock.packages.frontend.dependencies[name]).toBe(version);
    const entry = lock.packages[`frontend/node_modules/${name}`]
      ?? lock.packages[`node_modules/${name}`];
    expect(entry.version).toBe(version);
    expect(entry.resolved).toMatch(/^https:\/\/registry\.npmjs\.org\//);
    expect(entry.integrity).toMatch(/^sha512-/);
  });

  it("shares the SDK release between deployment and the frontend", () => {
    expect(root.devDependencies["genlayer-js"])
      .toBe(frontend.dependencies["genlayer-js"]);
    expect(lock.packages[""].devDependencies["genlayer-js"])
      .toBe(root.devDependencies["genlayer-js"]);
  });
});
