import pytest
from gltest import default_account, get_contract_factory
from gltest.assertions import tx_execution_succeeded
from gltest.helpers import load_fixture


AGREEMENT_ID = "contabo-vps-1"
MONITOR_URL = "https://status.example.com/incidents/vps"


@pytest.mark.integration
def deploy_contract():
    factory = get_contract_factory("InfrastructureSlaAdjudicator")
    contract = factory.deploy()
    assert contract.get_agreements(args=[]) == {}
    assert contract.get_claims(args=[]) == {}
    assert contract.get_credits_due(args=[]) == {}
    return contract


@pytest.mark.integration
def test_create_agreement_smoke():
    contract = load_fixture(deploy_contract)

    result = contract.create_agreement(
        args=[
            AGREEMENT_ID,
            default_account.address,
            default_account.address,
            "Contabo VPS",
            MONITOR_URL,
            30,
            250,
        ]
    )
    assert tx_execution_succeeded(result)

    agreements = contract.get_agreements(args=[])
    agreement = agreements[AGREEMENT_ID]
    assert agreement["provider_address"] == default_account.address
    assert agreement["customer_address"] == default_account.address
    assert agreement["monitor_url"] == MONITOR_URL
    assert agreement["outage_threshold_minutes"] == 30
    assert agreement["credit_amount"] == 250
    assert agreement["is_active"] is True
