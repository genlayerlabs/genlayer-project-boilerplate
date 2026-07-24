import json
import pytest
from tests.direct.conftest import to_hex

CONTRACT_PATH = "contracts/fact_checker.py"


def test_claim_creation_and_limits(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT_PATH)
    direct_vm.sender = direct_alice

    # Revert if value is 0
    direct_vm.value = 0
    with direct_vm.expect_revert("Value must be greater than zero"):
        contract.create_claim(
            "Claim 1", "https://example.com/claim1", True
        )

    # Success if value > 0
    direct_vm.value = 100
    claim_id = contract.create_claim(
        "Claim 1", "https://example.com/claim1", True
    )
    # The return value of create_claim is claim_id
    assert int(claim_id) == 1

    # Verify claim data
    claim = contract.get_claim(claim_id)
    assert int(claim.id) == 1
    assert claim.claim_text == "Claim 1"
    assert claim.source_url == "https://example.com/claim1"
    assert claim.is_resolved is False
    assert claim.outcome is False
    assert int(claim.total_true_stake) == 100
    assert int(claim.total_false_stake) == 0

    # Verify stakes
    assert int(contract.get_true_stake(claim_id, direct_alice)) == 100
    assert int(contract.get_false_stake(claim_id, direct_alice)) == 0


def test_place_stake(direct_vm, direct_deploy, direct_alice, direct_bob):
    contract = direct_deploy(CONTRACT_PATH)

    # Alice creates a claim voting True with 100
    direct_vm.sender = direct_alice
    direct_vm.value = 100
    claim_id = contract.create_claim(
        "Claim 1", "https://example.com/claim1", True
    )

    # Bob places a stake voting False with 200
    direct_vm.sender = direct_bob
    direct_vm.value = 200
    contract.place_stake(claim_id, False)

    # Verify stakes
    assert int(contract.get_true_stake(claim_id, direct_alice)) == 100
    assert int(contract.get_false_stake(claim_id, direct_bob)) == 200

    claim = contract.get_claim(claim_id)
    assert int(claim.total_true_stake) == 100
    assert int(claim.total_false_stake) == 200

    # Revert if placing stake with 0 value
    direct_vm.value = 0
    with direct_vm.expect_revert("Value must be greater than zero"):
        contract.place_stake(claim_id, True)


def test_resolution_true_outcome(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT_PATH)

    direct_vm.sender = direct_alice
    direct_vm.value = 100
    claim_id = contract.create_claim(
        "Claim 1", "https://example.com/claim1", True
    )

    # Setup web and LLM mocks
    direct_vm.mock_web(
        r".*example\.com/claim1.*",
        {"status": 200, "body": "Fact: Claim 1 is true"},
    )
    direct_vm.mock_llm(
        r".*Analyze the web content to determine if the claim is true or false.*",
        json.dumps({"outcome": True}),
    )

    # Resolve claim
    contract.resolve_claim(claim_id)

    claim = contract.get_claim(claim_id)
    assert claim.is_resolved is True
    assert claim.outcome is True


