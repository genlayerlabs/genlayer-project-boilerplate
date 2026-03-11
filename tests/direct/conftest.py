"""Shared helpers for direct mode tests."""

import pytest


@pytest.fixture
def addr(direct_alice, direct_bob, direct_charlie):
    """Convert raw byte addresses to hex strings matching contract output.

    The contract's get_bets()/get_points() return keys via Address.as_hex,
    which produces '0x'-prefixed lowercase hex. The direct_* fixtures may
    return raw bytes if the SDK isn't loaded yet, so we normalize here.
    """

    def _to_hex(addr_bytes):
        if hasattr(addr_bytes, "as_hex"):
            return addr_bytes.as_hex
        return "0x" + addr_bytes.hex()

    class Addresses:
        alice = _to_hex(direct_alice)
        bob = _to_hex(direct_bob)
        charlie = _to_hex(direct_charlie)

    return Addresses()
