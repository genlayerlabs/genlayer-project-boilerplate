# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from dataclasses import dataclass
from genlayer import *
import genlayer.gl.vm as glvm


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


class FootballBets(gl.Contract):
    bets: TreeMap[Address, TreeMap[str, Bet]]
    points: TreeMap[Address, u256]

    def __init__(self):
        pass

    def _create_bet_id(self, game_date: str, team1: str, team2: str) -> str:
        return f"{game_date}_{team1}_{team2}".lower()

    def _normalized_team_name(self, team_name: str) -> str:
        return " ".join(team_name.split())

    def _validate_create_bet(
        self, game_date: str, team1: str, team2: str, predicted_winner: str
    ):
        normalized_team1 = self._normalized_team_name(team1)
        normalized_team2 = self._normalized_team_name(team2)

        if not game_date.strip():
            raise Exception("Game date is required")
        if not normalized_team1:
            raise Exception("Team 1 name is required")
        if not normalized_team2:
            raise Exception("Team 2 name is required")
        if normalized_team1.lower() == normalized_team2.lower():
            raise Exception("Teams must be different")
        if predicted_winner not in ("0", "1", "2"):
            raise Exception("Predicted winner must be 0, 1, or 2")

        return normalized_team1, normalized_team2

    def _normalize_match_status(self, raw_result) -> dict:
        if not isinstance(raw_result, dict):
            raise Exception("LLM response must be a JSON object")

        score = raw_result.get("score")
        winner = raw_result.get("winner")

        normalized_score = "-" if score is None else str(score).strip()

        try:
            normalized_winner = int(str(winner).strip())
        except Exception as exc:
            raise Exception("Winner must be -1, 0, 1, or 2") from exc

        if normalized_winner not in (-1, 0, 1, 2):
            raise Exception("Winner must be -1, 0, 1, or 2")

        if normalized_winner == -1 and normalized_score == "":
            normalized_score = "-"

        return {
            "score": normalized_score,
            "winner": normalized_winner,
        }

    def _fetch_match_result(self, resolution_url: str, team1: str, team2: str) -> str:
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
    "winner": int // 1 for team 1, 2 for team 2, 0 for draw, -1 if unresolved
}}
It is mandatory that you respond only using the JSON format above,
nothing else. Don't include any other words or characters,
your output must be only JSON without any formatting prefix or suffix.
This result should be perfectly parsable by a JSON parser without errors.
        """
        result = gl.nondet.exec_prompt(task, response_format="json")
        normalized_result = self._normalize_match_status(result)
        return json.dumps(normalized_result, sort_keys=True)

    def _check_match(self, resolution_url: str, team1: str, team2: str) -> dict:
        def leader() -> str:
            return self._fetch_match_result(resolution_url, team1, team2)

        def validator(result: glvm.Result) -> bool:
            if not isinstance(result, glvm.Return):
                return False

            try:
                validator_result = self._fetch_match_result(
                    resolution_url, team1, team2
                )
            except Exception:
                return False

            return validator_result == result.calldata

        agreed_result = glvm.run_nondet_unsafe.lazy(leader, validator).get()
        return json.loads(agreed_result)

    @gl.public.write
    def create_bet(
        self, game_date: str, team1: str, team2: str, predicted_winner: str
    ) -> None:
        normalized_team1, normalized_team2 = self._validate_create_bet(
            game_date, team1, team2, predicted_winner
        )
        match_resolution_url = (
            "https://www.bbc.com/sport/football/scores-fixtures/" + game_date
        )

        sender_address = gl.message.sender_address

        bet_id = self._create_bet_id(game_date, normalized_team1, normalized_team2)
        if sender_address in self.bets and bet_id in self.bets[sender_address]:
            raise Exception("Bet already created")

        bet = Bet(
            id=bet_id,
            has_resolved=False,
            game_date=game_date,
            resolution_url=match_resolution_url,
            team1=normalized_team1,
            team2=normalized_team2,
            predicted_winner=predicted_winner,
            real_winner="",
            real_score="",
        )
        self.bets.get_or_insert_default(sender_address)[bet_id] = bet

    @gl.public.write
    def resolve_bet(self, bet_id: str) -> None:
        sender_address = gl.message.sender_address

        if sender_address not in self.bets or bet_id not in self.bets[sender_address]:
            raise Exception("Bet not found")

        if self.bets[sender_address][bet_id].has_resolved:
            raise Exception("Bet already resolved")

        bet = self.bets[sender_address][bet_id]
        bet_status = self._check_match(bet.resolution_url, bet.team1, bet.team2)

        if int(bet_status["winner"]) < 0:
            raise Exception("Game not finished")

        bet.has_resolved = True
        bet.real_winner = str(bet_status["winner"])
        bet.real_score = bet_status["score"]

        if bet.real_winner == bet.predicted_winner:
            if sender_address not in self.points:
                self.points[sender_address] = 0
            self.points[sender_address] += 1

    @gl.public.view
    def get_bets(self) -> dict:
        return {k.as_hex: v for k, v in self.bets.items()}

    @gl.public.view
    def get_points(self) -> dict:
        return {k.as_hex: v for k, v in self.points.items()}

    @gl.public.view
    def get_player_points(self, player_address: str) -> int:
        return self.points.get(Address(player_address), 0)
