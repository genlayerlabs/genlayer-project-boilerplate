# { "Depends": "py-genlayer:9b8kjyda2ycxyq4ea6g4yfpnydxhd52gqba5rb8dw7krkh5mn9p0" }

import datetime
import json
from dataclasses import dataclass
import genlayer as gl
from genlayer.storage import allow as allow_storage

_ASCII_DIGITS = frozenset("0123456789")
_DATE_SEPARATORS = frozenset("Tt ")
_MINUTES_PER_DAY = 24 * 60

_UNREADABLE = -1
"""Sentinel for a timestamp that could not be read, returned instead of raising."""


def _is_iso_date(value: str) -> bool:
    """True iff `value` is exactly an ASCII `YYYY-MM-DD` date.

    `datetime.date.fromisoformat` also accepts the basic `YYYYMMDD` form, so the
    accepted spelling of a fixture is pinned here rather than left to the parser.
    """
    if len(value) != 10 or value[4] != "-" or value[7] != "-":
        return False
    digits = value[0:4] + value[5:7] + value[8:10]
    return all(char in _ASCII_DIGITS for char in digits)


def _midnight_minutes(date: datetime.date) -> int:
    """Midnight UTC on `date`, as whole minutes from a fixed epoch."""
    return date.toordinal() * _MINUTES_PER_DAY


def _utc_minutes_of(timestamp: str) -> int:
    """`timestamp` as whole minutes from that epoch in UTC, else `_UNREADABLE`.

    RFC 3339 permits a UTC offset and the message spec does not pin one, so the
    date the VM writes is not necessarily the UTC date: `2024-06-19T20:00:00-05:00`
    is already 2024-06-20 in UTC. Passing an explicit target zone keeps
    `astimezone` pure arithmetic; a naive value is read as UTC instead, since
    `astimezone` would otherwise resolve it against the host's local zone.
    """
    if len(timestamp) > 10 and timestamp[10] not in _DATE_SEPARATORS:
        # `fromisoformat` takes any single separator character; RFC 3339 does not.
        return _UNREADABLE
    if timestamp.endswith("z"):
        # RFC 3339 allows a lower-case designator; `fromisoformat` does not.
        timestamp = timestamp[:-1] + "Z"

    try:
        moment = datetime.datetime.fromisoformat(timestamp)
    except ValueError:
        return _UNREADABLE

    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=datetime.timezone.utc)
    moment = moment.astimezone(datetime.timezone.utc)

    return _midnight_minutes(moment.date()) + moment.hour * 60 + moment.minute


@allow_storage
@dataclass
class Bet:
    id: str
    has_resolved: bool
    game_date: str
    resolution_url: str
    team1: str
    team2: str
    predicted_winner: str
    real_winner: str
    real_score: str


class FootballBets(gl.contract.Contract):
    bets: gl.storage.TreeMap[gl.Address, gl.storage.TreeMap[str, Bet]]
    points: gl.storage.TreeMap[gl.Address, gl.u256]

    def __init__(self):
        pass

    def _check_match(self, resolution_url: str, team1: str, team2: str) -> dict:
        def get_match_result() -> str:
            web_data = gl.nondet.web.render(resolution_url, mode="text")

            task = f"""
Extract the match result for:
Team 1: {team1}
Team 2: {team2}

Web content:
{web_data}

Respond in JSON:
{{
    "score": str, // e.g., "1:2" or "-" if unresolved
    "winner": int // 0 for draw, 1 if Team 1 won, 2 if Team 2 won, -1 if unresolved
}}
It is mandatory that you respond only using the JSON format above,
nothing else. Don't include any other words or characters,
your output must be only JSON without any formatting prefix or suffix.
This result should be perfectly parsable by a JSON parser without errors.
        """
            result = gl.nondet.exec_prompt(task, response_format="json")
            return json.dumps(result, sort_keys=True)

        result_json = json.loads(gl.eq_principle.strict_eq(get_match_result))
        return result_json

    def _assert_betting_open(self, game_date: str) -> None:
        """Reject a bet placed on or after the day of the fixture.

        Day granularity is all the existing interface offers: `game_date` is a
        bare date, no kickoff time is accepted or stored anywhere, and `bet_id`
        identifies a fixture by date and teams alone. Closing bets at the start
        of the match day is therefore the latest deadline that is still
        certainly pre-match for every fixture the oracle page lists for that
        date.

        `gl.message.raw["datetime"]` is the transaction time supplied by
        consensus, so the deadline is enforced without any non-deterministic
        call: `create_bet` stays deterministic and cheap. Both sides are reduced
        to a minute count so that the offset the VM may have written is handled
        by subtraction, with no date rollover to special-case.
        """
        if not _is_iso_date(game_date):
            raise gl.vm.UserError("Invalid game date, expected YYYY-MM-DD")
        try:
            kickoff_day = datetime.date.fromisoformat(game_date)
        except ValueError:
            raise gl.vm.UserError("Invalid game date, expected YYYY-MM-DD")

        now = _utc_minutes_of(gl.message.raw["datetime"])
        if now == _UNREADABLE:
            raise gl.vm.UserError("Invalid transaction time")

        if now >= _midnight_minutes(kickoff_day):
            raise gl.vm.UserError("Betting closed for this game")

    @gl.public.write
    def create_bet(
        self, game_date: str, team1: str, team2: str, predicted_winner: str
    ) -> None:
        self._assert_betting_open(game_date)

        match_resolution_url = (
            "https://www.bbc.com/sport/football/scores-fixtures/" + game_date
        )

        sender_address = gl.message.sender_address

        bet_id = f"{game_date}_{team1}_{team2}".lower()
        if sender_address in self.bets and bet_id in self.bets[sender_address]:
            raise gl.vm.UserError("Bet already created")

        bet = Bet(
            id=bet_id,
            has_resolved=False,
            game_date=game_date,
            resolution_url=match_resolution_url,
            team1=team1,
            team2=team2,
            predicted_winner=predicted_winner,
            real_winner="",
            real_score="",
        )
        self.bets.get_or_insert_default(sender_address)[bet_id] = bet

    @gl.public.write
    def resolve_bet(self, bet_id: str) -> None:
        if self.bets[gl.message.sender_address][bet_id].has_resolved:
            raise gl.vm.UserError("Bet already resolved")

        bet = self.bets[gl.message.sender_address][bet_id]
        bet_status = self._check_match(bet.resolution_url, bet.team1, bet.team2)

        winner = int(bet_status["winner"])
        if winner < 0:
            raise gl.vm.UserError("Game not finished")
        # The prompt defines the full accepted value space: 0 = draw,
        # 1 = team1, 2 = team2 (and -1 = unresolved, handled above).
        # Reject anything outside it so a malformed extraction can never be
        # stored or scored against a prediction.
        if winner > 2:
            raise gl.vm.UserError("Invalid match result")

        bet.has_resolved = True
        bet.real_winner = str(bet_status["winner"])
        bet.real_score = bet_status["score"]

        if bet.real_winner == bet.predicted_winner:
            if gl.message.sender_address not in self.points:
                self.points[gl.message.sender_address] = 0
            self.points[gl.message.sender_address] += 1

    @gl.public.view
    def get_bets(self) -> dict:
        return {k.as_hex: v for k, v in self.bets.items()}

    @gl.public.view
    def get_points(self) -> dict:
        return {k.as_hex: v for k, v in self.points.items()}

    @gl.public.view
    def get_player_points(self, player_address: str) -> int:
        return self.points.get(gl.Address(player_address), 0)
