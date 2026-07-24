# Specification: AI Fact-Checker & Prediction Market Intelligent Contract

## Problem Statement

Traditional blockchain smart contracts are deterministic and isolated from the external web. They cannot natively read web pages or make subjective assessments without relying on centralized oracles. This makes it impossible to build decentralized prediction markets or automated fact-checking systems that resolve bets by directly reading news or official pages and making intelligent verifications.

## Solution

We will build a GenLayer Intelligent Contract (`contracts/fact_checker.py`) that acts as an AI Fact-Checker and Prediction Market. 

1. **Claim Creation**: A user can create a claim by submitting a statement, a source URL, and staking some initial coins on whether they believe the claim is `True` or `False`.
2. **Prediction/Staking**: Other users can stake coins on either side (`True` or `False`) of the claim, accumulating a reward pool.
3. **AI Resolution**: Anyone can trigger resolution after a claim is created. The contract uses GenVM's non-deterministic web scraping to render the source URL's text, feeds it to an LLM comparative prompt against the claim text, and updates the claim status as resolved `True` or `False` based on LLM consensus.
4. **Reward Distribution**: Stakers who voted for the winning outcome can claim their proportional share of the entire stake pool.

## User Stories

1. As a claim creator, I want to publish a new claim with a text statement and a source URL, so that other users can bet on its accuracy.
2. As a claim creator, I want to stake an initial amount of coins on either True or False when creating the claim, so that I can seed the market.
3. As a participant, I want to view a claim's text, source URL, current resolution status, and total stakes, so that I can decide if I want to participate.
4. As a participant, I want to stake coins on an existing claim for the `True` outcome, so that I can earn rewards if the claim is verified.
5. As a participant, I want to stake coins on an existing claim for the `False` outcome, so that I can earn rewards if the claim is debunked.
6. As a participant, I want to stake multiple times or have multiple participants stake on the same claim, so that the pool grows dynamically.
7. As any network user, I want to trigger the resolution of an open claim, so that the contract initiates web scraping and AI consensus.
8. As a contract runner, I want the contract to scrape the claim's source URL securely and deterministically run LLM consensus on whether the text supports the claim.
9. As a winning participant, I want to claim my reward after a claim resolves, so that I receive my initial stake back plus my proportional share of the losing side's stakes.
10. As a losing participant, I want my stake to remain in the contract pool, so that it is distributed to the winners.
11. As a user, I want the contract to reject stakes on already resolved claims, so that my funds are not locked or lost.
12. As a user, I want the contract to reject duplicate resolution requests on already resolved claims, so that consensus is not run repeatedly.
13. As a developer, I want to verify all contract behaviors using fast direct-mode tests with web and LLM mocks, so that I can guarantee correct implementation without GenLayer Studio running.

## Implementation Decisions

### Modules & Structures
- **Claim Status**: An enum or status flags indicating whether a claim is unresolved, resolved True, or resolved False.
- **Claim Dataclass**: A `@allow_storage` dataclass containing:
  - `id`: `u256`
  - `claim_text`: `str`
  - `source_url`: `str`
  - `is_resolved`: `bool`
  - `outcome`: `bool` (True if resolved as True, False if resolved as False)
  - `total_true_stake`: `u256`
  - `total_false_stake`: `u256`
- **Contract Class**: `FactChecker(gl.Contract)` in `contracts/fact_checker.py` with storage fields:
  - `claims_count`: `u256`
  - `claims`: `TreeMap[u256, Claim]`
  - `true_stakes`: `TreeMap[u256, TreeMap[Address, u256]]` (mapping claim_id -> (staker -> amount))
  - `false_stakes`: `TreeMap[u256, TreeMap[Address, u256]]` (mapping claim_id -> (staker -> amount))

### Methods & API Contract
- `@gl.public.write.payable` `def create_claim(self, claim_text: str, source_url: str, initial_vote: bool) -> u256`
  - Creates a claim, increments `claims_count`, records the initial stake from `gl.message.value`, and returns the claim ID.
- `@gl.public.write.payable` `def place_stake(self, claim_id: u256, vote: bool)`
  - Adds stake `gl.message.value` to either `true_stakes` or `false_stakes` for the specified `claim_id`. Reverts if claim is already resolved or if stake value is 0.
- `@gl.public.write` `def resolve_claim(self, claim_id: u256)`
  - Fetches the webpage using `gl.nondet.web.render(url, mode="text")`.
  - Runs LLM evaluation using `gl.eq_principle.prompt_comparative` comparing the article text and the claim statement.
  - Sets the claim outcome and updates `is_resolved = True`.
- `@gl.public.write` `def claim_reward(self, claim_id: u256)`
  - Calculates proportional share of the pool for the caller and transfers the reward. Reverts if claim is not resolved or if caller did not stake on the winning side.
- Views:
  - `@gl.public.view` `def get_claim(self, claim_id: u256) -> Claim`
  - `@gl.public.view` `def get_true_stake(self, claim_id: u256, player: Address) -> u256`
  - `@gl.public.view` `def get_false_stake(self, claim_id: u256, player: Address) -> u256`

## Testing Decisions

We will implement direct mode unit tests using pytest in `tests/direct/test_fact_checker.py`.
- **Mocks**: We will mock the web scraping call to return specific news text and mock the LLM comparator to return true/false consensus results.
- **Scenarios to test**:
  - Valid claim creation and correct initial staking values.
  - Placed stakes on True/False updating the pools correctly.
  - Reverts when trying to stake on resolved claims.
  - Reverts when trying to claim rewards on unresolved claims.
  - Correct resolution outcome detection when web page matches or opposes the claim text.
  - Correct payout distributions for single and multiple winners with proportional pool sharing.
- **Linter**: Validate code using `genvm-lint check contracts/fact_checker.py`.

## Out of Scope

- Multi-URL scraping aggregation (we scrape exactly one source URL per claim).
- Complexity of oracle round dynamics (we use the default comparative LLM consensus).
- Dynamic fees or protocol cuts (100% of the pools are distributed to the winners).
- Handling ties where a claim resolves, but no one staked on the winning side (in this case, funds are locked/refunded or can be handled as a corner case). We will return funds to the other side or treat it as a non-goal for the initial contract, keeping it simple.

## Further Notes

To keep storage access straightforward and avoid complex nested objects, we use nested `TreeMap[u256, TreeMap[Address, u256]]` for stakes.
