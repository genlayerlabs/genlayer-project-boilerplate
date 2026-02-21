# { "Depends": "py-genlayer:test" }
from genlayer import *
import json

class FreelancerDisputeResolver(gl.Contract):
    job_description: str
    deliverables_url: str
    client: Address
    freelancer: Address
    client_evidence: str
    freelancer_evidence: str
    dispute_raised: bool
    resolved: bool
    verdict: str
    verdict_reasoning: str

    def __init__(self, freelancer_address: str, job_description: str) -> None:
        self.client = gl.message.sender_account
        self.freelancer = Address(freelancer_address)
        self.job_description = job_description
        self.deliverables_url = ""
        self.client_evidence = ""
        self.freelancer_evidence = ""
        self.dispute_raised = False
        self.resolved = False
        self.verdict = ""
        self.verdict_reasoning = ""

    @gl.public.write
    def submit_deliverables(self, deliverables_url: str) -> None:
        if gl.message.sender_account != self.freelancer:
            raise Exception("Only the freelancer can submit deliverables.")
        if self.resolved:
            raise Exception("This contract has already been resolved.")
        if self.dispute_raised:
            raise Exception("Cannot change deliverables after a dispute has been raised.")
        self.deliverables_url = deliverables_url

    @gl.public.write
    def raise_dispute(self, evidence: str) -> None:
        """Called by the client to open a dispute with their complaint."""
        if self.resolved:
            raise Exception("This contract has already been resolved.")
        if not self.deliverables_url:
            raise Exception("Freelancer must submit deliverables before a dispute can be raised.")
        if gl.message.sender_account != self.client:
            raise Exception("Only the client can raise a dispute.")
        if self.client_evidence:
            raise Exception("Client has already submitted evidence.")
        self.client_evidence = evidence
        self.dispute_raised = True

    @gl.public.write
    def submit_evidence(self, evidence: str) -> None:
        """Called by the freelancer to submit their rebuttal evidence."""
        if self.resolved:
            raise Exception("This contract has already been resolved.")
        if not self.dispute_raised:
            raise Exception("No dispute has been raised yet.")
        if gl.message.sender_account != self.freelancer:
            raise Exception("Only the freelancer can submit rebuttal evidence.")
        if self.freelancer_evidence:
            raise Exception("Freelancer has already submitted evidence.")
        self.freelancer_evidence = evidence

    @gl.public.write
    def resolve_dispute(self) -> None:
        if not self.dispute_raised:
            raise Exception("No dispute has been raised yet.")
        if self.resolved:
            raise Exception("Dispute has already been resolved.")
        if not self.client_evidence:
            raise Exception("Client has not submitted evidence yet.")
        if not self.freelancer_evidence:
            raise Exception("Freelancer has not submitted evidence yet.")

        deliverables_url = self.deliverables_url
        job_description = self.job_description
        client_evidence = self.client_evidence
        freelancer_evidence = self.freelancer_evidence

        def fetch_deliverables() -> str:
            return gl.nondet.web.get(deliverables_url, mode="text")

        deliverables_content = gl.eq_principle.strict_eq(fetch_deliverables)

        if not deliverables_content or not deliverables_content.strip():
            raise Exception("Could not retrieve deliverables content from the submitted URL.")

        prompt = f"""
You are an impartial and expert freelance arbitrator. Your job is to fairly resolve
a dispute between a client and a freelancer based solely on the evidence provided.

JOB DESCRIPTION:
{job_description}

DELIVERABLES (fetched from submitted URL):
{deliverables_content[:3000]}

CLIENT'S EVIDENCE / COMPLAINT:
{client_evidence}

FREELANCER'S EVIDENCE / REBUTTAL:
{freelancer_evidence}

INSTRUCTIONS:
Carefully review all of the above. Then decide:
  - "freelancer" if the work sufficiently meets the job description and the client's complaint is not substantiated.
  - "client" if the work clearly does NOT meet the job description and the client's complaint is valid.
  - "draw" if the evidence is ambiguous or both parties share fault equally.

Respond ONLY in the following JSON format, nothing else:
{{
  "verdict": "freelancer" | "client" | "draw",
  "reasoning": "<2-4 sentences explaining the decision impartially>"
}}
Do not include any text outside the JSON object. Do not use markdown code fences.
"""

        def run_arbitration() -> str:
            result = gl.nondet.exec_prompt(prompt)
            result = result.replace("```json", "").replace("```", "").strip()
            return result

        raw_verdict = gl.eq_principle.prompt_comparative(
            run_arbitration,
            """The 'verdict' field must be one of: 'freelancer', 'client', or 'draw'.
The 'reasoning' must logically support the verdict based on the job description
and the evidence provided. Minor wording differences in 'reasoning' are acceptable.""",
        )

        try:
            parsed = json.loads(raw_verdict)
        except json.JSONDecodeError as err:
            raise Exception(f"Arbitration returned invalid JSON: {raw_verdict[:200]}") from err

        verdict = parsed.get("verdict", "")
        reasoning = parsed.get("reasoning", "")

        if verdict not in ("freelancer", "client", "draw"):
            raise Exception(f"Invalid verdict '{verdict}'. Must be 'freelancer', 'client', or 'draw'.")

        self.verdict = verdict
        self.verdict_reasoning = reasoning
        self.resolved = True

    @gl.public.view
    def get_job_info(self) -> dict:
        return {
            "job_description": self.job_description,
            "deliverables_url": self.deliverables_url,
            "client": self.client.as_hex,
            "freelancer": self.freelancer.as_hex,
        }

    @gl.public.view
    def get_dispute_status(self) -> dict:
        return {
            "dispute_raised": self.dispute_raised,
            "client_evidence": self.client_evidence,
            "freelancer_evidence": self.freelancer_evidence,
            "resolved": self.resolved,
            "verdict": self.verdict,
            "verdict_reasoning": self.verdict_reasoning,
        }

    @gl.public.view
    def get_verdict(self) -> str:
        return self.verdict
