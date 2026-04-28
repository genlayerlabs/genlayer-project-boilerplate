"""
test_patterns.py — Verify GenLayer intelligent contract patterns in direct mode.

Tests 7 patterns to confirm which work reliably for skill documentation.
Run with: pytest tests/direct/test_patterns.py -v

genlayer-test: 0.25.0
"""
import json
import pytest
from pathlib import Path

CONTRACT_PATH = "contracts/PatternTest.py"

# ─────────────────────────────────────────────────────────────────────────────
# Pattern 3: _parse_llm_json helper — pure Python, no contract needed
# ─────────────────────────────────────────────────────────────────────────────

def _parse_llm_json(raw):
    if isinstance(raw, dict):
        return raw
    s = str(raw).strip().replace("```json", "").replace("```", "").strip()
    start, end = s.find("{"), s.rfind("}") + 1
    if start >= 0 and end > start:
        s = s[start:end]
    return json.loads(s)


class TestParseLlmJson:
    """Pattern 3: _parse_llm_json helper edge cases."""

    def test_raw_dict_passthrough(self):
        """Raw dict returns unchanged."""
        d = {"winner": 1, "score": "2:1"}
        result = _parse_llm_json(d)
        assert result == d
        assert result is d  # same object, no copy

    def test_plain_json_string(self):
        """Plain JSON string parses correctly."""
        result = _parse_llm_json('{"winner": 1, "score": "2:1"}')
        assert result == {"winner": 1, "score": "2:1"}

    def test_json_with_backtick_fences(self):
        """JSON wrapped in ```json ... ``` fences is stripped and parsed."""
        raw = '```json\n{"winner": 1, "score": "2:1"}\n```'
        result = _parse_llm_json(raw)
        assert result == {"winner": 1, "score": "2:1"}

    def test_json_with_plain_backtick_fences(self):
        """JSON wrapped in ``` ... ``` (no language tag) is stripped and parsed."""
        raw = '```\n{"winner": 1, "score": "2:1"}\n```'
        result = _parse_llm_json(raw)
        assert result == {"winner": 1, "score": "2:1"}

    def test_leading_trailing_whitespace(self):
        """Whitespace around JSON is stripped."""
        raw = '  \n  {"winner": 2, "score": "0:3"}  \n  '
        result = _parse_llm_json(raw)
        assert result == {"winner": 2, "score": "0:3"}

    def test_json_with_preamble_text(self):
        """JSON embedded in prose: extracts via brace-finding heuristic."""
        raw = 'Here is the result: {"winner": 1, "score": "2:1"} as requested.'
        result = _parse_llm_json(raw)
        assert result == {"winner": 1, "score": "2:1"}

    def test_invalid_json_raises(self):
        """Garbage string raises json.JSONDecodeError."""
        with pytest.raises((json.JSONDecodeError, ValueError)):
            _parse_llm_json("not json at all")


# ─────────────────────────────────────────────────────────────────────────────
# Pattern 6: json.dumps sort_keys stability — pure Python, no contract needed
# ─────────────────────────────────────────────────────────────────────────────

class TestJsonSortKeys:
    """Pattern 6: json.dumps sort_keys=True produces stable output."""

    def test_stable_across_two_calls(self):
        data = {"winner": 1, "score": "2:1", "analysis": "Team1 dominated"}
        out1 = json.dumps(data, sort_keys=True)
        out2 = json.dumps(data, sort_keys=True)
        assert out1 == out2

    def test_sort_keys_orders_alphabetically(self):
        data = {"z": 3, "a": 1, "m": 2}
        result = json.dumps(data, sort_keys=True)
        assert result == '{"a": 1, "m": 2, "z": 3}'

    def test_insertion_order_dict_same_output(self):
        d1 = {"winner": 1, "score": "2:1"}
        d2 = {"score": "2:1", "winner": 1}  # different insertion order
        assert json.dumps(d1, sort_keys=True) == json.dumps(d2, sort_keys=True)


# ─────────────────────────────────────────────────────────────────────────────
# Contract-level tests (Patterns 1, 2, 4, 5, 7)
# ─────────────────────────────────────────────────────────────────────────────

