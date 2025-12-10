# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Commands

```bash
npm run deploy          # Deploy contracts via GenLayer CLI
npm run dev             # Start frontend dev server (cd frontend && npm run dev)
npm run build           # Build frontend for production
gltest                  # Run contract tests (requires GenLayer Studio running)
genlayer network        # Select network (studionet/localnet/testnet)
```

## Architecture

```
contracts/          # Python intelligent contracts
frontend/           # Next.js 15 app (TypeScript, TanStack Query, Radix UI)
deploy/             # TypeScript deployment scripts
test/               # Python integration tests (gltest)
```

**Frontend stack**: Next.js 15, React 19, TypeScript, Tailwind CSS, TanStack Query, Wagmi/Viem, MetaMask wallet integration.

## Development Workflow

1. Ensure GenLayer Studio is running (local or https://studio.genlayer.com)
2. Select network: `genlayer network`
3. Deploy contract: `npm run deploy`
4. Copy deployed address to `frontend/.env` as `NEXT_PUBLIC_CONTRACT_ADDRESS`
5. Run frontend: `cd frontend && bun dev`

## Contract Development

Contracts are Python files in `/contracts/` using the GenLayer SDK:

```python
from genlayer import *

class MyContract(gl.Contract):
    data: TreeMap[Address, str]  # Storage declaration

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
- `@gl.public.view` - Read-only methods
- `@gl.public.write` - State-modifying methods
- `@gl.public.write.payable` - Methods accepting value

**Storage types**: `TreeMap`, `DynArray`, `Array`, `@allow_storage` for custom classes

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

Validation for non-deterministic outputs:

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
