"""Integration tests — require GenLayer Studio running.

Run with: gltest tests/integration/ -v -s
"""

import pytest
from gltest import get_contract_factory, default_account
from gltest.helpers import load_fixture
from gltest.assertions import tx_execution_succeeded

from tests.integration.fixtures import (
    football_bets_win_resolved,
    football_bets_win_unresolved,
    football_bets_draw_unresolved,
    football_bets_draw_resolved,
    football_bets_unsuccess_unresolved,
    football_bets_unsuccess_resolved,
)


@pytest.mark.integration
def deploy_contract():
    factory = get_contract_factory("FootballBets")
    contract = factory.deploy()

    contract_all_points_state = contract.get_points(args=[])
    assert contract_all_points_state == {}

    contract_all_bets_state = contract.get_bets(args=[])
    assert contract_all_bets_state == {}
    return contract


@pytest.mark.integration
def test_football_bets_success_win():
    contract = load_fixture(deploy_contract)

    create_bet_result = contract.create_bet(args=["2024-06-20", "Spain", "Italy", "1"])
    assert tx_execution_succeeded(create_bet_result)

    get_bet_result = contract.get_bets(args=[])
    assert get_bet_result == {
        default_account.address: football_bets_win_unresolved
    }

    resolve_successful_bet_result = contract.resolve_bet(
        args=["2024-06-20_spain_italy"],
        wait_interval=10000,
        wait_retries=15,
    )
    assert tx_execution_succeeded(resolve_successful_bet_result)

    get_bet_result = contract.get_bets(args=[])
    assert get_bet_result == {default_account.address: football_bets_win_resolved}

    get_points_result = contract.get_points(args=[])
    assert get_points_result == {default_account.address: 1}

    get_player_points_result = contract.get_player_points(
        args=[default_account.address]
    )
    assert get_player_points_result == 1


@pytest.mark.integration
def test_football_bets_draw_success():
    contract = load_fixture(deploy_contract)

    create_bet_result = contract.create_bet(
        args=["2024-06-20", "Denmark", "England", "0"]
    )
    assert tx_execution_succeeded(create_bet_result)

    get_bet_result = contract.get_bets(args=[])
    assert get_bet_result == {
        default_account.address: football_bets_draw_unresolved
    }

    resolve_successful_bet_result = contract.resolve_bet(
        args=["2024-06-20_denmark_england"],
        wait_interval=10000,
        wait_retries=15,
    )
    assert tx_execution_succeeded(resolve_successful_bet_result)

    get_bet_result = contract.get_bets(args=[])
    assert get_bet_result == {default_account.address: football_bets_draw_resolved}

    get_points_result = contract.get_points(args=[])
    assert get_points_result == {default_account.address: 1}

    get_player_points_result = contract.get_player_points(
        args=[default_account.address]
    )
    assert get_player_points_result == 1


@pytest.mark.integration
def test_football_bets_unsuccess():
    contract = load_fixture(deploy_contract)

    create_bet_result = contract.create_bet(args=["2024-06-20", "Spain", "Italy", "2"])
    assert tx_execution_succeeded(create_bet_result)

    get_bet_result = contract.get_bets(args=[])
    assert get_bet_result == {
        default_account.address: football_bets_unsuccess_unresolved
    }

    resolve_successful_bet_result = contract.resolve_bet(
        args=["2024-06-20_spain_italy"],
        wait_interval=10000,
        wait_retries=15,
    )
    assert tx_execution_succeeded(resolve_successful_bet_result)

    get_bet_result = contract.get_bets(args=[])
    assert get_bet_result == {
        default_account.address: football_bets_unsuccess_resolved
    }

    get_points_result = contract.get_points(args=[])
    assert get_points_result == {}

    get_player_points_result = contract.get_player_points(
        args=[default_account.address]
    )
    assert get_player_points_result == 0
