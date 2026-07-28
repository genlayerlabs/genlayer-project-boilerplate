# Specification: AI Fact-Checker Frontend Integration & Deployment

## Problem Statement

The user has a fully functional and verified intelligent contract for the AI Fact-Checker and Prediction Market in `contracts/fact_checker.py`. However, this contract only runs in-memory during direct mode tests. There is no frontend user interface to allow end-users to interact with the contract (view claims, create claims with initial stake, place additional stakes, trigger AI resolution, and claim rewards). Additionally, the contract is not deployed to any active node or GenLayer Studio, and there are no integration tests validating the contract's behavior against a running node.

## Solution

We will build the frontend integration, deployment scripts, and integration tests to support the AI Fact-Checker contract:

1. **Contract Client Wrapper**: A TypeScript client class `frontend/lib/contracts/FactChecker.ts` using `genlayer-js` to encapsulate all read/write/payable methods.
2. **React Hooks**: A set of TanStack Query hooks in `frontend/lib/hooks/useFactChecker.ts` for clean state management, query caching, and auto-invalidation after mutations.
3. **UI Dashboard**: A responsive user interface in Next.js 15 containing a claims leaderboard/table, a "Create Claim" modal, a "Place Stake" modal, and action buttons for "Resolve" and "Claim Reward".
4. **Integration Tests**: End-to-end tests in `tests/integration/test_fact_checker.py` run against GenLayer Studio using `gltest`.
5. **Technical Debt & Refactoring**: Clean up helper methods in the Python contract and tests to address the handoff's review notes.

## User Stories

1. As a prediction market user, I want to connect my MetaMask wallet to the web application, so that I can pay for transactions and receive reward payouts.
2. As a user, I want to see a table of all existing claims including their text, source URL, resolution status, outcome, total True stakes, and total False stakes, so that I can identify active prediction opportunities.
3. As a user, I want to create a new claim by supplying the claim statement, a source web page URL, my initial vote (True/False), and an initial stake amount, so that I can launch a new prediction market.
4. As a participant, I want to place a stake (True or False) on an existing unresolved claim with a custom stake value, so that I can back my prediction with financial weight.
5. As a participant, I want to see my current stakes (True/False) for each claim, so that I know my current exposure and potential returns.
6. As any network participant, I want to click a "Resolve" button on an unresolved claim to trigger the contract's web scraping and LLM consensus engine, so that the claim's status changes to resolved.
7. As a winning participant, I want to click a "Claim Reward" button on a resolved claim, so that I receive my initial stake back along with my proportional share of the losing pool.
8. As a user, I want to see toast notifications and loading indicators during transaction execution (waiting for acceptance/receipts), so that I am assured my actions are being processed by the GenLayer network.

## Implementation Decisions

- **Contract Client Class**:
  We will implement `FactChecker` in `frontend/lib/contracts/FactChecker.ts`. It will initialize the `createClient` from `genlayer-js` using MetaMask provider config. It will expose:
  - `getClaims() -> Promise<Claim[]>`
  - `createClaim(text, url, vote, amount) -> Promise<TransactionReceipt>`
  - `placeStake(claimId, vote, amount) -> Promise<TransactionReceipt>`
  - `resolveClaim(claimId) -> Promise<TransactionReceipt>`
  - `claimReward(claimId) -> Promise<TransactionReceipt>`
- **TypeScript Data Model**:
  Add `Claim` to `frontend/lib/contracts/types.ts`:
  ```typescript
  export interface Claim {
    id: string;
    claim_text: string;
    source_url: string;
    is_resolved: boolean;
    outcome: boolean;
    total_true_stake: string; // serialized u256
    total_false_stake: string; // serialized u256
  }
  ```
- **React Query Hooks**:
  Expose the following hooks in `frontend/lib/hooks/useFactChecker.ts`:
  - `useClaims()`: Queries the active claims list.
  - `useCreateClaim()`: Mutation to call `createClaim`. Invalidates `["claims"]`.
  - `usePlaceStake()`: Mutation to call `placeStake`. Invalidates `["claims"]` and player stake balances.
  - `useResolveClaim()`: Mutation to call `resolve_claim`. Invalidates `["claims"]`.
  - `useClaimReward()`: Mutation to call `claim_reward`. Invalidates `["claims"]` and player balances.
- **UI Components**:
  - `frontend/components/ClaimsTable.tsx`: A table component displaying all claims. Displays badges for resolution state (Unresolved, Verified True, Debunked False), progress bars showing stake balance distributions, and contextual buttons ("Stake True", "Stake False", "Resolve", "Claim Reward").
  - `frontend/components/CreateClaimModal.tsx`: Modal form capturing input text, source URL, choice (True/False), and deposit amount.
  - `frontend/components/Navbar.tsx` & Layout: Update the header to toggle between "Football Bets" and "AI Fact-Checker" so both modules are accessible.
- **Deployment Script**:
  Create or update a deploy script under `deploy/` to easily deploy the `FactChecker` contract.

## Testing Decisions

- **Direct Mode Mock Optimization**:
  Create a pytest fixture in `tests/direct/test_fact_checker.py` that configures common web renders and LLM prompt expectations, replacing inline `mock_web` and `mock_llm` calls.
- **Integration Testing (`tests/integration/test_fact_checker.py`)**:
  - Setup a test that deploys the `FactChecker` contract to GenLayer Studio.
  - Verify that claims can be created, stakes placed, and resolution triggered.
  - Check that payouts are distributed successfully.
  - We will only test external transaction inputs and verified state balances, keeping tests resilient to internal helper modifications.

## Out of Scope

- Implementing multi-source URL resolution in the frontend (the client only supports the single URL specified in the contract).
- Dynamic fees or protocol commissions (all reward pools go to winning stakers).
- Advanced charts or analytics for prediction historical stakes.

## Further Notes

- In GenLayer, maps returned from view methods are received as JavaScript `Map` instances. We will write parsers in the client to transform these into plain arrays and objects before passing them to TanStack Query.
