from gltest import get_contract_factory, default_account
from gltest.helpers import load_fixture
from gltest.assertions import tx_execution_succeeded
from test.football_bets_get_contract_schema_for_code import (
    test_football_bets_win_resolved,
    test_football_bets_win_unresolved,
    test_football_bets_draw_unresolved,
    test_football_bets_draw_resolved,
    test_football_bets_unsuccess_unresolved,
    test_football_bets_unsuccess_resolved,
)


def deploy_contract():
    factory = get_contract_factory("FootballBets")
    contract = factory.deploy()

    # Get Initial State
    contract_all_points_state = contract.get_points(args=[])
    assert contract_all_points_state == {}

    contract_all_bets_state = contract.get_bets(args=[])
    assert contract_all_bets_state == {}
    return contract


def test_football_bets_success_win():
    # Contract Deploy

    contract = load_fixture(deploy_contract)

    # Create Successful Bet
    create_bet_result = contract.create_bet(args=["2024-06-20", "Spain", "Italy", "1"])
    assert tx_execution_succeeded(create_bet_result)

    # Get Bets
    get_bet_result = contract.get_bets(args=[])
    assert get_bet_result == {
        default_account.address: test_football_bets_win_unresolved
    }

    # Resolve Successful Bet
    resolve_successful_bet_result = contract.resolve_bet(
        args=["2024-06-20_spain_italy"],
        wait_interval=10000,  # 10000 ms = 10 seconds
        wait_retries=15,
    )
    assert tx_execution_succeeded(resolve_successful_bet_result)

    # Get Bets
    get_bet_result = contract.get_bets(args=[])
    assert get_bet_result == {default_account.address: test_football_bets_win_resolved}

    # Get Points
    get_points_result = contract.get_points(args=[])
    assert get_points_result == {default_account.address: 1}

    # Get Player Points
    get_player_points_result = contract.get_player_points(
        args=[default_account.address]
    )
    assert get_player_points_result == 1


def test_football_bets_draw_success():
    # Contract Deploy
    contract = load_fixture(deploy_contract)

    # Create Successful Bet
    create_bet_result = contract.create_bet(
        args=["2024-06-20", "Denmark", "England", "0"]
    )
    assert tx_execution_succeeded(create_bet_result)

    # Get Bets
    get_bet_result = contract.get_bets(args=[])
    assert get_bet_result == {
        default_account.address: test_football_bets_draw_unresolved
    }

    # Resolve Successful Bet
    resolve_successful_bet_result = contract.resolve_bet(
        args=["2024-06-20_denmark_england"],
        wait_interval=10000,  # 10000 ms = 10 seconds
        wait_retries=15,
    )
    assert tx_execution_succeeded(resolve_successful_bet_result)

    # Get Bets
    get_bet_result = contract.get_bets(args=[])
    assert get_bet_result == {default_account.address: test_football_bets_draw_resolved}

    # Get Points
    get_points_result = contract.get_points(args=[])
    assert get_points_result == {default_account.address: 1}

    # Get Player Points
    get_player_points_result = contract.get_player_points(
        args=[default_account.address]
    )
    assert get_player_points_result == 1


def test_football_bets_unsuccess():
    # Contract Deploy
    contract = load_fixture(deploy_contract)

    # Create Successful Bet
    create_bet_result = contract.create_bet(args=["2024-06-20", "Spain", "Italy", "2"])
    assert tx_execution_succeeded(create_bet_result)

    # Get Bets
    get_bet_result = contract.get_bets(args=[])
    assert get_bet_result == {
        default_account.address: test_football_bets_unsuccess_unresolved
    }

    # Resolve Successful Bet
    resolve_successful_bet_result = contract.resolve_bet(
        args=["2024-06-20_spain_italy"],
        wait_interval=10000,  # 10000 ms = 10 seconds
        wait_retries=15,
    )
    assert tx_execution_succeeded(resolve_successful_bet_result)

    # Get Bets
    get_bet_result = contract.get_bets(args=[])
    assert get_bet_result == {
        default_account.address: test_football_bets_unsuccess_resolved
    }

    # Get Points
    get_points_result = contract.get_points(args=[])
    assert get_points_result == {}

    # Get Player Points
    get_player_points_result = contract.get_player_points(
        args=[default_account.address]
    )
    assert get_player_points_result == 0
