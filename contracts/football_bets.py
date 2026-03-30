# { "Depends": "py-genlayer:test" }

import json
from dataclasses import dataclass
from genlayer import *


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

    def _check_match(
        self,
        resolution_url: str,
        team1: str,
        team2: str
    ) -> dict:
        def get_match_result() -> str:
            web_data = gl.nondet.web.render(
                resolution_url,
                mode="text"
            )

            task = f"""
Extract the match result for:
Team 1: {team1}
Team 2: {team2}

Web content:
{web_data}

Respond in JSON:
{{
    "score": str,
    "winner": int
}}
Only return valid JSON without any extra text.
"""

            result = gl.nondet.exec_prompt(
                task,
                response_format="json"
            )
            return json.dumps(result, sort_keys=True)

        result_json = json.loads(
            gl.eq_principle.strict_eq(get_match_result)
        )
        return result_json

    @gl.public.write
    def create_bet(
        self,
        game_date: str,
        team1: str,
        team2: str,
        predicted_winner: str
    ) -> None:
        match_resolution_url = (
            "https://www.bbc.com/sport/football/scores-fixtures/"
            + game_date
        )

        sender = gl.message.sender_address
        bet_id = f"{game_date}_{team1}_{team2}".lower()

        if sender in self.bets and bet_id in self.bets[sender]:
            raise Exception("Bet already created")

        bet = Bet(
            id=bet_id,
            has_resolved=False,
            game_date=game_date,
            resolution_url=match_resolution_url,
            team1=team1,
            team2=team2,
            predicted_winner=predicted_winner,
            real_winner="",
            real_score=""
        )

        self.bets.get_or_insert_default(sender)[bet_id] = bet

    @gl.public.write
    def resolve_bet(self, bet_id: str) -> None:
        sender = gl.message.sender_address

        # Ensure caller owns the bet and the bet exists
        if sender not in self.bets or bet_id not in self.bets[sender]:
            raise Exception("Bet not found or not owned by caller")

        bet = self.bets[sender][bet_id]

        if bet.has_resolved:
            raise Exception("Bet already resolved")

        bet_status = self._check_match(
            bet.resolution_url,
            bet.team1,
            bet.team2
        )

        if int(bet_status["winner"]) < 0:
            raise Exception("Game not finished")

        bet.has_resolved = True
        bet.real_winner = str(bet_status["winner"])
        bet.real_score = bet_status["score"]

        if bet.real_winner == bet.predicted_winner:
            if sender not in self.points:
                self.points[sender] = 0

            self.points[sender] += 1

    @gl.public.view
    def get_bets(self) -> dict:
        return {
            k.as_hex: v
            for k, v in self.bets.items()
        }

    @gl.public.view
    def get_points(self) -> dict:
        return {
            k.as_hex: v
            for k, v in self.points.items()
        }

    @gl.public.view
    def get_player_points(self, player_address: str) -> int:
        return self.points.get(
            Address(player_address),
            0
        )