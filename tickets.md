# Tickets: AI Fact-Checker Production Readiness

We are preparing the AI Fact-Checker intelligent contract and UI dashboard for production deployment. This file outlines the work packages required to clean up prototypes, verify integration on the GenLayer Studio, and bundle the final implementation into a pull request.

Work the **frontier**: any ticket whose blockers are all done.

## 1. Select Variant C as Production UI and Clean Prototypes

**What to build:** Set the high-contrast Analyst Inspection Console (Variant C) as the default layout for the Fact-Checker dashboard, remove the floating `PrototypeSwitcher` component from the main page, and delete the prototype components A and B to keep the codebase clean.

**Blocked by:** None — can start immediately.

- [ ] Modify `frontend/app/page.tsx` to directly render `ClaimsTableC` without switching.
- [ ] Remove `PrototypeSwitcher` import and rendering from `frontend/app/page.tsx`.
- [ ] Safely delete or archive `frontend/components/claims-prototype/ClaimsTableA.tsx`, `ClaimsTableB.tsx`, and `PrototypeSwitcher.tsx`.
- [ ] Move `ClaimsTableC.tsx` from `claims-prototype/` into `frontend/components/` as the primary `ClaimsTable.tsx`, overwriting or replacing the generic placeholder.
- [ ] Verify that `npm run lint` passes without typescript errors.

## 2. Integration Verification on GenLayer Studio Node

**What to build:** Run the integration test suite (`tests/integration/test_fact_checker.py`) against a running GenLayer network node using the studio command utility to guarantee contract deployment, equivalence validation, and states work correctly in a blockchain environment.

**Blocked by:** None — can start immediately.

- [ ] Execute `gltest tests/integration/test_fact_checker.py -v -s` against a running GenLayer Studio instance.
- [ ] All integration tests pass.

## 3. Pull Request Bundling and Documentation Handoff

**What to build:** Prepare a final Git state, run a global check of the TypeScript compiler, compile all tests, and prepare the repository changes for review and merge.

**Blocked by:** 1. Select Variant C as Production UI and Clean Prototypes, 2. Integration Verification on GenLayer Studio Node.

- [ ] Run a final `npm run lint` over the frontend project.
- [ ] Ensure all direct-mode tests pass (`pytest tests/direct/ -v`).
- [ ] Document final integration steps and state.