class TestGlVmReturn:
    """Pattern 1: gl.vm.Return type check in validator_fn."""

    def test_isinstance_return_on_success(self, direct_vm, direct_deploy):
        """
        When leader succeeds, validator_fn receives a gl.vm.Return.
        isinstance(leader_result, gl.vm.Return) → True.
        """
        # Mock LLM so leader_fn doesn't fail
        direct_vm.mock_llm(r".*", '{"winner": 1, "score": "2:1"}')
        contract = direct_deploy(CONTRACT_PATH)
        # Should succeed — validator sees Return, returns True → consensus
        result = contract.get_match_result(True)
        assert result is not None
        assert result["winner"] == 1
        assert result["score"] == "2:1"

    def test_validator_distinguishes_return_from_error(self, direct_vm, direct_deploy):
        """
        When leader raises, validator_fn receives UserError (not Return).
        isinstance(leader_result, gl.vm.Return) → False.
        The validator returns False on error, which causes run_nondet_unsafe to fail.
        """
        direct_vm.mock_llm(r".*", '{"winner": 1}')
        contract = direct_deploy(CONTRACT_PATH)
        # get_match_result_raises: leader always raises, validator returns False
        # run_nondet_unsafe should raise/revert since validator returns False
        from gltest.direct import ContractRollback
        with pytest.raises((ContractRollback, Exception)):
            contract.get_match_result_raises()


class TestPartialFieldMatching:
    """Pattern 2: Validator compares only specific fields."""

    def test_partial_match_ignores_analysis_field(self, direct_vm, direct_deploy):
        """
        Contract returns {winner, score, analysis}.
        Validator only checks winner + score.
        Consensus reached even though 'analysis' varies.
        """
        direct_vm.mock_llm(r".*", '{"winner": 1, "score": "2:1"}')
        contract = direct_deploy(CONTRACT_PATH)
        result = contract.get_match_result(True)
        assert result["winner"] == 1
        assert result["score"] == "2:1"
        # 'analysis' field is present in result but not checked by validator
        assert "analysis" in result

    def test_partial_match_team2_wins(self, direct_vm, direct_deploy):
        """Partial matching also works for team2 wins scenario."""
        direct_vm.mock_llm(r".*", '{"winner": 2, "score": "0:3"}')
        contract = direct_deploy(CONTRACT_PATH)
        result = contract.get_match_result(False)
        assert result["winner"] == 2
        assert result["score"] == "0:3"


class TestU256Arithmetic:
    """Pattern 4: u256 arithmetic in contract storage."""

    def test_increment_from_zero(self, direct_vm, direct_deploy):
        """u256(int(self.count) + 1) increments from 0 to 1."""
        contract = direct_deploy(CONTRACT_PATH)
        result = contract.increment()
        assert int(result) == 1
        assert contract.get_count() == 1

    def test_increment_multiple_times(self, direct_vm, direct_deploy):
        """Multiple increments accumulate correctly."""
        contract = direct_deploy(CONTRACT_PATH)
        for i in range(1, 6):
            contract.increment()
        assert contract.get_count() == 5

    def test_u256_round_trip(self, direct_vm, direct_deploy):
        """int(self.amount) round-trips correctly for initial value."""
        contract = direct_deploy(CONTRACT_PATH, 12345)
        assert contract.get_amount() == 12345

    def test_u256_zero_initial(self, direct_vm, direct_deploy):
        """Default u256(0) initializes correctly."""
        contract = direct_deploy(CONTRACT_PATH)
        assert contract.get_count() == 0
        assert contract.get_amount() == 0


