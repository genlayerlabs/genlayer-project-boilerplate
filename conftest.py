"""Pytest bootstrap for Windows compatibility with gltest direct mode."""

import os


def _patch_gltest_windows_stdin() -> None:
    """Patch gltest's stdin injection to avoid unlinking an active temp file."""
    try:
        import gltest.direct.loader as loader_mod
        import gltest.direct.vm as vm_mod
    except Exception:
        return

    if getattr(loader_mod, "_copilot_patch_applied", False):
        return

    def _inject_message_to_fd0(vm):
        import os as _os
        import tempfile

        try:
            from genlayer.py import calldata
            from genlayer.py.types import Address
        except ImportError:
            return

        sender_addr = vm.sender
        if isinstance(sender_addr, bytes):
            sender_addr = Address(sender_addr)

        contract_addr = vm._contract_address
        if isinstance(contract_addr, bytes):
            contract_addr = Address(contract_addr)

        origin_addr = vm.origin
        if isinstance(origin_addr, bytes):
            origin_addr = Address(origin_addr)

        message_data = {
            "contract_address": contract_addr,
            "sender_address": sender_addr,
            "origin_address": origin_addr,
            "stack": [],
            "value": vm._value,
            "datetime": vm._datetime,
            "is_init": False,
            "chain_id": vm._chain_id,
            "entry_kind": 0,
            "entry_data": b"",
            "entry_stage_data": None,
        }

        encoded = calldata.encode(message_data)
        fd, path = tempfile.mkstemp()
        try:
            _os.write(fd, encoded)
            _os.lseek(fd, 0, _os.SEEK_SET)
            original_stdin = _os.dup(0)
            vm._original_stdin_fd = original_stdin
            _os.dup2(fd, 0)
            vm._message_temp_path = path
        finally:
            _os.close(fd)

    original_cleanup = vm_mod.VMContext._cleanup_after_deactivate

    def _cleanup_after_deactivate(self):
        try:
            original_cleanup(self)
        finally:
            temp_path = getattr(self, "_message_temp_path", None)
            if temp_path:
                try:
                    if os.path.exists(temp_path):
                        os.unlink(temp_path)
                except OSError:
                    pass
                self._message_temp_path = None

    loader_mod._inject_message_to_fd0 = _inject_message_to_fd0
    loader_mod._copilot_patch_applied = True
    vm_mod.VMContext._cleanup_after_deactivate = _cleanup_after_deactivate


if os.name == "nt":
    _patch_gltest_windows_stdin()
