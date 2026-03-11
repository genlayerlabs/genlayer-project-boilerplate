# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Commands

```bash
# Linting
genvm-lint check contracts/football_bets.py    # Lint a contract

# Testing
pytest tests/direct/ -v                        # Direct mode tests (fast, no Studio)
gltest tests/integration/ -v -s                # Integration tests (requires Studio)

# Deployment
genlayer network                               # Select network
genlayer deploy                                # Deploy contracts

# Frontend
cd frontend && npm run dev                     # Start frontend dev server
```

## Architecture

```
contracts/          # Python intelligent contracts
tests/
  direct/           # Fast in-memory tests with web/LLM mocks
  integration/      # Full tests against GenLayer Studio
frontend/           # Next.js 15 app (TypeScript, TanStack Query, Radix UI)
deploy/             # TypeScript deployment scripts
```

**Frontend stack**: Next.js 15, React 19, TypeScript, Tailwind CSS, TanStack Query, Wagmi/Viem, MetaMask wallet integration.

## Development Workflow

1. Write/modify contract in `contracts/`
2. Lint: `genvm-lint check contracts/your_contract.py`
3. Test direct: `pytest tests/direct/ -v`
4. Start Studio and deploy: `genlayer deploy`
5. Test integration: `gltest tests/integration/ -v -s`
6. Run frontend: `cd frontend && npm run dev`

## Contract Development

Contracts are Python files in `/contracts/` using the GenLayer SDK:

```python
from genlayer import *

class MyContract(gl.Contract):
    data: TreeMap[Address, str]

    def __init__(self):
        self.data = TreeMap()

    @gl.public.view
    def get_data(self, addr: Address) -> str:
        return self.data.get(addr, "")

    @gl.public.write
    def set_data(self, value: str):
        self.data[gl.message.sender_address] = value
```

**Decorators**:
- `@gl.public.view` — Read-only methods
- `@gl.public.write` — State-modifying methods
- `@gl.public.write.payable` — Methods accepting value

**Storage types**: `TreeMap`, `DynArray`, `Array`, `u256`, `i256`, `@allow_storage` for custom classes

## Writing Direct Mode Tests

Direct mode runs contracts in-memory without Studio. Key APIs:

```python
def test_example(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/my_contract.py")

    # Set sender
    direct_vm.sender = direct_alice

    # Mock web requests (regex on URL)
    direct_vm.mock_web(r".*example\.com.*", {"status": 200, "body": "response"})

    # Mock LLM responses (regex on prompt)
    direct_vm.mock_llm(r".*analyze.*", '{"result": "positive"}')

    # Call contract methods directly
    contract.some_write_method("arg1")
    result = contract.some_view_method()

    # Assert expected failures
    with direct_vm.expect_revert("Error message"):
        contract.invalid_method()

    # Reset mocks between different scenarios
    direct_vm.clear_mocks()
```

Available fixtures: `direct_vm`, `direct_deploy`, `direct_alice`, `direct_bob`, `direct_charlie`, `direct_owner`, `direct_accounts`

## Linting

The GenVM linter catches contract issues before deployment:
- Forbidden imports (`os`, `sys`, `subprocess`, etc.)
- Non-deterministic calls outside equivalence principle blocks
- Invalid storage types (must use `TreeMap`/`DynArray`, not `dict`/`list`)
- Missing decorators and return type annotations
- Bare Python exceptions (must use `gl.vm.UserError` or `Exception`)

## Frontend Patterns

- Contract interactions: `frontend/lib/contracts/FootballBets.ts`
- React hooks: `frontend/lib/hooks/useFootballBets.ts`
- Wallet context: `frontend/lib/genlayer/WalletProvider.tsx`
- GenLayer client: `frontend/lib/genlayer/client.ts`

---

## GenLayer Technical Reference

> **Can't solve an issue?** Always check the complete SDK API reference:
> **https://sdk.genlayer.com/main/_static/ai/api.txt**
>
> Contains: all classes, methods, parameters, return types, changelogs, breaking changes.

### Documentation URLs

| Resource | URL |
|----------|-----|
| **SDK API (Complete)** | https://sdk.genlayer.com/main/_static/ai/api.txt |
| Full Documentation | https://docs.genlayer.com/full-documentation.txt |
| Main Docs | https://docs.genlayer.com/ |
| GenLayerJS SDK | https://docs.genlayer.com/api-references/genlayer-js |

### What is GenLayer?

GenLayer is an AI-native blockchain where smart contracts can natively access the internet and make decisions using AI (LLMs). Contracts are Python-based and executed in the GenVM.

### Web Access (`gl.nondet.web`)

```python
gl.nondet.web.get(url: str, *, headers: dict = {}) -> Response
gl.nondet.web.post(url: str, *, body: str | bytes | None = None, headers: dict = {}) -> Response
gl.nondet.web.render(url: str, *, mode: Literal['text', 'html']) -> str
gl.nondet.web.render(url: str, *, mode: Literal['screenshot']) -> Image
```

### LLM Access (`gl.nondet`)

```python
gl.nondet.exec_prompt(prompt: str, *, images: Sequence[bytes | Image] | None = None) -> str
gl.nondet.exec_prompt(prompt: str, *, response_format: Literal['json'], image: bytes | Image | None = None) -> dict
```

### Equivalence Principle

Validation for non-deterministic outputs. Two approaches:

**Custom leader/validator functions** (recommended for most cases):
```python
result = gl.vm.run_nondet(leader_fn, validator_fn)
result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)  # no type matching
```

**Convenience functions** (for common patterns):
| Type | Use Case | Function |
|------|----------|----------|
| Strict | Exact outputs | `gl.eq_principle.strict_eq()` |
| Comparative | Similar outputs | `gl.eq_principle.prompt_comparative()` |
| Non-Comparative | Subjective assessments | `gl.eq_principle.prompt_non_comparative()` |

### Key Documentation Links

- [Introduction to Intelligent Contracts](https://docs.genlayer.com/developers/intelligent-contracts/introduction)
- [Storage](https://docs.genlayer.com/developers/intelligent-contracts/storage)
- [Deploying Contracts](https://docs.genlayer.com/developers/intelligent-contracts/deploying)
- [Crafting Prompts](https://docs.genlayer.com/developers/intelligent-contracts/crafting-prompts)
- [Contract Examples](https://docs.genlayer.com/developers/intelligent-contracts/examples/storage)
- [Testing Contracts](https://docs.genlayer.com/developers/decentralized-applications/testing)
