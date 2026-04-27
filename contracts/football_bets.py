# { "Depends": "py-genlayer:test" }

import json
import re
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

    def _validate_bet_input(self, game_date: str, team1: str, team2: str, predicted_winner: str):
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", game_date):
            raise Exception(f"Invalid date format: {game_date}. Expected YYYY-MM-DD.")
        if team1.strip().lower() == team2.strip().lower():
            raise Exception("Team 1 and Team 2 cannot be the same.")
        if predicted_winner not in ["0", "1", "2"]:
            raise Exception("Use '1' for Team 1, '2' for Team 2, or '0' for Draw.")

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
    "winner": int // 0 for draw, -1 if unresolved
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

    @gl.public.write
   # { "Depends": "py-genlayer:test" }

import json
import re
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
    predicted_winner: str # "1", "2", or "0" (draw)
    real_winner: str
    real_score: str

class FootballBets(gl.Contract):
    bets: TreeMap[Address, TreeMap[str, Bet]]
    points: TreeMap[Address, u256]

    def __init__(self):
        pass

    def _validate_bet_input(self, game_date: str, team1: str, team2: str, predicted_winner: str):
        """
        Sophisticated validation for bet creation.
        """
        # 1. Validate Date Format (YYYY-MM-DD)
        if not re.match(r"^\d{4}-\d{2}-\d{2}$", game_date):
            raise Exception(f"Invalid date format: {game_date}. Expected YYYY-MM-DD.")

        # 2. Prevent same-team betting
        if team1.strip().lower() == team2.strip().lower():
            raise Exception("Team 1 and Team 2 cannot be the same.")

        # 3. Ensure names are not just whitespace
        if len(team1.strip()) < 2 or len(team2.strip()) < 2:
            raise Exception("Team names must be at least 2 characters long.")

        # 4. Validate predicted_winner logic
        # Expecting "1" (Team 1), "2" (Team 2), or "0" (Draw)
        if predicted_winner not in ["0", "1", "2"]:
            raise Exception("Invalid prediction. Use '1' for Team 1, '2' for Team 2, or '0' for Draw.")

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
                "winner": int // 1 for Team 1, 2 for Team 2, 0 for draw, -1 if unresolved
            }}
            Return ONLY raw JSON.
            """
            result = gl.nondet.exec_prompt(task, response_format="json")
            return json.dumps(result, sort_keys=True)

        result_json = json.loads(gl.eq_principle.strict_eq(get_match_result))
        
        # Internal consistency check on the LLM output
        if "winner" not in result_json or "score" not in result_json:
            raise Exception("Oracle returned malformed data structure")
            
        return result_json

    @gl.public.write
    def create_bet(
        self, game_date: str, team1: str, team2: str, predicted_winner: str
    ) -> None:
        # Run sophisticated validation
        self._validate_bet_input(game_date, team1, team2, predicted_winner)

        match_resolution_url = (
            "https://www.bbc.com/sport/football/scores-fixtures/" + game_date
        )

        sender_address = gl.message.sender_address
        bet_id = f"{game_date}_{team1}_{team2}".replace(" ", "_").lower()
        
        # Check if player already has this exact bet
        player_bets = self.bets.get_or_insert_default(sender_address)
        if bet_id in player_bets:
            raise Exception("You have already placed a bet on this specific match.")

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
        player_bets[bet_id] = bet

    @gl.public.write
    def resolve_bet(self, bet_id: str) -> None:
        sender = gl.message.sender_address
        
        if sender not in self.bets or bet_id not in self.bets[sender]:
            raise Exception("Bet not found for this sender.")

        bet = self.bets[sender][bet_id]
        
        if bet.has_resolved:
            raise Exception("Bet already resolved.")

        bet_status = self._check_match(bet.resolution_url, bet.team1, bet.team2)

        if int(bet_status["winner"]) < 0:
            raise Exception("Match has not been played or result is not yet available.")

        # Update State
        bet.has_resolved = True
        bet.real_winner = str(bet_status["winner"])
        bet.real_score = bet_status["score"]

        # Scoring Logic
        if bet.real_winner == bet.predicted_winner:
            current_points = self.points.get(sender, 0)
            self.points[sender] = current_points + 1

    @gl.public.view
    def get_player_bets(self, player_address: str) -> list:
        addr = Address(player_address)
        if addr not in self.bets:
            return []
        return list(self.bets[addr].values())

    @gl.public.view
    def get_leaderboard(self) -> dict:
        return {k.as_hex: int(v) for k, v in self.points.items()}

    @gl.public.write
    def resolve_bet(self, bet_id: str) -> None:
        if self.bets[gl.message.sender_address][bet_id].has_resolved:
            raise Exception("Bet already resolved")

        bet = self.bets[gl.message.sender_address][bet_id]
        bet_status = self._check_match(bet.resolution_url, bet.team1, bet.team2)

        if int(bet_status["winner"]) < 0:
            raise Exception("Game not finished")

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
        return self.points.get(Address(player_address), 0)
