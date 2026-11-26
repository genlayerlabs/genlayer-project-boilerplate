# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

"""A minimal fungible token for learning GenLayer storage and calls."""

from genlayer import *


ZERO_ADDRESS = Address("0x0000000000000000000000000000000000000000")


class BasicToken(gl.Contract):
    """Owner-mintable token with balance queries and direct transfers.

    This example intentionally omits allowances and delegated transfers so the
    core supply, access-control, and balance invariants stay easy to follow.
    """

    owner: Address
    total_supply: u256
    balances: TreeMap[Address, u256]

    def __init__(self):
        self.owner = gl.message.sender_address
        self.total_supply = u256(0)

    @gl.public.write
    def mint(self, recipient: str, amount: u256) -> None:
        if gl.message.sender_address != self.owner:
            raise gl.vm.UserError("Only the token owner can mint")
        if amount == u256(0):
            raise gl.vm.UserError("Mint amount must be greater than zero")

        recipient_address = Address(recipient)
        if recipient_address == ZERO_ADDRESS:
            raise gl.vm.UserError("Cannot mint to the zero address")

        self.total_supply += amount
        self.balances[recipient_address] = (
            self.balances.get(recipient_address, u256(0)) + amount
        )

    @gl.public.write
    def transfer(self, recipient: str, amount: u256) -> None:
        sender = gl.message.sender_address
        recipient_address = Address(recipient)
        if recipient_address == ZERO_ADDRESS:
            raise gl.vm.UserError("Cannot transfer to the zero address")

        sender_balance = self.balances.get(sender, u256(0))
        if sender_balance < amount:
            raise gl.vm.UserError("Insufficient token balance")

        # A self-transfer is valid but does not change either balance.
        if sender == recipient_address or amount == u256(0):
            return

        self.balances[sender] = sender_balance - amount
        self.balances[recipient_address] = (
            self.balances.get(recipient_address, u256(0)) + amount
        )

    @gl.public.view
    def get_owner(self) -> str:
        return self.owner.as_hex

    @gl.public.view
    def get_total_supply(self) -> u256:
        return self.total_supply

    @gl.public.view
    def balance_of(self, account: str) -> u256:
        return self.balances.get(Address(account), u256(0))
