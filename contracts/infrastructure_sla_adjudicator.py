# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from dataclasses import dataclass
from genlayer import *
import genlayer.gl.vm as glvm


@allow_storage
@dataclass
class SlaAgreement:
    id: str
    provider_address: str
    customer_address: str
    service_name: str
    monitor_url: str
    outage_threshold_minutes: u256
    credit_amount: u256
    is_active: bool


@allow_storage
@dataclass
class OutageClaim:
    id: str
    agreement_id: str
    checked_at: str
    source_url: str
    breach_detected: bool
    outage_detected: bool
    outage_minutes: u256
    confidence: u256
    source_state: str
    summary: str
    credit_released: bool


class InfrastructureSlaAdjudicator(gl.Contract):
    agreements: TreeMap[str, SlaAgreement]
    claims: TreeMap[str, OutageClaim]
    credits_due: TreeMap[Address, u256]

    def __init__(self):
        pass

    def _address_hex(self, address: str) -> str:
        return Address(address).as_hex

    def _require_https_url(self, url: str) -> None:
        if not url.startswith("https://"):
            raise Exception("URL must use HTTPS")

    def _as_bool(self, value) -> bool:
        if isinstance(value, bool):
            return value
        if isinstance(value, int):
            return value != 0
        return str(value).strip().lower() in ["true", "yes", "1"]

    def _as_int(self, value, default: int = 0) -> int:
        try:
            return int(value)
        except Exception:
            return default

    def _normalize_report(self, report: dict, threshold_minutes: int) -> dict:
        outage_minutes = self._as_int(report.get("outage_minutes", 0))
        if outage_minutes < 0:
            outage_minutes = 0

        confidence = self._as_int(report.get("confidence", 0))
        if confidence < 0:
            confidence = 0
        if confidence > 100:
            confidence = 100

        outage_detected = self._as_bool(report.get("outage_detected", False))
        breach_detected = (
            self._as_bool(report.get("breach_detected", False))
            and outage_detected
            and outage_minutes >= threshold_minutes
        )

        return {
            "breach_detected": breach_detected,
            "confidence": confidence,
            "outage_detected": outage_detected,
            "outage_minutes": outage_minutes,
            "source_state": str(report.get("source_state", "unknown"))[:64],
            "summary": str(report.get("summary", ""))[:512],
        }

    def _fetch_url_text(self, url: str) -> str:
        response = gl.nondet.web.get(url)
        return response.body.decode("utf-8")

    def _classify_status(
        self, agreement: SlaAgreement, evidence_url: str
    ) -> dict:
        primary_text = self._fetch_url_text(agreement.monitor_url)
        evidence_text = ""
        if evidence_url != "":
            evidence_text = self._fetch_url_text(evidence_url)

        task = f"""
Infrastructure SLA outage adjudication.

Service: {agreement.service_name}
SLA threshold minutes: {int(agreement.outage_threshold_minutes)}

Provider status source:
{primary_text[:12000]}

Third-party evidence source:
{evidence_text[:8000]}

Return JSON only:
{{
  "outage_detected": bool,
  "outage_minutes": int,
  "breach_detected": bool,
  "confidence": int,
  "source_state": str,
  "summary": str
}}

Set breach_detected to true only when the sources show customer-impacting
downtime for this service at or above the SLA threshold. If the page is
ambiguous, unreachable, or unrelated, set breach_detected to false.
"""
        result = gl.nondet.exec_prompt(task, response_format="json")
        return self._normalize_report(
            result, int(agreement.outage_threshold_minutes)
        )

    def _adjudicate(self, agreement: SlaAgreement, evidence_url: str) -> dict:
        def leader() -> dict:
            return self._classify_status(agreement, evidence_url)

        def validator(leader_result) -> bool:
            if not isinstance(leader_result, glvm.Return):
                return False

            validator_report = self._classify_status(agreement, evidence_url)
            leader_report = leader_result.calldata

            same_decision = (
                leader_report["breach_detected"]
                == validator_report["breach_detected"]
            )
            same_outage_status = (
                leader_report["outage_detected"]
                == validator_report["outage_detected"]
            )
            validator_meets_threshold = (
                not leader_report["breach_detected"]
                or validator_report["outage_minutes"]
                >= int(agreement.outage_threshold_minutes)
            )

            return same_decision and same_outage_status and validator_meets_threshold

        return glvm.run_nondet_unsafe.lazy(leader, validator).get()

    @gl.public.write
    def create_agreement(
        self,
        agreement_id: str,
        provider_address: str,
        customer_address: str,
        service_name: str,
        monitor_url: str,
        outage_threshold_minutes: int,
        credit_amount: int,
    ) -> None:
        if agreement_id in self.agreements:
            raise Exception("Agreement already exists")
        if outage_threshold_minutes <= 0:
            raise Exception("Threshold must be positive")
        if credit_amount <= 0:
            raise Exception("Credit amount must be positive")

        self._require_https_url(monitor_url)

        provider_hex = self._address_hex(provider_address)
        customer_hex = self._address_hex(customer_address)
        if gl.message.sender_address.as_hex != provider_hex:
            raise Exception("Provider must create agreement")

        self.agreements[agreement_id] = SlaAgreement(
            id=agreement_id,
            provider_address=provider_hex,
            customer_address=customer_hex,
            service_name=service_name,
            monitor_url=monitor_url,
            outage_threshold_minutes=u256(outage_threshold_minutes),
            credit_amount=u256(credit_amount),
            is_active=True,
        )

    @gl.public.write
    def deactivate_agreement(self, agreement_id: str) -> None:
        if agreement_id not in self.agreements:
            raise Exception("Agreement not found")

        agreement = self.agreements[agreement_id]
        if gl.message.sender_address.as_hex != agreement.provider_address:
            raise Exception("Provider only")

        agreement.is_active = False

    @gl.public.write
    def adjudicate_outage(
        self, agreement_id: str, checked_at: str, evidence_url: str = ""
    ) -> dict:
        if agreement_id not in self.agreements:
            raise Exception("Agreement not found")
        if checked_at == "":
            raise Exception("Checked at is required")
        if evidence_url != "":
            self._require_https_url(evidence_url)

        agreement = self.agreements[agreement_id]
        if not agreement.is_active:
            raise Exception("Agreement inactive")

        claim_id = f"{agreement_id}_{checked_at}".lower()
        if claim_id in self.claims:
            raise Exception("Claim already adjudicated")

        report = self._adjudicate(agreement, evidence_url)
        credit_released = bool(report["breach_detected"])

        if credit_released:
            customer = Address(agreement.customer_address)
            if customer not in self.credits_due:
                self.credits_due[customer] = u256(0)
            self.credits_due[customer] += agreement.credit_amount

        source_url = evidence_url
        if source_url == "":
            source_url = agreement.monitor_url

        self.claims[claim_id] = OutageClaim(
            id=claim_id,
            agreement_id=agreement_id,
            checked_at=checked_at,
            source_url=source_url,
            breach_detected=report["breach_detected"],
            outage_detected=report["outage_detected"],
            outage_minutes=u256(report["outage_minutes"]),
            confidence=u256(report["confidence"]),
            source_state=report["source_state"],
            summary=report["summary"],
            credit_released=credit_released,
        )

        return report

    @gl.public.view
    def get_agreements(self) -> dict:
        return {k: v for k, v in self.agreements.items()}

    @gl.public.view
    def get_claims(self) -> dict:
        return {k: v for k, v in self.claims.items()}

    @gl.public.view
    def get_credits_due(self) -> dict:
        return {k.as_hex: int(v) for k, v in self.credits_due.items()}

    @gl.public.view
    def get_customer_credit(self, customer_address: str) -> int:
        return int(self.credits_due.get(Address(customer_address), u256(0)))

    @gl.public.view
    def export_claim_json(self, claim_id: str) -> str:
        if claim_id not in self.claims:
            raise Exception("Claim not found")

        claim = self.claims[claim_id]
        return json.dumps(
            {
                "agreement_id": claim.agreement_id,
                "breach_detected": claim.breach_detected,
                "checked_at": claim.checked_at,
                "confidence": int(claim.confidence),
                "credit_released": claim.credit_released,
                "id": claim.id,
                "outage_detected": claim.outage_detected,
                "outage_minutes": int(claim.outage_minutes),
                "source_state": claim.source_state,
                "source_url": claim.source_url,
                "summary": claim.summary,
            },
            sort_keys=True,
        )