def test_resolution_false_outcome(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy(CONTRACT_PATH)

    direct_vm.sender = direct_alice
    direct_vm.value = 100
    claim_id = contract.create_claim(
        "Claim 1", "https://example.com/claim1", True
    )

    # Setup web and LLM mocks
    direct_vm.mock_web(
        r".*example\.com/claim1.*",
        {"status": 200, "body": "Fact: Claim 1 is false"},
    )
    direct_vm.mock_llm(
        r".*Analyze the web content to determine if the claim is true or false.*",
        json.dumps({"outcome": False}),
    )

    # Resolve claim
    contract.resolve_claim(claim_id)

    claim = contract.get_claim(claim_id)
    assert claim.is_resolved is True
    assert claim.outcome is False


def test_rewards_and_double_claim(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy(CONTRACT_PATH)

    # Alice creates a claim voting True with 100
    direct_vm.sender = direct_alice
    direct_vm.value = 100
    claim_id = contract.create_claim(
        "Claim 1", "https://example.com/claim1", True
    )

    # Bob places a stake voting False with 300
    direct_vm.sender = direct_bob
    direct_vm.value = 300
    contract.place_stake(claim_id, False)

    # Alice places another stake voting True with 100 (total True = 200)
    direct_vm.sender = direct_alice
    direct_vm.value = 100
    contract.place_stake(claim_id, True)

    # Total pool = 200 (True) + 300 (False) = 500
    # True wins. Alice has 200/200 of the winning pool, should get 500 payout.
    # Setup mocks
    direct_vm.mock_web(
        r".*example\.com/claim1.*",
        {"status": 200, "body": "Fact: Claim 1 is true"},
    )
    direct_vm.mock_llm(
        r".*Analyze the web content to determine if the claim is true or false.*",
        json.dumps({"outcome": True}),
    )

    contract.resolve_claim(claim_id)

    # Bob (loser) attempts to claim reward -> reverts
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("No winning stake"):
        contract.claim_reward(claim_id)

    # Set balances in VM to track changes
    direct_vm.deal(direct_alice, 0)

    def hook(vm, request):
        if "PostMessage" in request:
            post_msg = request["PostMessage"]
            addr = post_msg["address"]
            val = post_msg["value"]
            addr_bytes = vm._to_bytes(addr)
            vm._balances[addr_bytes] = vm._balances.get(addr_bytes, 0) + val
            return {"ok": None}
        return None
    direct_vm._gl_call_hook = hook

    # Alice claims reward
    direct_vm.sender = direct_alice
    contract.claim_reward(claim_id)

    # Verify Alice's balance increased by 500
    assert direct_vm._balances.get(direct_vm._to_bytes(direct_alice), 0) == 500

    # Alice attempts to claim again -> reverts (stake was set to 0)
    with direct_vm.expect_revert("No winning stake"):
        contract.claim_reward(claim_id)


def test_rewards_multiple_winners(
    direct_vm, direct_deploy, direct_alice, direct_bob, direct_charlie
):
    contract = direct_deploy(CONTRACT_PATH)

    # Alice creates a claim voting True with 100
    direct_vm.sender = direct_alice
    direct_vm.value = 100
    claim_id = contract.create_claim(
        "Claim 1", "https://example.com/claim1", True
    )

    # Bob places a stake voting False with 300
    direct_vm.sender = direct_bob
    direct_vm.value = 300
    contract.place_stake(claim_id, False)

    # Charlie places a stake voting True with 200 (total True = 300, total pool = 600)
    direct_vm.sender = direct_charlie
    direct_vm.value = 200
    contract.place_stake(claim_id, True)

    # Setup mocks
    direct_vm.mock_web(
        r".*example\.com/claim1.*",
        {"status": 200, "body": "Fact: Claim 1 is true"},
    )
    direct_vm.mock_llm(
        r".*Analyze the web content to determine if the claim is true or false.*",
        json.dumps({"outcome": True}),
    )

    contract.resolve_claim(claim_id)

    # Bob (loser) attempts to claim reward -> reverts
    direct_vm.sender = direct_bob
    with direct_vm.expect_revert("No winning stake"):
        contract.claim_reward(claim_id)

    # Set balances in VM to track changes
    direct_vm.deal(direct_alice, 0)
    direct_vm.deal(direct_charlie, 0)

    def hook(vm, request):
        if "PostMessage" in request:
            post_msg = request["PostMessage"]
            addr = post_msg["address"]
            val = post_msg["value"]
            addr_bytes = vm._to_bytes(addr)
            vm._balances[addr_bytes] = vm._balances.get(addr_bytes, 0) + val
            return {"ok": None}
        return None
    direct_vm._gl_call_hook = hook

    # Alice claims reward (should get 100 * 600 // 300 = 200)
    direct_vm.sender = direct_alice
    contract.claim_reward(claim_id)
    assert direct_vm._balances.get(direct_vm._to_bytes(direct_alice), 0) == 200

    # Charlie claims reward (should get 200 * 600 // 300 = 400)
    direct_vm.sender = direct_charlie
    contract.claim_reward(claim_id)
    assert direct_vm._balances.get(direct_vm._to_bytes(direct_charlie), 0) == 400

    # Both attempt to claim again -> reverts
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("No winning stake"):
        contract.claim_reward(claim_id)

    direct_vm.sender = direct_charlie
    with direct_vm.expect_revert("No winning stake"):
        contract.claim_reward(claim_id)


def test_revert_conditions(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy(CONTRACT_PATH)

    # 1. Place stake on non-existent claim
    direct_vm.sender = direct_alice
    direct_vm.value = 100
    with direct_vm.expect_revert("Claim does not exist"):
        contract.place_stake(999, True)

    # Create a claim
    claim_id = contract.create_claim(
        "Claim 1", "https://example.com/claim1", True
    )

    # 2. Claim reward on unresolved claim
    with direct_vm.expect_revert("Claim is not resolved yet"):
        contract.claim_reward(claim_id)

    # Resolve the claim
    direct_vm.mock_web(
        r".*example\.com/claim1.*",
        {"status": 200, "body": "Fact: Claim 1 is true"},
    )
    direct_vm.mock_llm(
        r".*Analyze the web content to determine if the claim is true or false.*",
        json.dumps({"outcome": True}),
    )
    contract.resolve_claim(claim_id)

    # 3. Resolve already resolved claim
    with direct_vm.expect_revert("Claim is already resolved"):
        contract.resolve_claim(claim_id)

    # 4. Place stake on already resolved claim
    with direct_vm.expect_revert("Claim is already resolved"):
        contract.place_stake(claim_id, True)

    # 5. Get non-existent claim
    with direct_vm.expect_revert("Claim does not exist"):
        contract.get_claim(999)


# End of test file

