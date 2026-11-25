"""Integration tests — require GenLayer Studio running.

Run with: gltest tests/integration/ -v -s
"""

import pytest
from gltest import get_contract_factory, get_default_account, get_validator_factory
from gltest.clients import get_gl_client
from gltest.helpers import load_fixture
from gltest.assertions import tx_execution_succeeded
from gltest.fees import fee_profile_enabled, get_fee_profile_collector
from gltest.types import MockedLLMResponse, MockedWebResponse

from tests.integration.fixtures import (
    football_bets_win_resolved,
    football_bets_win_unresolved,
    football_bets_draw_unresolved,
    football_bets_draw_resolved,
    football_bets_unsuccess_unresolved,
    football_bets_unsuccess_resolved,
)


default_account = get_default_account()
MATCH_URL = "https://www.bbc.com/sport/football/scores-fixtures/2024-06-20"
FEE_ESTIMATE_OPTIONS = {
    "leaderTimeunitsAllocation": 100,
    "validatorTimeunitsAllocation": 200,
    "rotations": [1],
}


def transaction_fee_preset():
    estimate = get_gl_client().estimate_transaction_fees(FEE_ESTIMATE_OPTIONS)
    return {
        "distribution": estimate["distribution"],
        "feeValue": estimate["feeValue"],
    }


def fee_profile_wait_until():
    return "finalized" if fee_profile_enabled() else None


def make_match_context(team1: str, team2: str, score: str, winner: int):
    mock_llm_response: MockedLLMResponse = {
        "nondet_exec_prompt": {
            f"Team 1: {team1}\nTeam 2: {team2}": (
                f'{{"score": "{score}", "winner": {winner}}}'
            ),
        },
        "eq_principle_prompt_comparative": {},
        "eq_principle_prompt_non_comparative": {},
    }
    mock_web_response: MockedWebResponse = {
        "nondet_web_request": {
            MATCH_URL: {
                "method": "GET",
                "status": 200,
                "body": f"Match result: {score}. Winner: team {winner}.",
            }
        }
    }
    validators = get_validator_factory().batch_create_mock_validators(
        count=5,
        mock_llm_response=mock_llm_response,
        mock_web_response=mock_web_response,
    )
    return {"validators": [validator.to_dict() for validator in validators]}


@pytest.mark.integration
def deploy_contract():
    factory = get_contract_factory("FootballBets")
    contract = factory.deploy(
        fees=transaction_fee_preset(),
        wait_until=fee_profile_wait_until(),
    )

    contract_all_points_state = contract.get_points(args=[]).call()
    assert contract_all_points_state == {}

    contract_all_bets_state = contract.get_bets(args=[]).call()
    assert contract_all_bets_state == {}
    return contract


@pytest.mark.integration
def test_fee_profile_create_bet():
    if not fee_profile_enabled():
        pytest.skip("fee profile generation requires --fee-profile")

    contract = load_fixture(deploy_contract)

    create_bet_result = contract.create_bet(
        args=["2024-06-20", "Spain", "Italy", "1"]
    ).transact(fees=transaction_fee_preset(), wait_until="finalized")
    assert tx_execution_succeeded(create_bet_result)

    get_bet_result = contract.get_bets(args=[]).call()
    assert get_bet_result == {
        default_account.address: football_bets_win_unresolved
    }

    profile = get_fee_profile_collector().build_profile(
        network="localnet", headroom=1.0
    )
    assert int(profile["deploy"]["executionBudgetPerRound"]) > 0
    assert int(profile["methods"]["create_bet"]["executionBudgetPerRound"]) > 0


@pytest.mark.integration
def test_football_bets_success_win():
    contract = load_fixture(deploy_contract)
    transaction_context = make_match_context("Spain", "Italy", "1:0", 1)

    create_bet_result = contract.create_bet(
        args=["2024-06-20", "Spain", "Italy", "1"]
    ).transact(fees=transaction_fee_preset())
    assert tx_execution_succeeded(create_bet_result)

    get_bet_result = contract.get_bets(args=[]).call()
    assert get_bet_result == {
        default_account.address: football_bets_win_unresolved
    }

    resolve_successful_bet_result = contract.resolve_bet(
        args=["2024-06-20_spain_italy"]
    ).transact(
        fees=transaction_fee_preset(),
        wait_interval=10000,
        wait_retries=15,
        transaction_context=transaction_context,
    )
    assert tx_execution_succeeded(resolve_successful_bet_result)

    get_bet_result = contract.get_bets(args=[]).call()
    assert get_bet_result == {default_account.address: football_bets_win_resolved}

    get_points_result = contract.get_points(args=[]).call()
    assert get_points_result == {default_account.address: 1}

    get_player_points_result = contract.get_player_points(
        args=[default_account.address]
    ).call()
    assert get_player_points_result == 1


@pytest.mark.integration
def test_football_bets_draw_success():
    contract = load_fixture(deploy_contract)
    transaction_context = make_match_context("Denmark", "England", "1:1", 0)

    create_bet_result = contract.create_bet(
        args=["2024-06-20", "Denmark", "England", "0"]
    ).transact(fees=transaction_fee_preset())
    assert tx_execution_succeeded(create_bet_result)

    get_bet_result = contract.get_bets(args=[]).call()
    assert get_bet_result == {
        default_account.address: football_bets_draw_unresolved
    }

    resolve_successful_bet_result = contract.resolve_bet(
        args=["2024-06-20_denmark_england"]
    ).transact(
        fees=transaction_fee_preset(),
        wait_interval=10000,
        wait_retries=15,
        transaction_context=transaction_context,
    )
    assert tx_execution_succeeded(resolve_successful_bet_result)

    get_bet_result = contract.get_bets(args=[]).call()
    assert get_bet_result == {default_account.address: football_bets_draw_resolved}

    get_points_result = contract.get_points(args=[]).call()
    assert get_points_result == {default_account.address: 1}

    get_player_points_result = contract.get_player_points(
        args=[default_account.address]
    ).call()
    assert get_player_points_result == 1


@pytest.mark.integration
def test_football_bets_unsuccess():
    contract = load_fixture(deploy_contract)
    transaction_context = make_match_context("Spain", "Italy", "1:0", 1)

    create_bet_result = contract.create_bet(
        args=["2024-06-20", "Spain", "Italy", "2"]
    ).transact(fees=transaction_fee_preset())
    assert tx_execution_succeeded(create_bet_result)

    get_bet_result = contract.get_bets(args=[]).call()
    assert get_bet_result == {
        default_account.address: football_bets_unsuccess_unresolved
    }

    resolve_successful_bet_result = contract.resolve_bet(
        args=["2024-06-20_spain_italy"]
    ).transact(
        fees=transaction_fee_preset(),
        wait_interval=10000,
        wait_retries=15,
        transaction_context=transaction_context,
    )
    assert tx_execution_succeeded(resolve_successful_bet_result)

    get_bet_result = contract.get_bets(args=[]).call()
    assert get_bet_result == {
        default_account.address: football_bets_unsuccess_resolved
    }

    get_points_result = contract.get_points(args=[]).call()
    assert get_points_result == {}

    get_player_points_result = contract.get_player_points(
        args=[default_account.address]
    ).call()
    assert get_player_points_result == 0
