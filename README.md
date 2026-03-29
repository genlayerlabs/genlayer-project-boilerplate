# Signal Quality Oracle — GenLayer Bradbury Hackathon

> AI-powered news signal quality scoring. Only possible on GenLayer.

## What It Does

The Signal Quality Oracle is an intelligent contract that **autonomously evaluates news signals** against editorial standards using AI. It leverages GenLayer's unique capabilities — LLM access and web rendering — to do something no other blockchain can:

1. **Score signal quality** (0-100) using LLM analysis
2. **Verify claims against source material** by reading web URLs
3. **Track correspondent reputation** on-chain
4. **Enforce editorial standards** per beat category

## Why GenLayer?

This contract is **impossible on any other blockchain** because it requires:
- `gl.nondet.exec_prompt()` — Running LLM inference on-chain
- `gl.nondet.web.render()` — Fetching and reading web content
- `gl.eq_principle.strict_eq()` — Consensus validation of non-deterministic outputs

Traditional smart contracts can't read the internet or think. GenLayer contracts can.

## Architecture

```
contracts/
  signal_oracle.py     # Main intelligent contract
deploy/
  deployScript.ts      # Deployment script
frontend/              # Next.js web interface
test/                  # Integration tests
```

## Key Features

### 1. Signal Submission with AI Scoring
```python
@gl.public.write
def submit_signal(headline, body, beat) -> dict
```
Submits a signal for evaluation. The LLM analyzes it against editorial standards and returns a score, approval status, and actionable feedback.

### 2. Web Verification (GenLayer-Exclusive)
```python
@gl.public.write
def verify_web_signal(headline, source_url) -> dict
```
Reads the source URL directly and verifies whether the headline's claims are supported by the actual content. **This is the killer feature** — on-chain fact-checking.

### 3. Reputation Tracking
```python
@gl.public.view
def get_submitter_reputation(addr) -> int
```
Tracks how many signals each correspondent has gotten approved, creating an on-chain reputation system.

### 4. Configurable Editorial Standards
```python
@gl.public.write
def update_standard(beat, ...) -> None
```
Each beat can have different editorial standards (length requirements, banned topics, approval thresholds).

## Editorial Standards

Default configuration:
- Headlines: 20-120 characters
- Body: 150-400 words
- Minimum 2 data points/numbers required
- Banned topics: bitcoin price, sentiment index, external hacks, ETF flows
- Approval threshold: 70/100 score

## Use Cases

- **News organizations**: Automated quality control for contributor submissions
- **DAOs**: On-chain content curation with AI verification
- **Bounty platforms**: Verify that bounty submissions meet requirements
- **Academic publishing**: Pre-screen papers against editorial standards

## Running Locally

```bash
# Start GenLayer simulator
genlayer up

# Deploy contract
npm run deploy

# Run frontend
cd frontend && npm run dev
```

## Hackathon Track

**Builders Track** — Deployed intelligent contract demonstrating GenLayer's core differentiator: AI-native smart contracts that can read, think, and judge.

## Team

Built for the GenLayer Bradbury Hackathon (March 20 - April 10, 2026)
