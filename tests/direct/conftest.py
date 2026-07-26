"""Shared helpers for direct mode tests."""

import json


def to_hex(addr_bytes):
    """Convert address bytes to checksummed hex matching contract output.

    The contract's get_bets()/get_points() return keys via Address.as_hex,
    which produces EIP-55 checksummed hex. Call after direct_deploy so the
    SDK is on sys.path.
    """
    if hasattr(addr_bytes, "as_hex"):
        return addr_bytes.as_hex
    from genlayer.types import Address

    return Address(addr_bytes).as_hex


def mock_json_llm(vm, prompt_pattern, response):
    """Register JSON at the direct runner's raw text response boundary."""
    vm.mock_llm(prompt_pattern, json.dumps(json.dumps(response)))
