"""Direct-mode tests for the minimal fungible token example."""

from tests.direct.conftest import to_hex


ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"


def test_deploy_sets_owner_and_empty_supply(direct_vm, direct_deploy, direct_owner):
    direct_vm.sender = direct_owner
    token = direct_deploy("contracts/basic_token.py")

    assert token.get_owner() == to_hex(direct_owner)
    assert token.get_total_supply() == 0
    assert token.balance_of(to_hex(direct_owner)) == 0


def test_owner_can_mint_and_supply_tracks_balances(
    direct_vm, direct_deploy, direct_owner, direct_alice
):
    direct_vm.sender = direct_owner
    token = direct_deploy("contracts/basic_token.py")
    alice = to_hex(direct_alice)

    token.mint(alice, 100)

    assert token.balance_of(alice) == 100
    assert token.get_total_supply() == 100


def test_non_owner_cannot_mint(direct_vm, direct_deploy, direct_owner, direct_alice):
    direct_vm.sender = direct_owner
    token = direct_deploy("contracts/basic_token.py")
    direct_vm.sender = direct_alice

    with direct_vm.expect_revert("Only the token owner can mint"):
        token.mint(to_hex(direct_alice), 100)

    assert token.get_total_supply() == 0


def test_transfer_moves_tokens_between_accounts(
    direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob
):
    direct_vm.sender = direct_owner
    token = direct_deploy("contracts/basic_token.py")
    alice = to_hex(direct_alice)
    bob = to_hex(direct_bob)
    token.mint(alice, 100)

    direct_vm.sender = direct_alice
    token.transfer(bob, 35)

    assert token.balance_of(alice) == 65
    assert token.balance_of(bob) == 35
    assert token.get_total_supply() == 100


def test_transfer_reverts_without_enough_balance(
    direct_vm, direct_deploy, direct_owner, direct_alice, direct_bob
):
    direct_vm.sender = direct_owner
    token = direct_deploy("contracts/basic_token.py")
    alice = to_hex(direct_alice)
    bob = to_hex(direct_bob)
    token.mint(alice, 10)

    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Insufficient token balance"):
        token.transfer(bob, 11)

    assert token.balance_of(alice) == 10
    assert token.balance_of(bob) == 0
    assert token.get_total_supply() == 10


def test_self_transfer_preserves_balance(
    direct_vm, direct_deploy, direct_owner, direct_alice
):
    direct_vm.sender = direct_owner
    token = direct_deploy("contracts/basic_token.py")
    alice = to_hex(direct_alice)
    token.mint(alice, 10)

    direct_vm.sender = direct_alice
    token.transfer(alice, 7)

    assert token.balance_of(alice) == 10
    assert token.get_total_supply() == 10


def test_mint_and_transfer_reject_invalid_input(
    direct_vm, direct_deploy, direct_owner, direct_alice
):
    direct_vm.sender = direct_owner
    token = direct_deploy("contracts/basic_token.py")

    with direct_vm.expect_revert("Cannot mint to the zero address"):
        token.mint(ZERO_ADDRESS, 10)

    with direct_vm.expect_revert("Mint amount must be greater than zero"):
        token.mint(to_hex(direct_alice), 0)

    token.mint(to_hex(direct_alice), 10)
    direct_vm.sender = direct_alice
    with direct_vm.expect_revert("Cannot transfer to the zero address"):
        token.transfer(ZERO_ADDRESS, 1)

    assert token.get_total_supply() == 10
    assert token.balance_of(to_hex(direct_alice)) == 10
