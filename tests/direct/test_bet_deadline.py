"""Regression tests for F-01 — bets must be placed before the match day.

`create_bet` used to accept any `game_date`, so a player could read a finished
result off the oracle page, create the matching bet and resolve it immediately
for a guaranteed point. The deadline is now enforced deterministically from
`gl.message.raw["datetime"]` (the consensus-supplied transaction time, normalised
to UTC), so `create_bet` still makes no non-deterministic call.

Direct mode injects the transaction time into the contract when it is deployed,
so `direct_vm.warp()` must be called *before* `direct_deploy()`.
"""

import pytest

from tests.direct.conftest import PRE_MATCH_CLOCK, mock_json_llm, to_hex

GAME_DATE = "2024-06-20"

# Same calendar day as GAME_DATE, after full time.
AFTER_FULL_TIME_CLOCK = "2024-06-20T22:00:00Z"

# Days after GAME_DATE.
LONG_AFTER_CLOCK = "2024-07-01T09:00:00Z"


def _mock_finished_match(vm, score, winner):
    """Mock the oracle reporting a finished match."""
    vm.mock_web(
        r".*bbc\.com/sport/football/scores-fixtures.*",
        {"status": 200, "body": f"Full time. Score {score}."},
    )
    mock_json_llm(
        vm,
        r".*Extract the match result.*",
        {"score": score, "winner": winner},
    )


# ─────────────────────────────────────────────────────────────────────────────
# The exploit: bet on a result you already know
# ─────────────────────────────────────────────────────────────────────────────


def test_cannot_create_bet_once_match_day_has_started(
    direct_vm, direct_deploy, direct_alice
):
    """The audit's F-01 chain: known result -> create_bet -> resolve -> point."""
    direct_vm.warp(AFTER_FULL_TIME_CLOCK)
    contract = direct_deploy("contracts/football_bets.py")
    direct_vm.sender = direct_alice
    alice = to_hex(direct_alice)

    # Alice has already read the full-time result off the oracle page.
    _mock_finished_match(direct_vm, "1:0", 1)

    with direct_vm.expect_revert("Betting closed for this game"):
        contract.create_bet(GAME_DATE, "Spain", "Italy", "1")

    assert contract.get_bets() == {}
    assert contract.get_player_points(alice) == 0


def test_cannot_create_bet_days_after_the_match(
    direct_vm, direct_deploy, direct_alice
):
    direct_vm.warp(LONG_AFTER_CLOCK)
    contract = direct_deploy("contracts/football_bets.py")
    direct_vm.sender = direct_alice

    with direct_vm.expect_revert("Betting closed for this game"):
        contract.create_bet(GAME_DATE, "Spain", "Italy", "1")


def test_post_hoc_bet_cannot_be_resolved(direct_vm, direct_deploy, direct_alice):
    """No bet is stored, so the resolve half of the exploit has nothing to score."""
    direct_vm.warp(AFTER_FULL_TIME_CLOCK)
    contract = direct_deploy("contracts/football_bets.py")
    direct_vm.sender = direct_alice
    alice = to_hex(direct_alice)

    _mock_finished_match(direct_vm, "1:0", 1)

    with direct_vm.expect_revert("Betting closed for this game"):
        contract.create_bet(GAME_DATE, "Spain", "Italy", "1")

    with direct_vm.expect_revert():
        contract.resolve_bet("2024-06-20_spain_italy")

    assert contract.get_player_points(alice) == 0


# ─────────────────────────────────────────────────────────────────────────────
# Legitimate pre-match betting still works
# ─────────────────────────────────────────────────────────────────────────────


def test_pre_match_bet_is_accepted_and_resolves(
    direct_vm, direct_deploy, direct_alice
):
    direct_vm.warp(PRE_MATCH_CLOCK)
    contract = direct_deploy("contracts/football_bets.py")
    direct_vm.sender = direct_alice
    alice = to_hex(direct_alice)

    contract.create_bet(GAME_DATE, "Spain", "Italy", "1")

    bet = contract.get_bets()[alice]["2024-06-20_spain_italy"]
    assert bet.has_resolved is False

    _mock_finished_match(direct_vm, "1:0", 1)
    contract.resolve_bet("2024-06-20_spain_italy")

    assert contract.get_player_points(alice) == 1


def test_bet_on_a_far_future_fixture_is_accepted(
    direct_vm, direct_deploy, direct_alice
):
    direct_vm.warp(PRE_MATCH_CLOCK)
    contract = direct_deploy("contracts/football_bets.py")
    direct_vm.sender = direct_alice
    alice = to_hex(direct_alice)

    contract.create_bet("2030-01-15", "Denmark", "England", "0")

    assert "2030-01-15_denmark_england" in contract.get_bets()[alice]


def test_create_bet_makes_no_nondeterministic_call(
    direct_vm, direct_deploy, direct_alice
):
    """No web/LLM mock is registered: a nondet call would raise MockNotFoundError."""
    direct_vm.warp(PRE_MATCH_CLOCK)
    contract = direct_deploy("contracts/football_bets.py")
    direct_vm.sender = direct_alice
    alice = to_hex(direct_alice)

    contract.create_bet(GAME_DATE, "Spain", "Italy", "1")

    assert "2024-06-20_spain_italy" in contract.get_bets()[alice]


