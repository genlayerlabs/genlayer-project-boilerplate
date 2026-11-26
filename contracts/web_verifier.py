
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

import json
from dataclasses import dataclass
from genlayer import *


@allow_storage
@dataclass
class Verification:
    claim: str
    url: str
    result: str
    evidence: str


    @gl.public.write
    def submit_verification(self, claim: str, url: str) -> None:
        self.verifications[claim] = Verification(
            claim=claim,
            url=url,
            result="pending",
            evidence="",
        )

    @gl.public.view
    def get_verification(self, claim: str) -> dict:
        verification = self.verifications[claim]
        return {
            "claim": verification.claim,
            "url": verification.url,
            "result": verification.result,
            "evidence": verification.evidence,
        }

    def _verify_claim(self, claim: str, url: str) -> dict:
        def verify() -> str:
            web_data = gl.nondet.web.render(url, mode="text")

            task = f"""
Verify this claim using the webpage content.

Claim:
{claim}

Webpage content:
{web_data}

Respond in JSON:
{{
    "result": "verified" or "not_verified",
    "evidence": "brief evidence from the webpage"
}}

Respond only with valid JSON.
"""
            result = gl.nondet.exec_prompt(task, response_format="json")
            return json.dumps(result, sort_keys=True)

        return json.loads(gl.eq_principle.strict_eq(verify))
class WebVerifier(gl.Contract):
    verifications: TreeMap[str, Verification]

    def __init__(self):
        pass

    def _verify_claim(self, claim: str, url: str) -> dict:
        def verify() -> str:
            web_data = gl.nondet.web.render(url, mode="text")

            task = f"""
Verify this claim using the webpage content.

Claim:
{claim}

Webpage content:
{web_data}

Respond in JSON:
{{
    "result": "verified" or "not_verified",
    "evidence": "brief evidence from the webpage"
}}

Respond only with valid JSON.
"""
            result = gl.nondet.exec_prompt(task, response_format="json")
            return json.dumps(result, sort_keys=True)

        return json.loads(gl.eq_principle.strict_eq(verify))

    @gl.public.write
    def submit_verification(self, claim: str, url: str) -> None:
        verification = self._verify_claim(claim, url)

        self.verifications[claim] = Verification(
            claim=claim,
            url=url,
            result=verification["result"],
            evidence=verification["evidence"],
        )

    @gl.public.view
    def get_verification(self, claim: str) -> dict:
        verification = self.verifications[claim]
        return {
            "claim": verification.claim,
            "url": verification.url,
            "result": verification.result,
            "evidence": verification.evidence,
        }

def test_web_verifier_deploy(direct_deploy):
    contract = direct_deploy("contracts/web_verifier.py")
    assert contract is not None


def test_web_verifier_submit(direct_deploy):
    contract = direct_deploy("contracts/web_verifier.py")

    contract.submit_verification(
        "The website is about GenLayer",
        "https://example.com",
    )

    result = contract.get_verification("The website is about GenLayer")

    assert result["claim"] == "The website is about GenLayer"
    assert result["url"] == "https://example.com"
