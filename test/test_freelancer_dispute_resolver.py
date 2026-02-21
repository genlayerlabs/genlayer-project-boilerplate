import pytest
import os

STUDIO_URL = os.getenv("GENLAYER_STUDIO_URL", "http://localhost:8080")

JOB_DESCRIPTION = (
    "Build a Python web scraper that collects product names and prices from "
    "an e-commerce site and outputs them as a CSV file. "
    "The code must be well-documented, include error handling, and be hosted "
    "in a public GitHub repository with a clear README."
)

TEST_DELIVERABLES_URL = "https://github.com/genlayerlabs/genlayer-studio"


def _deploy_contract(submit_deliverables: bool = False) -> dict:
    from genlayer_py.testing import GenLayerTestClient
    client = GenLayerTestClient(studio_url=STUDIO_URL)
    accounts = client.get_accounts()
    assert len(accounts) >= 3, "GenLayer Studio must have at least 3 accounts configured."
    client_account, freelancer_account, third_party_account = accounts[0], accounts[1], accounts[2]
    contract_address = client.deploy_contract(
        sender=client_account,
        contract_file="contracts/freelancer_dispute_resolver.py",
        args=[freelancer_account["address"], JOB_DESCRIPTION],
    )
    if submit_deliverables:
        client.send_transaction(
            sender=freelancer_account,
            contract_address=contract_address,
            function="submit_deliverables",
            args=[TEST_DELIVERABLES_URL],
        )
    return {
        "client": client,
        "contract_address": contract_address,
        "client_account": client_account,
        "freelancer_account": freelancer_account,
        "third_party_account": third_party_account,
    }


@pytest.fixture(scope="module")
def setup():
    return _deploy_contract(submit_deliverables=False)


@pytest.fixture(scope="module")
def setup_unresolved():
    """Fresh contract instance for negative/access-control tests."""
    return _deploy_contract(submit_deliverables=True)


# ── Happy path tests (must run in order) ─────────────────────────────────────

@pytest.mark.order(1)
def test_initial_state(setup):
    result = setup["client"].call_contract(
        sender=setup["client_account"],
        contract_address=setup["contract_address"],
        function="get_job_info",
        args=[],
    )
    assert result["job_description"] == JOB_DESCRIPTION
    assert result["deliverables_url"] == ""


@pytest.mark.order(2)
def test_freelancer_submits_deliverables(setup):
    setup["client"].send_transaction(
        sender=setup["freelancer_account"],
        contract_address=setup["contract_address"],
        function="submit_deliverables",
        args=[TEST_DELIVERABLES_URL],
    )
    result = setup["client"].call_contract(
        sender=setup["client_account"],
        contract_address=setup["contract_address"],
        function="get_job_info",
        args=[],
    )
    assert result["deliverables_url"] == TEST_DELIVERABLES_URL


@pytest.mark.order(3)
def test_client_raises_dispute(setup):
    setup["client"].send_transaction(
        sender=setup["client_account"],
        contract_address=setup["contract_address"],
        function="raise_dispute",
        args=["The README is missing and there is no CSV output as specified."],
    )
    result = setup["client"].call_contract(
        sender=setup["client_account"],
        contract_address=setup["contract_address"],
        function="get_dispute_status",
        args=[],
    )
    assert result["dispute_raised"] is True


@pytest.mark.order(4)
def test_freelancer_submits_evidence(setup):
    setup["client"].send_transaction(
        sender=setup["freelancer_account"],
        contract_address=setup["contract_address"],
        function="submit_evidence",
        args=["The README is in the repo root. Error handling is in scraper.py lines 45-67."],
    )
    result = setup["client"].call_contract(
        sender=setup["client_account"],
        contract_address=setup["contract_address"],
        function="get_dispute_status",
        args=[],
    )
    assert "README" in result["freelancer_evidence"]


@pytest.mark.order(5)
def test_resolve_dispute(setup):
    setup["client"].send_transaction(
        sender=setup["third_party_account"],
        contract_address=setup["contract_address"],
        function="resolve_dispute",
        args=[],
    )
    verdict = setup["client"].call_contract(
        sender=setup["third_party_account"],
        contract_address=setup["contract_address"],
        function="get_verdict",
        args=[],
    )
    assert verdict in ("freelancer", "client", "draw")

    # Verify double-resolution is rejected
    try:
        setup["client"].send_transaction(
            sender=setup["third_party_account"],
            contract_address=setup["contract_address"],
            function="resolve_dispute",
            args=[],
        )
        pytest.fail("Expected an exception but none was raised.")
    except Exception as e:
        assert "already been resolved" in str(e)


# ── Negative / access control tests (isolated fresh contract) ─────────────────

@pytest.mark.order(6)
def test_non_freelancer_cannot_submit_deliverables(setup_unresolved):
    """Client should not be able to submit deliverables."""
    try:
        setup_unresolved["client"].send_transaction(
            sender=setup_unresolved["client_account"],
            contract_address=setup_unresolved["contract_address"],
            function="submit_deliverables",
            args=["https://malicious-override.com"],
        )
        pytest.fail("Expected an exception but none was raised.")
    except Exception as e:
        assert "Only the freelancer" in str(e)


@pytest.mark.order(7)
def test_client_cannot_raise_dispute_twice(setup_unresolved):
    """Client cannot overwrite their dispute evidence once submitted."""
    # Submit client evidence first
    setup_unresolved["client"].send_transaction(
        sender=setup_unresolved["client_account"],
        contract_address=setup_unresolved["contract_address"],
        function="raise_dispute",
        args=["The README is missing."],
    )
    # Try to raise dispute again
    try:
        setup_unresolved["client"].send_transaction(
            sender=setup_unresolved["client_account"],
            contract_address=setup_unresolved["contract_address"],
            function="raise_dispute",
            args=["Trying to overwrite my evidence."],
        )
        pytest.fail("Expected an exception but none was raised.")
    except Exception as e:
        assert "already submitted" in str(e)


@pytest.mark.order(8)
def test_cannot_resolve_without_both_evidences(setup_unresolved):
    """Resolving without freelancer evidence should fail."""
    # Precondition: client evidence must have been submitted by test 7
    status = setup_unresolved["client"].call_contract(
        sender=setup_unresolved["client_account"],
        contract_address=setup_unresolved["contract_address"],
        function="get_dispute_status",
        args=[],
    )
    assert status["client_evidence"], "Precondition failed: run test_client_cannot_raise_dispute_twice first."

    try:
        setup_unresolved["client"].send_transaction(
            sender=setup_unresolved["third_party_account"],
            contract_address=setup_unresolved["contract_address"],
            function="resolve_dispute",
            args=[],
        )
        pytest.fail("Expected an exception but none was raised.")
    except Exception as e:
        assert "Freelancer has not submitted evidence" in str(e)


@pytest.mark.order(9)
def test_freelancer_cannot_submit_evidence_twice(setup_unresolved):
    """Freelancer cannot overwrite their rebuttal evidence once submitted."""
    # Submit freelancer evidence first
    setup_unresolved["client"].send_transaction(
        sender=setup_unresolved["freelancer_account"],
        contract_address=setup_unresolved["contract_address"],
        function="submit_evidence",
        args=["Initial rebuttal."],
    )
    # Try to submit again
    try:
        setup_unresolved["client"].send_transaction(
            sender=setup_unresolved["freelancer_account"],
            contract_address=setup_unresolved["contract_address"],
            function="submit_evidence",
            args=["Overwrite attempt."],
        )
        pytest.fail("Expected an exception but none was raised.")
    except Exception as e:
        assert "already submitted" in str(e)
