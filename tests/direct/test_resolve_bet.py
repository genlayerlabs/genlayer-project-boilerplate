"""Tests for bet resolution — requires web + LLM mocks."""

import json


def _setup_match_mocks(vm, score, winner):
    """Register web and LLM mocks for match resolution."""
    vm.mock_web(
        r".*bbc\.com/sport/football/scores-fixtures.*",
        {"status": 200, "body": f"Match result: {score}. Winner: team {winner}."},
    )
    vm.mock_llm(
        r".*Extract the match result.*",
        json.dumps({"score": score, "winner": winner}),
    )


def test_resolve_winning_bet(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/football_bets.py")
    direct_vm.sender = direct_alice

    contract.create_bet("2024-06-20", "Spain", "Italy", "1")
    _setup_match_mocks(direct_vm, "1:0", 1)

    contract.resolve_bet("2024-06-20_spain_italy")

    bets = contract.get_bets()
    bet = bets[direct_alice.as_hex]["2024-06-20_spain_italy"]
    assert bet.has_resolved is True
    assert bet.real_winner == "1"
    assert bet.real_score == "1:0"

    assert contract.get_player_points(direct_alice.as_hex) == 1


def test_resolve_losing_bet_no_points(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/football_bets.py")
    direct_vm.sender = direct_alice

    contract.create_bet("2024-06-20", "Spain", "Italy", "2")
    _setup_match_mocks(direct_vm, "1:0", 1)

    contract.resolve_bet("2024-06-20_spain_italy")

    assert contract.get_player_points(direct_alice.as_hex) == 0

    points = contract.get_points()
    assert direct_alice.as_hex not in points


def test_resolve_draw_bet(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/football_bets.py")
    direct_vm.sender = direct_alice

    contract.create_bet("2024-06-20", "Denmark", "England", "0")
    _setup_match_mocks(direct_vm, "1:1", 0)

    contract.resolve_bet("2024-06-20_denmark_england")

    bets = contract.get_bets()
    bet = bets[direct_alice.as_hex]["2024-06-20_denmark_england"]
    assert bet.has_resolved is True
    assert bet.real_winner == "0"
    assert bet.real_score == "1:1"

    assert contract.get_player_points(direct_alice.as_hex) == 1


def test_resolve_already_resolved_fails(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/football_bets.py")
    direct_vm.sender = direct_alice

    contract.create_bet("2024-06-20", "Spain", "Italy", "1")
    _setup_match_mocks(direct_vm, "1:0", 1)

    contract.resolve_bet("2024-06-20_spain_italy")

    with direct_vm.expect_revert("Bet already resolved"):
        contract.resolve_bet("2024-06-20_spain_italy")


def test_resolve_unfinished_game_fails(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/football_bets.py")
    direct_vm.sender = direct_alice

    contract.create_bet("2024-06-20", "Spain", "Italy", "1")
    _setup_match_mocks(direct_vm, "-", -1)

    with direct_vm.expect_revert("Game not finished"):
        contract.resolve_bet("2024-06-20_spain_italy")


def test_multiple_users_resolve_independently(
    direct_vm, direct_deploy, direct_alice, direct_bob
):
    contract = direct_deploy("contracts/football_bets.py")

    # Alice bets on team 1
    direct_vm.sender = direct_alice
    contract.create_bet("2024-06-20", "Spain", "Italy", "1")

    # Bob bets on team 2
    direct_vm.sender = direct_bob
    contract.create_bet("2024-06-20", "Spain", "Italy", "2")

    _setup_match_mocks(direct_vm, "1:0", 1)

    # Alice resolves — she wins
    direct_vm.sender = direct_alice
    contract.resolve_bet("2024-06-20_spain_italy")
    assert contract.get_player_points(direct_alice.as_hex) == 1

    # Bob resolves — he loses
    direct_vm.sender = direct_bob
    contract.resolve_bet("2024-06-20_spain_italy")
    assert contract.get_player_points(direct_bob.as_hex) == 0
