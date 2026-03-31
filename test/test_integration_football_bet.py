import pytest
from contracts.football_bets import FootballBets, Address, gl


def test_resolve_bet_integration():
    contract = FootballBets()

    user = Address("0x123")
    gl.message.sender_address = user

    bet_id = "2024-06-20_spain_italy"

    # gunakan function real (bukan inject manual)
    contract.place_bet(bet_id, "1")

    # mock AI response biar deterministic
    contract._check_match = lambda *args, **kwargs: {
        "winner": 1,
        "score": "2-1"
    }

    contract.resolve_bet(bet_id)

    assert contract.bets[user][bet_id].has_resolved is True
    assert contract.points[user] == 1