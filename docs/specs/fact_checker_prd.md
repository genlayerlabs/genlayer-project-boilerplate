# Product Requirement Document (PRD) — AI Fact-Checker Intelligent Contract & Frontend Workspace

## Problem Statement

Prediction markets and decentralized betting protocols often struggle with a lack of trusted, real-time sources of truth for resolving outcomes, leading to locked funds, disputes, or manual oracle bottlenecks. At the same time, when users stake funds on the veridicality of a statement, if no winning pool exists (e.g., all stakers voted for an outcome that was disproven by the truth oracle, or vice-versa), traditional pool distribution logic breaks or leaves funds permanently locked inside the smart contract, exposing users to systemic asset loss.

## Solution

We introduce the **AI Fact-Checker** workspace and intelligent contract. This system allows users to submit claims containing a statement and a verification URL, and open predictions where stakers can allocate `GEN` to support (`True`) or debunk (`False`) the claim. 

The system leverages the **GenLayer SDK** to programmatically fetch the target URL using non-deterministic web rendering (`gl.nondet.web`) and analyze the content using large language models (`gl.nondet.exec_prompt`). If an outcome is reached, stakers on the winning side share the losing pool proportional to their contributions. To prevent the locked-funds vulnerability, the contract includes a reclaim mechanism that permits stakers to recover their initial capital in full if the contract resolves to an outcome where there are zero winning stakers.

The user interface provides a dedicated Analyst Inspection Console modeled after real-time news-tickers and blockchain audit terminals to evaluate claims, view pool ratios, monitor live verification, and claim rewards.

## User Stories

1. As an analyst, I want to submit a news claim with a specific statement and verification URL, so that other stakers can predict its truthfulness.
2. As a staker, I want to allocate `GEN` to back a claim as `True`, so that I can earn rewards if the LLM consensus validates the statement.
3. As a staker, I want to allocate `GEN` to debunk a claim as `False`, so that I can earn rewards if the LLM consensus refutes the statement.
4. As a participant, I want to inspect active pools for both `True` and `False` directions, so that I can gauge market consensus before staking.
5. As a user, I want the verification process to run via a secure LLM Consensus oracle, so that the resolution is automated, decentralized, and tamper-proof.
6. As a participant in a claim where everyone voted incorrectly, I want to reclaim my original stake, so that my funds are not permanently locked in the contract.
7. As an analyst, I want to view a detailed breakdown of the Consensus Stamp showing raw consensus hashes, verdicts, and evidence snippets, so that I can audit the oracle's decisions.
8. As a developer, I want to run fast unit tests with mock web and LLM interfaces, so that I can iterate on contract logic without interacting with a live network node.
9. As a node operator, I want to run full integration tests against the GenLayer Studio, so that I can verify complete end-to-end network deployment.
10. As a mobile user, I want the interface to scale properly on my device and respond instantly to tactile press inputs, so that the experience feels quick and native.

## Implementation Decisions

- **Contract Architecture**: Built using GenLayer Python Contract SDK. Utilizes `TreeMap` for storing claims and stake mappings. Exposes `@gl.public.write` for claim creation, staking, resolution, and reward claiming.
- **Stake Mappings Refactor**: Consolidated stake mapping lookups into a helper function `_get_stakes_root_map` to prevent duplication and facilitate safe state reads across multiple methods.
- **Locked Funds Safeguard**: Updated `claim_reward` logic to handle the `total_winning_pool == 0` edge case. If no staker predicted the winning outcome correctly, the pool is not distributed; instead, losers are allowed to withdraw their exact original stake from the losing pool.
- **Consensus Oracle Integration**: Uses the SDK's comparative consensus wrapper `gl.eq_principle.prompt_comparative` for deterministic semantic verification of natural language claims against scraped page content. This is preferred over custom low-level leader/validator functions as it matches the GenLayer SDK's best practices for LLM consensus without redundant code.
- **AI Consensus Stamp Auditing**: To optimize contract storage and transaction execution fees (gas), details like consensus hashes and evidence logs are not persisted to the blockchain's `TreeMap`. Instead, the frontend simulation models how these parameters would be extracted from the node transaction logs/events.
- **Frontend Architecture**: Implemented as a client-side wrapper in TypeScript and query-based React hooks using TanStack Query, communicating with GenLayer RPC clients via MetaMask.
- **Tactile UI Terminal**: Built on a modular multi-variant layout prototype (Variant C selected for production release), utilizing a high-contrast console style with monospace fonts, thin borders, and a news-ticker layout.

```typescript
// Core Claim type declaration in client types
export interface Claim {
  id: string;
  claim_text: string;
  source_url: string;
  total_true_stake: string;
  total_false_stake: string;
  is_resolved: boolean;
  outcome: boolean;
}
```

## Testing Decisions

- **Behavioral Testing**: Only test the external entry points and public state modifications of the contract rather than internal storage details.
- **Direct Mode Suite**: Uses Python `pytest` and mock fixtures like `mock_fact_checker_resolution` to simulate web responses and JSON LLM completions. Ensures tests can assert stakes, outcomes, and reclaims instantly without blockchain latency.
- **Integration Suite**: Developed `tests/integration/test_fact_checker.py` to deploy and test the contract against a local GenLayer Studio node, validating the actual contract creation, transaction processing, and execution flow.
- **Prior Art**: Modeled direct tests after the codebase's existing `tests/direct/test_football_bets.py` patterns, utilizing `expect_revert` and accounts fixtures (`direct_alice`, `direct_bob`, etc.).

## Out of Scope

- Integrating third-party social APIs (e.g., Twitter/X scraping) beyond direct web requests.
- Multi-token support; only native `GEN` is accepted for staking.
- Automatic recurring triggers; claim resolution must be initiated manually by a user transaction (`resolve_claim`).

## Further Notes

- The frontend provides a prototype switcher to let designers switch between A, B, and C layouts to test user density. Variant C remains the primary production interface.
- Contract validation runs under strict `genvm-lint` guidelines to prevent import violations and non-deterministic behavior.
