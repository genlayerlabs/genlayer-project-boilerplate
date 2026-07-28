# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from dataclasses import dataclass
import json
from genlayer import *


@allow_storage
@dataclass
class Claim:
    id: u256
    claim_text: str
    source_url: str
    is_resolved: bool
    outcome: bool  # True if resolved as True, False if False
    total_true_stake: u256
    total_false_stake: u256


class FactChecker(gl.Contract):
    claims_count: u256
    claims: TreeMap[u256, Claim]
    true_stakes: TreeMap[u256, TreeMap[Address, u256]]
    false_stakes: TreeMap[u256, TreeMap[Address, u256]]

    def __init__(self):
        self.claims_count = u256(0)

    @gl.public.write.payable
    def create_claim(
        self, claim_text: str, source_url: str, initial_vote: bool
    ) -> u256:
        if gl.message.value == 0:
            raise gl.vm.UserError("Value must be greater than zero")

        self.claims_count = u256(int(self.claims_count) + 1)
        claim_id = self.claims_count

        new_claim = Claim(
            id=claim_id,
            claim_text=claim_text,
            source_url=source_url,
            is_resolved=False,
            outcome=False,
            total_true_stake=u256(0),
            total_false_stake=u256(0),
        )
        self._add_stake(new_claim, gl.message.sender_address, gl.message.value, initial_vote)
        self.claims[claim_id] = new_claim

        return claim_id

    @gl.public.write.payable
    def place_stake(self, claim_id: u256, vote: bool) -> None:
        if gl.message.value == 0:
            raise gl.vm.UserError("Value must be greater than zero")
        if claim_id not in self.claims:
            raise gl.vm.UserError("Claim does not exist")

        claim = self.claims[claim_id]
        if claim.is_resolved:
            raise gl.vm.UserError("Claim is already resolved")

        self._add_stake(claim, gl.message.sender_address, gl.message.value, vote)
        self.claims[claim_id] = claim

    @gl.public.write
    def resolve_claim(self, claim_id: u256) -> None:
        if claim_id not in self.claims:
            raise gl.vm.UserError("Claim does not exist")

        claim = self.claims[claim_id]
        if claim.is_resolved:
            raise gl.vm.UserError("Claim is already resolved")

        def eval_claim() -> str:
            web_data = gl.nondet.web.render(claim.source_url, mode="text")
            prompt = (
                f"Analyze the web content to determine if the claim is true or false.\n\n"
                f"Web Content:\n{web_data}\n\n"
                f"Claim: {claim.claim_text}\n\n"
                f"Respond in JSON with a single key 'outcome' whose value is a boolean representing if the claim is true or false."
            )
            result = gl.nondet.exec_prompt(prompt, response_format="json")
            return json.dumps(result, sort_keys=True)

        resolved_json_str = gl.eq_principle.prompt_comparative(
            eval_claim, "The outcome field in the JSON response must match."
        )

        result_json = json.loads(resolved_json_str)
        outcome = bool(result_json["outcome"])

        claim.outcome = outcome
        claim.is_resolved = True
        self.claims[claim_id] = claim

    @gl.public.write
    def claim_reward(self, claim_id: u256) -> None:
        if claim_id not in self.claims:
            raise gl.vm.UserError("Claim does not exist")

        claim = self.claims[claim_id]
        if not claim.is_resolved:
            raise gl.vm.UserError("Claim is not resolved yet")

        caller = gl.message.sender_address
        total_pool = int(claim.total_true_stake) + int(claim.total_false_stake)

        total_winning_pool = int(
            claim.total_true_stake if claim.outcome else claim.total_false_stake
        )

        if total_winning_pool == 0:
            # If there are no winning stakers, we allow losing stakers to reclaim their original stake.
            stakes_map = self._get_stakes_map(claim_id, not claim.outcome)
            winning_stake = int(stakes_map.get(caller, u256(0)))
            if winning_stake == 0:
                raise gl.vm.UserError("No stake to reclaim")
            payout = winning_stake
        else:
            stakes_map = self._get_stakes_map(claim_id, claim.outcome)
            winning_stake = int(stakes_map.get(caller, u256(0)))
            if winning_stake == 0:
                raise gl.vm.UserError("No winning stake")
            payout = (winning_stake * total_pool) // total_winning_pool

        # Clear the stake to prevent double claim
        stakes_map[caller] = u256(0)

        gl.get_contract_at(gl.message.sender_address).emit_transfer(
            value=u256(payout)
        )

    @gl.public.view
    def get_claims_count(self) -> u256:
        return self.claims_count

    @gl.public.view
    def get_claim(self, claim_id: u256) -> Claim:
        if claim_id not in self.claims:
            raise gl.vm.UserError("Claim does not exist")
        return self.claims[claim_id]

    @gl.public.view
    def get_true_stake(self, claim_id: u256, player: Address) -> u256:
        if not isinstance(player, Address):
            player = Address(player)
        stakes_map = self._read_stakes_map(claim_id, True)
        if stakes_map is None:
            return u256(0)
        return stakes_map.get(player, u256(0))

    @gl.public.view
    def get_false_stake(self, claim_id: u256, player: Address) -> u256:
        if not isinstance(player, Address):
            player = Address(player)
        stakes_map = self._read_stakes_map(claim_id, False)
        if stakes_map is None:
            return u256(0)
        return stakes_map.get(player, u256(0))

    def _get_stakes_root_map(self, vote: bool) -> TreeMap[u256, TreeMap[Address, u256]]:
        return self.true_stakes if vote else self.false_stakes

    def _get_stakes_map(self, claim_id: u256, vote: bool) -> TreeMap[Address, u256]:
        root_map = self._get_stakes_root_map(vote)
        return root_map.get_or_insert_default(claim_id)

    def _read_stakes_map(self, claim_id: u256, vote: bool) -> TreeMap[Address, u256] | None:
        root_map = self._get_stakes_root_map(vote)
        if claim_id not in root_map:
            return None
        return root_map[claim_id]

    def _add_stake(self, claim: Claim, caller: Address, amount: u256, vote: bool) -> None:
        stakes_map = self._get_stakes_map(claim.id, vote)
        current = int(stakes_map.get(caller, u256(0)))
        stakes_map[caller] = u256(current + int(amount))
        if vote:
            claim.total_true_stake = u256(int(claim.total_true_stake) + int(amount))
        else:
            claim.total_false_stake = u256(int(claim.total_false_stake) + int(amount))