# ─────────────────────────────────────────────────────────────────────────────
# The deadline must be computable, or the bet is refused
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    "game_date",
    [
        "",
        "20240620",
        "2024-6-20",
        "2024-06-20 ",
        " 2024-06-20",
        "not-a-date",
        "2024-06-20T00:00:00Z",
        "٩٩٩٩-٠١-٠١",  # Arabic-Indic digits
    ],
)
def test_game_date_without_a_computable_deadline_is_rejected(
    direct_vm, direct_deploy, direct_alice, game_date
):
    """The deadline comparison is only sound for a strict ASCII YYYY-MM-DD."""
    direct_vm.warp(PRE_MATCH_CLOCK)
    contract = direct_deploy("contracts/football_bets.py")
    direct_vm.sender = direct_alice

    with direct_vm.expect_revert("Invalid game date"):
        contract.create_bet(game_date, "Spain", "Italy", "1")

    assert contract.get_bets() == {}


# ─────────────────────────────────────────────────────────────────────────────
# The deadline is measured in UTC, whatever offset the VM writes
# ─────────────────────────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    ("clock", "utc_date", "next_date"),
    [
        pytest.param("2024-06-20T12:00:00Z", "2024-06-20", "2024-06-21", id="zulu"),
        pytest.param(
            "2024-06-20T12:00:00z", "2024-06-20", "2024-06-21", id="lowercase-zulu"
        ),
        pytest.param(
            "2024-06-20t12:00:00Z",
            "2024-06-20",
            "2024-06-21",
            id="lowercase-separator",
        ),
        pytest.param(
            "2024-06-20T12:00:00+00:00", "2024-06-20", "2024-06-21", id="zero-offset"
        ),
        pytest.param(
            "2024-06-20T12:00:00.123456Z",
            "2024-06-20",
            "2024-06-21",
            id="fractional-seconds",
        ),
        pytest.param(
            "2024-06-20T12:00:00", "2024-06-20", "2024-06-21", id="naive-read-as-utc"
        ),
        pytest.param("2024-06-20", "2024-06-20", "2024-06-21", id="date-only"),
        pytest.param(
            "2024-06-19T20:00:00-05:00",
            "2024-06-20",
            "2024-06-21",
            id="negative-offset-rolls-forward",
        ),
        pytest.param(
            "2024-06-19T20:00:00-0500",
            "2024-06-20",
            "2024-06-21",
            id="compact-negative-offset",
        ),
        pytest.param(
            "2024-06-20T01:00:00+02:00",
            "2024-06-19",
            "2024-06-20",
            id="positive-offset-rolls-back",
        ),
        pytest.param(
            "2024-06-30T20:00:00-05:00",
            "2024-07-01",
            "2024-07-02",
            id="month-rollover",
        ),
        pytest.param(
            "2024-12-31T20:00:00-05:00",
            "2025-01-01",
            "2025-01-02",
            id="year-rollover",
        ),
        pytest.param(
            "2024-03-01T01:00:00+02:00",
            "2024-02-29",
            "2024-03-01",
            id="leap-day-rollback",
        ),
        pytest.param(
            "2023-03-01T01:00:00+02:00",
            "2023-02-28",
            "2023-03-01",
            id="non-leap-rollback",
        ),
    ],
)
def test_deadline_uses_the_utc_date_of_the_transaction(
    direct_vm, direct_deploy, direct_alice, clock, utc_date, next_date
):
    """RFC 3339 allows a UTC offset, so the written date is not always the UTC date.

    Each case pins the boundary from both sides: a fixture on the transaction's
    own UTC day is closed, and the following day is still open.
    """
    direct_vm.warp(clock)
    contract = direct_deploy("contracts/football_bets.py")
    direct_vm.sender = direct_alice
    alice = to_hex(direct_alice)

    with direct_vm.expect_revert("Betting closed for this game"):
        contract.create_bet(utc_date, "Spain", "Italy", "1")

    contract.create_bet(next_date, "Spain", "Italy", "1")

    assert f"{next_date}_spain_italy" in contract.get_bets()[alice]


@pytest.mark.parametrize(
    "clock",
    [
        "",
        "not-a-timestamp",
        "2024-06-19X12:00:00Z",
        "2024-06-19T1:00:00Z",
        "2024-06-19T25:00:00Z",
        "2024-06-19T12:60:00Z",
        "2024-06-19T12:00:00+",
        "2024-06-19T12:00:00+9:99",
        "2024-06-19T12:00:00+24:00",
        "2024-02-30T12:00:00Z",  # 2024 is a leap year, but February has 29 days
        "2024-13-01T12:00:00Z",
        "2024-06-00T12:00:00Z",
    ],
)
def test_unusable_transaction_time_fails_closed(
    direct_vm, direct_deploy, direct_alice, clock
):
    """If the deadline cannot be evaluated, creation is refused rather than allowed."""
    direct_vm.warp(clock)
    contract = direct_deploy("contracts/football_bets.py")
    direct_vm.sender = direct_alice

    with direct_vm.expect_revert("Invalid transaction time"):
        contract.create_bet(GAME_DATE, "Spain", "Italy", "1")

    assert contract.get_bets() == {}
