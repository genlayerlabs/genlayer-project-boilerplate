import pytest

pytestmark = pytest.mark.direct


def test_create_bet_rejects_invalid_winner(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/football_bets.py")
    direct_vm.sender = direct_alice

    with direct_vm.expect_revert("Predicted winner must be 0, 1, or 2"):
        contract.create_bet("2024-06-20", "Spain", "Italy", "3")


def test_create_bet_rejects_duplicate_match(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/football_bets.py")
    direct_vm.sender = direct_alice

    contract.create_bet("2024-06-20", "Spain", "Italy", "1")

    with direct_vm.expect_revert("Bet already created"):
        contract.create_bet("2024-06-20", "Spain", "Italy", "1")


def test_create_bet_rejects_same_team(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/football_bets.py")
    direct_vm.sender = direct_alice

    with direct_vm.expect_revert("Teams must be different"):
        contract.create_bet("2024-06-20", "Spain", "Spain", "1")


def test_resolve_bet_rejects_unknown_bet(direct_vm, direct_deploy, direct_alice):
    contract = direct_deploy("contracts/football_bets.py")
    direct_vm.sender = direct_alice

    with direct_vm.expect_revert("Bet not found"):
        contract.resolve_bet("missing-bet")


def test_resolve_bet_awards_points_and_captures_validator(
    direct_vm, direct_deploy, direct_alice
):
    direct_vm.mock_web(r".*bbc.*", {"status": 200, "body": "Spain 2-1 Italy"})
    direct_vm.mock_llm(r".*", '{"score": "2:1", "winner": 1}')

    contract = direct_deploy("contracts/football_bets.py")
    direct_vm.sender = direct_alice

    contract.create_bet("2024-06-20", "Spain", "Italy", "1")
    contract.resolve_bet("2024-06-20_spain_italy")

    points = contract.get_points()
    assert len(points) == 1
    assert list(points.values())[0] == 1
    assert direct_vm.run_validator() is True


def test_resolve_bet_validator_detects_mismatch(direct_vm, direct_deploy, direct_alice):
    direct_vm.mock_web(r".*bbc.*", {"status": 200, "body": "Spain 2-1 Italy"})
    direct_vm.mock_llm(r".*", '{"score": "2:1", "winner": 1}')

    contract = direct_deploy("contracts/football_bets.py")
    direct_vm.sender = direct_alice

    contract.create_bet("2024-06-20", "Spain", "Italy", "1")
    contract.resolve_bet("2024-06-20_spain_italy")

    direct_vm.clear_mocks()
    direct_vm.mock_web(r".*bbc.*", {"status": 200, "body": "Spain 0-1 Italy"})
    direct_vm.mock_llm(r".*", '{"score": "0:1", "winner": 2}')

    assert direct_vm.run_validator() is False
