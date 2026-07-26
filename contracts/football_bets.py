# { "Depends": "py-genlayer:9b8kjyda2ycxyq4ea6g4yfpnydxhd52gqba5rb8dw7krkh5mn9p0" }

import json
from dataclasses import dataclass
import genlayer as gl
from genlayer.storage import allow as allow_storage


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

    @gl.public.write
    def create_bet(
        self, game_date: str, team1: str, team2: str, predicted_winner: str
    ) -> None:
        match_resolution_url = (
            "https://www.bbc.com/sport/football/scores-fixtures/" + game_date
        )
        # commented to allow to test matches in the past.
        # match_status = await self._check_match(match_resolution_url, team1, team2)

        # if int(match_status["winner"]) > -1:
        #    raise Exception("Game already finished")

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
