"""Tests for read-only view methods."""

import json

from tests.direct.conftest import to_hex


def test_empty_bets(direct_deploy):
    contract = direct_deploy("contracts/football_bets.py")
    assert contract.get_bets() == {}


def test_empty_points(direct_deploy):
    contract = direct_deploy("contracts/football_bets.py")
    assert contract.get_points() == {}


def test_get_player_points_default_zero(direct_deploy, direct_alice):
    contract = direct_deploy("contracts/football_bets.py")
    alice = to_hex(direct_alice)
    assert contract.get_player_points(alice) == 0


def test_points_accumulate(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/football_bets.py")
    direct_vm.sender = direct_alice
    alice = to_hex(direct_alice)

    # Create and resolve two winning bets
    contract.create_bet("2024-06-20", "Spain", "Italy", "1")
    contract.create_bet("2024-06-20", "Denmark", "England", "0")

    # Mock for first match
    direct_vm.mock_web(
        r".*bbc\.com/sport/football/scores-fixtures.*",
        {"status": 200, "body": "Match results available."},
    )
    direct_vm.mock_llm(
        r".*Extract the match result.*",
        json.dumps({"score": "1:0", "winner": 1}),
    )
    contract.resolve_bet("2024-06-20_spain_italy")

    # Update mock for second match
    direct_vm.clear_mocks()
    direct_vm.mock_web(
        r".*bbc\.com/sport/football/scores-fixtures.*",
        {"status": 200, "body": "Match results available."},
    )
    direct_vm.mock_llm(
        r".*Extract the match result.*",
        json.dumps({"score": "1:1", "winner": 0}),
    )
    contract.resolve_bet("2024-06-20_denmark_england")

    assert contract.get_player_points(alice) == 2

    points = contract.get_points()
    assert points[alice] == 2
