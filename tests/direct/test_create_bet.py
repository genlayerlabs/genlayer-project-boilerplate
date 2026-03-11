"""Tests for bet creation logic (no mocks needed — create_bet is deterministic)."""


def test_create_bet(direct_vm, direct_deploy, direct_alice, addr):
    contract = direct_deploy("contracts/football_bets.py")
    direct_vm.sender = direct_alice

    contract.create_bet("2024-06-20", "Spain", "Italy", "1")

    bets = contract.get_bets()
    player_bets = bets[addr.alice]
    bet = player_bets["2024-06-20_spain_italy"]
    assert bet.team1 == "Spain"
    assert bet.team2 == "Italy"
    assert bet.predicted_winner == "1"
    assert bet.has_resolved is False
    assert bet.real_winner == ""
    assert bet.real_score == ""
    assert (
        bet.resolution_url
        == "https://www.bbc.com/sport/football/scores-fixtures/2024-06-20"
    )


def test_create_multiple_bets(direct_vm, direct_deploy, direct_alice, addr):
    contract = direct_deploy("contracts/football_bets.py")
    direct_vm.sender = direct_alice

    contract.create_bet("2024-06-20", "Spain", "Italy", "1")
    contract.create_bet("2024-06-20", "Denmark", "England", "0")

    bets = contract.get_bets()
    assert len(bets[addr.alice]) == 2
    assert "2024-06-20_spain_italy" in bets[addr.alice]
    assert "2024-06-20_denmark_england" in bets[addr.alice]


def test_create_duplicate_bet_fails(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/football_bets.py")
    direct_vm.sender = direct_alice

    contract.create_bet("2024-06-20", "Spain", "Italy", "1")

    with direct_vm.expect_revert("Bet already created"):
        contract.create_bet("2024-06-20", "Spain", "Italy", "2")


def test_different_users_can_bet_same_match(
    direct_vm, direct_deploy, direct_alice, direct_bob, addr
):
    contract = direct_deploy("contracts/football_bets.py")

    direct_vm.sender = direct_alice
    contract.create_bet("2024-06-20", "Spain", "Italy", "1")

    direct_vm.sender = direct_bob
    contract.create_bet("2024-06-20", "Spain", "Italy", "2")

    bets = contract.get_bets()
    assert len(bets) == 2
    assert bets[addr.alice]["2024-06-20_spain_italy"].predicted_winner == "1"
    assert bets[addr.bob]["2024-06-20_spain_italy"].predicted_winner == "2"


def test_bet_id_is_lowercase(direct_vm, direct_deploy, direct_alice, addr):
    contract = direct_deploy("contracts/football_bets.py")
    direct_vm.sender = direct_alice

    contract.create_bet("2024-06-20", "Spain", "Italy", "1")

    bets = contract.get_bets()
    assert "2024-06-20_spain_italy" in bets[addr.alice]
