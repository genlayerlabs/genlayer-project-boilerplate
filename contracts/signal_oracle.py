# { "Depends": "py-genlayer:test" }

import json
from dataclasses import dataclass
from genlayer import *


@allow_storage
@dataclass
class SignalSubmission:
    signal_id: str
    submitter: Address
    headline: str
    body: str
    beat: str
    quality_score: int  # 0-100
    is_approved: bool
    feedback: str
    timestamp: u256


@allow_storage
@dataclass
class EditorialStandard:
    name: str
    min_headline_len: int
    max_headline_len: int
    min_body_words: int
    max_body_words: int
    required_numbers: int
    banned_topics: str  # JSON array
    approval_threshold: int  # min score to approve


class SignalQualityOracle(gl.Contract):
    """
    AI-powered signal quality oracle for news correspondents.
    Uses GenLayer's LLM to score news signals against editorial standards.
    Unique to GenLayer: contracts that READ and JUDGE content using AI.
    """
    
    submissions: TreeMap[str, SignalSubmission]
    standards: TreeMap[str, EditorialStandard]
    submitter_scores: TreeMap[Address, u256]
    total_submissions: u256
    owner: Address

    def __init__(self):
        self.owner = gl.message.sender_address
        self.total_submissions = 0
        # Initialize default editorial standard
        self.standards["default"] = EditorialStandard(
            name="Default Editorial Standard",
            min_headline_len=20,
            max_headline_len=120,
            min_body_words=150,
            max_body_words=400,
            required_numbers=2,
            banned_topics=json.dumps(["bitcoin_price", "sentiment_index", "external_hacks", "etf_flows"]),
            approval_threshold=70,
        )

    @gl.public.write
    def submit_signal(self, headline: str, body: str, beat: str) -> dict:
        """
        Submit a news signal for quality evaluation.
        The contract uses LLM to analyze the signal against editorial standards.
        """
        sender = gl.message.sender_address
        signal_id = f"{str(sender)}_{str(self.total_submissions)}"
        
        # Get editorial standard for this beat (or default)
        standard_key = beat if beat in self.standards else "default"
        standard = self.standards[standard_key]
        
        # AI-powered quality evaluation
        def evaluate_signal() -> str:
            prompt = f"""You are a strict news editor evaluating a correspondent's signal.

EDITORIAL STANDARDS:
- Headline: {standard.min_headline_len}-{standard.max_headline_len} characters
- Body: {standard.min_body_words}-{standard.max_body_words} words
- Must contain at least {standard.required_numbers} specific numbers/data points
- Banned topics: {standard.banned_topics}
- Beat: {beat}

SIGNAL TO EVALUATE:
Headline: {headline}
Body: {body}

Score this signal 0-100 on:
1. Specificity (quantified claims, not vague)
2. Prescriptive value (what should agents DO, not just what happened)
3. Editorial compliance (meets length/format requirements)
4. Not a banned topic
5. Novelty (not just repeating known info)

Respond in JSON only:
{{
    "score": int,  // 0-100
    "approved": bool,  // true if score >= {standard.approval_threshold}
    "feedback": str,  // brief actionable feedback
    "issues": [str]  // list of specific issues found
}}
It is mandatory that you respond only using the JSON format above, nothing else."""
            
            result = gl.nondet.exec_prompt(prompt, response_format="json")
            return json.dumps(result, sort_keys=True)

        eval_result = json.loads(gl.eq_principle.strict_eq(evaluate_signal))
        
        submission = SignalSubmission(
            signal_id=signal_id,
            submitter=sender,
            headline=headline,
            body=body,
            beat=beat,
            quality_score=int(eval_result.get("score", 0)),
            is_approved=bool(eval_result.get("approved", False)),
            feedback=str(eval_result.get("feedback", "")),
            timestamp=u256(gl.block.timestamp),
        )
        
        self.submissions[signal_id] = submission
        self.total_submissions += 1
        
        # Track submitter reputation
        if sender not in self.submitter_scores:
            self.submitter_scores[sender] = 0
        if submission.is_approved:
            self.submitter_scores[sender] += 1
        
        return {
            "signal_id": signal_id,
            "score": submission.quality_score,
            "approved": submission.is_approved,
            "feedback": submission.feedback,
        }

    @gl.public.view
    def get_submission(self, signal_id: str) -> dict:
        """Get details of a signal submission."""
        sub = self.submissions[signal_id]
        return {
            "signal_id": sub.signal_id,
            "submitter": sub.submitter.as_hex,
            "headline": sub.headline,
            "beat": sub.beat,
            "quality_score": sub.quality_score,
            "is_approved": sub.is_approved,
            "feedback": sub.feedback,
            "timestamp": int(sub.timestamp),
        }

    @gl.public.view
    def get_submitter_reputation(self, addr: str) -> int:
        """Get the approval count for a submitter."""
        return int(self.submitter_scores.get(Address(addr), 0))

    @gl.public.view
    def get_leaderboard(self) -> dict:
        """Get top correspondents by approval count."""
        return {k.as_hex: int(v) for k, v in self.submitter_scores.items()}

    @gl.public.view
    def get_standard(self, beat: str) -> dict:
        """Get editorial standard for a beat."""
        key = beat if beat in self.standards else "default"
        std = self.standards[key]
        return {
            "name": std.name,
            "headline_len": f"{std.min_headline_len}-{std.max_headline_len}",
            "body_words": f"{std.min_body_words}-{std.max_body_words}",
            "required_numbers": std.required_numbers,
            "banned_topics": std.banned_topics,
            "threshold": std.approval_threshold,
        }

    @gl.public.write
    def update_standard(self, beat: str, name: str, min_headline: int, max_headline: int,
                        min_body: int, max_body: int, req_numbers: int,
                        banned: str, threshold: int) -> None:
        """Update editorial standard (owner only)."""
        if gl.message.sender_address != self.owner:
            raise Exception("Only owner can update standards")
        self.standards[beat] = EditorialStandard(
            name=name,
            min_headline_len=min_headline,
            max_headline_len=max_headline,
            min_body_words=min_body,
            max_body_words=max_body,
            required_numbers=req_numbers,
            banned_topics=banned,
            approval_threshold=threshold,
        )

    @gl.public.write
    def verify_web_signal(self, headline: str, source_url: str) -> dict:
        """
        Verify a signal by checking its source URL.
        Uses GenLayer's web access to validate claims against source material.
        UNIQUE TO GENLAYER: No other blockchain can do this.
        """
        def verify_against_source() -> str:
            web_content = gl.nondet.web.render(source_url, mode="text")
            
            prompt = f"""A news correspondent claims: "{headline}"

Source content from {source_url}:
{web_content[:3000]}

Verify: Does the source content support this headline?
Score accuracy 0-100.

Respond in JSON only:
{{
    "accuracy": int,
    "supported": bool,
    "source_quality": str,
    "discrepancies": [str]
}}
It is mandatory that you respond only using the JSON format above, nothing else."""
            
            result = gl.nondet.exec_prompt(prompt, response_format="json")
            return json.dumps(result, sort_keys=True)

        verification = json.loads(gl.eq_principle.strict_eq(verify_against_source))
        return verification
