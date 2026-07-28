"""Integration tests for AI Fact-Checker — require GenLayer Studio running.

Run with: gltest tests/integration/ -v -s
"""

import pytest
from gltest import get_contract_factory, get_default_account
from gltest.helpers import load_fixture
from gltest.assertions import tx_execution_succeeded


@pytest.mark.integration
def deploy_fact_checker():
    factory = get_contract_factory("FactChecker")
    contract = factory.deploy()
    
    # Initial claims count should be 0
    count = contract.get_claims_count(args=[])
    assert int(count) == 0
    
    return contract


@pytest.mark.integration
def test_fact_checker_full_lifecycle():
    contract = load_fixture(deploy_fact_checker)
    
    # 1. Create a claim with initial True stake of 1000 Wei
    create_claim_result = contract.create_claim(
        args=["SpaceX successfully launched its Starship rocket on June 6, 2024", "https://example.com", True],
        value=1000
    )
    assert tx_execution_succeeded(create_claim_result)
    
    # Verify claims count increased to 1
    count = contract.get_claims_count(args=[])
    assert int(count) == 1
    
    # Verify claim detail
    claim = contract.get_claim(args=[1])
    assert int(claim["id"]) == 1
    assert claim["claim_text"] == "SpaceX successfully launched its Starship rocket on June 6, 2024"
    assert claim["is_resolved"] is False
    assert int(claim["total_true_stake"]) == 1000
    assert int(claim["total_false_stake"]) == 0
    
    # 2. Bob/Second participant places a stake of 2000 Wei on False
    # (Since gltest uses the default_account by default, we can place another stake)
    place_stake_result = contract.place_stake(
        args=[1, False],
        value=2000
    )
    assert tx_execution_succeeded(place_stake_result)
    
    # Verify stakes
    default_acct = get_default_account()
    true_stake = contract.get_true_stake(args=[1, default_acct.address])
    false_stake = contract.get_false_stake(args=[1, default_acct.address])
    assert int(true_stake) == 1000
    assert int(false_stake) == 2000
    
    # 3. Resolve the claim
    # Note: In a real integration test environment, the LLM will analyze the web content.
    # We will trigger the resolution and wait for it to be accepted.
    resolve_result = contract.resolve_claim(
        args=[1],
        wait_interval=10000,
        wait_retries=15,
    )
    assert tx_execution_succeeded(resolve_result)
    
    # Verify resolution status
    resolved_claim = contract.get_claim(args=[1])
    assert resolved_claim["is_resolved"] is True
    
    # 4. Claim reward
    # Depending on how the LLM resolved example.com (which might be True or False on the live LLM),
    # one of the stakes will be the winner.
    # Since we don't know the exact outcome of example.com on a live network run, we attempt
    # to claim reward. We check the outcome from the resolved claim state first.
    outcome = resolved_claim["outcome"]
    
    # We claim reward
    claim_reward_result = contract.claim_reward(
        args=[1]
    )
    assert tx_execution_succeeded(claim_reward_result)
