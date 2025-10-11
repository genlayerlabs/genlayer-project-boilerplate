# v0.1.0
# { "Depends": "py-genlayer:latest" }

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
    predicted_winner: str  # "0" = draw, "1" = team1, "2" = team2 (recommended)
    real_winner: str       # stored as string for easy comparison
    real_score: str        # example: "1:2" or "-"


class FootballBets(gl.Contract):
    # Each player -> map[bet_id] = Bet
    bets: TreeMap[Address, TreeMap[str, Bet]]
    # Points for each player
    points: TreeMap[Address, u256]

    def __init__(self):
        # Declaring storage is sufficient; no need for initialization.
        pass

    def _check_match(self, resolution_url: str, team1: str, team2: str) -> dict:
        """
        Returns dict {"score": str, "winner": int}
        winner: 0 = draw; 1 = team1 wins; 2 = team2 wins; -1 = not finished
        """

        def get_match_result() -> dict:
            web_data = gl.nondet.web.render(resolution_url, mode="text")

            task = f"""
Extract the result of the football match between:
Team 1: {team1}
Team 2: {team2}

Web page content:
{web_data}
End of web page content.

Rules:
- If you see phrases like "Kick off" between team names, the match is NOT finished.
- If no numeric score is found, assume NOT finished.

Respond ONLY with JSON:
{{
  "score": "1:2" | "-" ,  // "-" if not finished
  "winner": 0 | 1 | 2 | -1 // 0 = draw, -1 = not finished
}}
""".strip()

            result = (
                gl.nondet.exec_prompt(task)
                .replace("```json", "")
                .replace("```", "")
                .strip()
            )
            return json.loads(result)

        # Normalize using equality principle (as in PredictionMarket)
        result_json = gl.eq_principle.strict_eq(get_match_result)
        return result_json

    @gl.public.write
    def create_bet(
        self, game_date: str, team1: str, team2: str, predicted_winner: str
    ) -> None:
        # BBC scores-fixtures URL
        match_resolution_url = (
            "https://www.bbc.com/sport/football/scores-fixtures/" + game_date
        )

        sender = gl.message.sender_address
        bet_id = f"{game_date}_{team1}_{team2}".lower()

        # Ensure the sender’s bet map exists
        bets_by_sender = self.bets.get_or_insert_default(sender)
        if bet_id in bets_by_sender:
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
            real_score="",
        )
        bets_by_sender[bet_id] = bet

    @gl.public.write
    def resolve_bet(self, bet_id: str) -> None:
        sender = gl.message.sender_address

        # Safely retrieve bet
        bets_by_sender = self.bets.get(sender, None)
        if bets_by_sender is None or bet_id not in bets_by_sender:
            raise Exception("Bet not found")

        bet = bets_by_sender[bet_id]

        if bet.has_resolved:
            raise Exception("Bet already resolved")

        bet_status = self._check_match(bet.resolution_url, bet.team1, bet.team2)

        # winner < 0 => match not finished
        if int(bet_status["winner"]) < 0:
            raise Exception("Game not finished")

        # Save the actual result
        bet.has_resolved = True
        bet.real_winner = str(bet_status["winner"])
        bet.real_score = bet_status["score"]

        # Add 1 point if prediction was correct
        if bet.real_winner == bet.predicted_winner:
            current = self.points.get(sender, u256(0))
            self.points[sender] = current + u256(1)

    @gl.public.view
    def get_bets(self) -> dict:
        # Returns address -> all bets
        return {k.as_hex: v for k, v in self.bets.items()}

    @gl.public.view
    def get_points(self) -> dict:
        # Returns address -> total points
        return {k.as_hex: v for k, v in self.points.items()}

    @gl.public.view
    def get_player_points(self, player_address: str) -> int:
        # Returns points for a specific player
        return int(self.points.get(Address(player_address), u256(0)))
