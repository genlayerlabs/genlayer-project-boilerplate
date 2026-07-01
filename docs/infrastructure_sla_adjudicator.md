# Infrastructure SLA Adjudicator

An Intelligent Contract example for adjudicating infrastructure SLA breaches from provider status pages and third-party uptime monitors.

## Flow

1. A provider creates an SLA agreement with a customer, monitor URL, outage threshold, and credit amount.
2. An external monitor or operations job calls `adjudicate_outage()` when downtime is suspected.
3. The contract fetches the provider status source with `gl.nondet.web.get()`.
4. If provided, the contract also fetches a third-party evidence URL.
5. Validators classify the outage independently and compare the breach decision.
6. Confirmed breaches create an outage claim and accrue customer credit in `credits_due`.

The first implementation records credits as contract state. Native transfers or token payouts can be wired through a follow-up payout adapter once the target repository's value-transfer pattern is selected.

## Project Structure

```text
contracts/
  infrastructure_sla_adjudicator.py
tests/
  direct/
    test_infrastructure_sla_adjudicator.py
  integration/
    test_infrastructure_sla_adjudicator.py
gltest.config.yaml
pyproject.toml
requirements.txt
```

## Contract API

### `create_agreement(...)`

Creates an active SLA agreement. The transaction sender must match `provider_address`.

Parameters:

- `agreement_id`
- `provider_address`
- `customer_address`
- `service_name`
- `monitor_url`
- `outage_threshold_minutes`
- `credit_amount`

### `adjudicate_outage(agreement_id, checked_at, evidence_url="")`

Fetches the monitor URL and optional evidence URL, classifies the outage, records a claim, and credits the customer when the threshold is breached.

### `deactivate_agreement(agreement_id)`

Disables future adjudications for an agreement. Only the provider can deactivate.

### Views

- `get_agreements()`
- `get_claims()`
- `get_credits_due()`
- `get_customer_credit(customer_address)`
- `export_claim_json(claim_id)`

## Development

Install dependencies:

```shell
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Lint the contract:

```shell
genvm-lint check contracts/infrastructure_sla_adjudicator.py
```

Run direct tests:

```shell
pytest tests/direct/ -v
```

Run integration smoke tests with GenLayer Studio:

```shell
gltest tests/integration/ -v -s
```

## Integration Notes

- Use stable HTTPS monitor sources where possible.
- Keep evidence pages focused on the specific service and incident window.
- For heavily dynamic status pages, a later variant can switch `_fetch_url_text()` from `gl.nondet.web.get()` to `gl.nondet.web.render(..., mode="text")`.
- Keep the external monitor small: it only needs to detect suspected downtime and submit `adjudicate_outage()`.
