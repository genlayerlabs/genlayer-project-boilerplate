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


@pytest.fixture(scope="module")
def setup():
    from genlayer_py.testing import GenLayerTestClient
    client = GenLayerTestClient(studio_url=STUDIO_URL)
    accounts = client.get_accounts()

    # GenLayer Studio must have at least 3 accounts (client, freelancer, third party)
    assert len(accounts) >= 3, "GenLayer Studio must have at least 3 accounts configured."

    client_account = accounts[0]
    freelancer_account = accounts[1]
    third_party_account = accounts[2]

    contract_address = client.deploy_contract(
        sender=client_account,
        contract_file="contracts/freelancer_dispute_resolver.py",
        args=[freelancer_account["address"], JOB_DESCRIPTION],
    )

    return {
        "client": client,
        "contract_address": contract_address,
        "client_account": client_account,
        "freelancer_account": freelancer_account,
        "third_party_account": third_party_account,
    }


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
        function="raise_dispute",
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


# ── Negative / access control tests ──────────────────────────────────────────

@pytest.mark.order(6)
def test_non_freelancer_cannot_submit_deliverables(setup):
    """Client should not be able to submit deliverables."""
    try:
        setup["client"].send_transaction(
            sender=setup["client_account"],
            contract_address=setup["contract_address"],
            function="submit_deliverables",
            args=["https://malicious-override.com"],
        )
        assert False, "Expected an exception but none was raised."
    except Exception as e:
        assert "Only the freelancer" in str(e) or "resolved" in str(e)


@pytest.mark.order(7)
def test_cannot_submit_evidence_twice(setup):
    """A party cannot overwrite their evidence once submitted."""
    try:
        setup["client"].send_transaction(
            sender=setup["client_account"],
            contract_address=setup["contract_address"],
            function="raise_dispute",
            args=["Trying to overwrite my evidence."],
        )
        assert False, "Expected an exception but none was raised."
    except Exception as e:
        assert "already submitted" in str(e) or "resolved" in str(e)


@pytest.mark.order(8)
def test_double_resolution_is_rejected(setup):
    """Calling resolve_dispute a second time should fail."""
    try:
        setup["client"].send_transaction(
            sender=setup["third_party_account"],
            contract_address=setup["contract_address"],
            function="resolve_dispute",
            args=[],
        )
        assert False, "Expected an exception but none was raised."
    except Exception as e:
        assert "already been resolved" in str(e)
