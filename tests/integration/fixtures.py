"""Expected contract state fixtures for integration tests."""

football_bets_contract_schema = {
    "id": 1,
    "jsonrpc": "2.0",
    "result": {
        "ctor": {"kwparams": {}, "params": []},
        "methods": {
            "create_bet": {
                "kwparams": {},
                "params": [
                    ["game_date", "string"],
                    ["team1", "string"],
                    ["team2", "string"],
                    ["predicted_winner", "string"],
                ],
                "readonly": False,
                "ret": "null",
            },
            "get_bets": {"kwparams": {}, "params": [], "readonly": True, "ret": "dict"},
            "get_player_points": {
                "kwparams": {},
                "params": [["player_address", "string"]],
                "readonly": True,
                "ret": "int",
            },
            "get_points": {
                "kwparams": {},
                "params": [],
                "readonly": True,
                "ret": "dict",
            },
            "resolve_bet": {
                "kwparams": {},
                "params": [["bet_id", "string"]],
                "readonly": False,
                "ret": "null",
            },
        },
    },
}


football_bets_win_unresolved = {
    "2024-06-20_spain_italy": {
        "game_date": "2024-06-20",
        "has_resolved": False,
        "id": "2024-06-20_spain_italy",
        "predicted_winner": "1",
        "real_score": "",
        "real_winner": "",
        "resolution_url": "https://www.bbc.com/sport/football/scores-fixtures/2024-06-20",
        "team1": "Spain",
        "team2": "Italy",
    }
}

football_bets_win_resolved = {
    "2024-06-20_spain_italy": {
        "game_date": "2024-06-20",
        "has_resolved": True,
        "id": "2024-06-20_spain_italy",
        "predicted_winner": "1",
        "real_score": "1:0",
        "real_winner": "1",
        "resolution_url": "https://www.bbc.com/sport/football/scores-fixtures/2024-06-20",
        "team1": "Spain",
        "team2": "Italy",
    }
}

football_bets_draw_unresolved = {
    "2024-06-20_denmark_england": {
        "game_date": "2024-06-20",
        "has_resolved": False,
        "id": "2024-06-20_denmark_england",
        "predicted_winner": "0",
        "real_score": "",
        "real_winner": "",
        "resolution_url": "https://www.bbc.com/sport/football/scores-fixtures/2024-06-20",
        "team1": "Denmark",
        "team2": "England",
    }
}

football_bets_draw_resolved = {
    "2024-06-20_denmark_england": {
        "game_date": "2024-06-20",
        "has_resolved": True,
        "id": "2024-06-20_denmark_england",
        "predicted_winner": "0",
        "real_score": "1:1",
        "real_winner": "0",
        "resolution_url": "https://www.bbc.com/sport/football/scores-fixtures/2024-06-20",
        "team1": "Denmark",
        "team2": "England",
    }
}

football_bets_unsuccess_unresolved = {
    "2024-06-20_spain_italy": {
        "game_date": "2024-06-20",
        "has_resolved": False,
        "id": "2024-06-20_spain_italy",
        "predicted_winner": "2",
        "real_score": "",
        "real_winner": "",
        "resolution_url": "https://www.bbc.com/sport/football/scores-fixtures/2024-06-20",
        "team1": "Spain",
        "team2": "Italy",
    }
}

football_bets_unsuccess_resolved = {
    "2024-06-20_spain_italy": {
        "game_date": "2024-06-20",
        "has_resolved": True,
        "id": "2024-06-20_spain_italy",
        "predicted_winner": "2",
        "real_score": "1:0",
        "real_winner": "1",
        "resolution_url": "https://www.bbc.com/sport/football/scores-fixtures/2024-06-20",
        "team1": "Spain",
        "team2": "Italy",
    }
}
