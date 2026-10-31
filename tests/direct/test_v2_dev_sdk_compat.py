from pathlib import Path

from gltest.direct.sdk_compat import import_calldata, import_types
from gltest.direct.sdk_loader import setup_sdk_paths


def test_pinned_direct_runner_exports_modules_expected_by_genlayer_test():
    """The pinned runner and test harness must agree on the v0.3 SDK layout."""
    contract = Path("contracts/football_bets.py").resolve()
    setup_sdk_paths(contract, None)

    assert hasattr(import_calldata(), "encode")
    assert hasattr(import_types(), "Address")
