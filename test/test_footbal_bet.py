import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from contracts.football_bets import FootballBets, Bet, Address, gl


@pytest.fixture
def contract():
    return FootballBets()


@pytest.fixture
def user():
    return Address("0x123")


def setup_bet(contract, user, predicted="1"):
    bet_id = "2024-06-20_spain_italy"

    contract.bets[user] = {
        bet_id: Bet(
            id=bet_id,
            has_resolved=False,
            game_date="2024-06-20",
            resolution_url="url",
            team1="Spain",
            team2="Italy",
            predicted_winner=predicted,
            real_winner="",
            real_score=""
        )
    }

    return bet_id


# ✅ Test: menang (correct prediction)
def test_success_win(contract, user, mocker):
    bet_id = setup_bet(contract, user, predicted="1")

    mocker.patch.object(
        contract,
        "_check_match",
        return_value={"winner": 1, "score": "2-1"}
    )

    gl.message.sender_address = user

    contract.resolve_bet(bet_id)

    assert contract.bets[user][bet_id].has_resolved is True
    assert contract.points[user] == 1


# ✅ Test: draw (0)
def test_draw_success(contract, user, mocker):
    bet_id = setup_bet(contract, user, predicted="0")

    mocker.patch.object(
        contract,
        "_check_match",
        return_value={"winner": 0, "score": "1-1"}
    )

    gl.message.sender_address = user

    contract.resolve_bet(bet_id)

    assert contract.points[user] == 1


# ❌ Test: kalah (prediction salah)
def test_unsuccess(contract, user, mocker):
    bet_id = setup_bet(contract, user, predicted="2")

    mocker.patch.object(
        contract,
        "_check_match",
        return_value={"winner": 1, "score": "2-1"}
    )

    gl.message.sender_address = user

    contract.resolve_bet(bet_id)

    assert user not in contract.points


# 🔒 Test: bukan owner
def test_not_owner(contract, user):
    other = Address("0x999")

    bet_id = setup_bet(contract, user)

    gl.message.sender_address = other

    with pytest.raises(Exception):
        contract.resolve_bet(bet_id)


# 🧨 Test: invalid AI response (schema validation)
def test_invalid_result(contract, user, mocker):
    bet_id = setup_bet(contract, user)

    mocker.patch.object(
        contract,
        "_check_match",
        return_value={"score": 123}  # invalid schema
    )

    gl.message.sender_address = user

    with pytest.raises(Exception):
        contract.resolve_bet(bet_id)