class TestAddressConstructor:
    """
    Pattern 5: Address constructor handles str and bytes.

    GOTCHA: create_address() returns raw bytes (20 bytes), NOT an Address object.
    str(raw_bytes) returns Python's bytes repr "b'+\\xd8...'" — NOT a hex address!
    Always format as "0x" + addr.hex() when you need a hex string for Address().
    """

    def test_address_from_hex_str(self, direct_vm, direct_deploy):
        """Address(str) works when passed a valid '0x...' hex string."""
        from gltest.direct import create_address
        alice = create_address("alice")  # returns raw bytes
        # Correct: format as hex address string
        alice_hex = "0x" + alice.hex()
        contract = direct_deploy(CONTRACT_PATH)
        result = contract.set_party(alice_hex)
        assert result.lower() == alice_hex.lower()

    def test_address_from_raw_bytes(self, direct_vm, direct_deploy):
        """Address(bytes) works when party_b passed as raw 20-byte value."""
        from gltest.direct import create_address
        alice = create_address("alice")  # returns raw bytes (20 bytes)
        contract = direct_deploy(CONTRACT_PATH)
        result = contract.set_party(alice)  # pass bytes directly
        assert result.lower() == ("0x" + alice.hex()).lower()

    def test_str_of_bytes_fails(self, direct_vm, direct_deploy):
        """
        DOCUMENTED GOTCHA: str(create_address(...)) gives bytes repr, not hex.
        Passing that repr to Address() fails with binascii.Error (invalid base64).
        """
        from gltest.direct import create_address
        import binascii
        alice = create_address("alice")
        bad_str = str(alice)  # = "b'+\\xd8...'"  — wrong format!
        assert not bad_str.startswith("0x"), "Confirm: str(bytes) is NOT a hex address"
        contract = direct_deploy(CONTRACT_PATH)
        with pytest.raises(Exception):  # binascii.Error or Address init error
            contract.set_party(bad_str)


class TestNestedTreeMapWorkaround:
    """Pattern 7: Store list inside TreeMap as JSON string."""

    def test_add_single_item(self, direct_vm, direct_deploy):
        """Storing one item in the list works."""
        contract = direct_deploy(CONTRACT_PATH)
        contract.add_to_index("match:2024-06-20", "bet_001")
        result = contract.get_index("match:2024-06-20")
        assert result == ["bet_001"]

    def test_add_multiple_items_same_key(self, direct_vm, direct_deploy):
        """Multiple appends to same key accumulate correctly."""
        contract = direct_deploy(CONTRACT_PATH)
        contract.add_to_index("match:2024-06-20", "bet_001")
        contract.add_to_index("match:2024-06-20", "bet_002")
        contract.add_to_index("match:2024-06-20", "bet_003")
        result = contract.get_index("match:2024-06-20")
        assert result == ["bet_001", "bet_002", "bet_003"]

    def test_different_keys_are_independent(self, direct_vm, direct_deploy):
        """Different keys store independent lists."""
        contract = direct_deploy(CONTRACT_PATH)
        contract.add_to_index("key_A", "item_1")
        contract.add_to_index("key_B", "item_2")
        assert contract.get_index("key_A") == ["item_1"]
        assert contract.get_index("key_B") == ["item_2"]

    def test_empty_key_returns_empty_list(self, direct_vm, direct_deploy):
        """Missing key returns empty list (not error)."""
        contract = direct_deploy(CONTRACT_PATH)
        result = contract.get_index("nonexistent_key")
        assert result == []

    def test_json_string_stored_and_retrieved(self, direct_vm, direct_deploy):
        """Raw value stored in TreeMap is valid JSON string."""
        contract = direct_deploy(CONTRACT_PATH)
        raw = contract.add_to_index("key", "abc")
        parsed = json.loads(raw)
        assert parsed == ["abc"]


class TestContractStableJson:
    """Pattern 6 (contract-level): stable_json via contract method."""

    def test_stable_json_same_output_twice(self, direct_vm, direct_deploy):
        """json.dumps(data, sort_keys=True) returns same string each call."""
        contract = direct_deploy(CONTRACT_PATH)
        data = {"winner": 1, "score": "2:1", "analysis": "Team1"}
        out1 = contract.stable_json(data)
        out2 = contract.stable_json(data)
        assert out1 == out2

    def test_stable_json_sorts_keys(self, direct_vm, direct_deploy):
        """sort_keys=True produces alphabetically sorted keys."""
        contract = direct_deploy(CONTRACT_PATH)
        data = {"z": 3, "a": 1, "m": 2}
        result = contract.stable_json(data)
        assert result == '{"a": 1, "m": 2, "z": 3}'
