# { "Depends": "py-genlayer:test" }
"""
PatternTest.py — Minimal contract to test GenLayer patterns.
Covers: gl.vm.Return, partial field matching, u256 arithmetic,
Address constructor, json.dumps sort_keys, nested TreeMap workaround.
"""
import json
from genlayer import *
import genlayer.gl.vm as glvm


class PatternTest(gl.Contract):
    # Pattern 4: u256 storage
    count: u256
    amount: u256
    # Pattern 7: nested TreeMap workaround (list stored as JSON string)
    index: TreeMap[str, str]

    def __init__(self, initial_amount: u256 = u256(0)):
        self.count = u256(0)
        self.amount = u256(int(initial_amount))
        self.index = TreeMap()

    # ── Pattern 1 & 2: gl.vm.Return type check + partial field matching ──────

    @gl.public.write
    def get_match_result(self, team1_wins: bool) -> dict:
        """Returns a dict. LLM call mocked in tests."""
        def leader_fn() -> dict:
            raw = gl.nondet.exec_prompt(
                f"Who wins between team1 and team2?",
                response_format="json",
            )
            # Simulate returning a structured result
            if team1_wins:
                return {"winner": 1, "score": "2:1", "analysis": "Team1 dominated"}
            else:
                return {"winner": 2, "score": "0:3", "analysis": "Team2 dominated"}

        def validator_fn(leader_result) -> bool:
            # Pattern 1: isinstance check
            if not isinstance(leader_result, glvm.Return):
                return False
            # Pattern 2: partial field matching — only compare winner + score
            v = leader_fn()
            return (
                leader_result.calldata["winner"] == v["winner"]
                and leader_result.calldata["score"] == v["score"]
            )

        result = glvm.run_nondet_unsafe(leader_fn, validator_fn)
        return result

    @gl.public.write
    def get_match_result_raises(self) -> dict:
        """Leader fn raises — validator should see non-Return (UserError)."""
        def leader_fn() -> dict:
            raise Exception("LLM failed")

        def validator_fn(leader_result) -> bool:
            # If leader raised, leader_result should NOT be a Return
            if not isinstance(leader_result, glvm.Return):
                return False  # correct: error case
            return True

        result = glvm.run_nondet_unsafe(leader_fn, validator_fn)
        return result

    # ── Pattern 4: u256 arithmetic ────────────────────────────────────────────

    @gl.public.write
    def increment(self) -> u256:
        """Increment count by 1 using u256(int(self.count) + 1)."""
        self.count = u256(int(self.count) + 1)
        return self.count

    @gl.public.view
    def get_count(self) -> int:
        return int(self.count)

    @gl.public.view
    def get_amount(self) -> int:
        return int(self.amount)

    # ── Pattern 5: Address constructor ────────────────────────────────────────

    @gl.public.write
    def set_party(self, party_b: str) -> str:
        """Accepts str address, wraps in Address constructor."""
        if isinstance(party_b, (str, bytes)):
            party_b = Address(party_b)
        return str(party_b)

    # ── Pattern 6: json.dumps sort_keys ──────────────────────────────────────

    @gl.public.view
    def stable_json(self, data: dict) -> str:
        """Returns JSON with sort_keys=True for stable comparison."""
        return json.dumps(data, sort_keys=True)

    # ── Pattern 7: Nested TreeMap workaround ─────────────────────────────────

    @gl.public.write
    def add_to_index(self, key: str, new_id: str) -> str:
        """Store a list inside TreeMap as JSON string."""
        id_list = json.loads(self.index.get(key) or "[]")
        id_list.append(new_id)
        self.index[key] = json.dumps(id_list)
        return self.index[key]

    @gl.public.view
    def get_index(self, key: str) -> list:
        """Retrieve the list stored in TreeMap."""
        return json.loads(self.index.get(key) or "[]")
