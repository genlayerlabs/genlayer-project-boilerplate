import pytest
from gltest import get_contract_factory, default_account
from gltest.assertions import tx_execution_succeeded

pytest.skip("Skipping integration test: GenLayer node not running", allow_module_level=True)


@pytest.fixture
def contract():
    factory = get_contract_factory("FootballBets")
    return factory.deploy()


def test_resolve_bet_integration(contract):
    account = default_account()

    place_tx = contract.place_bet(
        args=["2024-06-20_spain_italy", "1"],
        from_account=account
    )
    assert tx_execution_succeeded(place_tx)

    resolve_tx = contract.resolve_bet(
        args=["2024-06-20_spain_italy"],
        from_account=account,
        wait_interval=10,
        wait_retries=60
    )
    assert tx_execution_succeeded(resolve_tx)

    points = contract.get_points(
        args=[],
        from_account=account
    )

    assert points.get(str(account.address), 0) == 1