<template>
  <div class="grid gap-3 p-4 border rounded-2xl">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <h2 class="font-semibold">Connect Wallet</h2>
      <span v-if="addr" class="text-sm font-mono opacity-80" :title="addr">
        {{ addr.slice(0, 8) }}…{{ addr.slice(-6) }}
      </span>
    </div>

    <!-- Connected -->
    <div v-if="addr" class="flex items-center justify-between">
      <div class="text-sm">
        <div class="opacity-70">Address</div>
        <div class="font-mono">{{ addr }}</div>
      </div>
      <div class="flex gap-2">
        <button class="px-3 py-2 rounded-xl border" @click="onExport">Export</button>
        <button class="px-3 py-2 rounded-xl bg-black text-white" @click="onDisconnect">Disconnect</button>
      </div>
    </div>

    <!-- Disconnected -->
    <div v-else class="grid gap-4">
      <details>
        <summary class="cursor-pointer font-medium">Create New Wallet</summary>
        <div class="mt-2 grid gap-2">
          <input v-model="newPass" type="password" class="p-2 border rounded" placeholder="Set a passphrase"/>
          <input v-model="newPass2" type="password" class="p-2 border rounded" placeholder="Confirm passphrase"/>
          <button class="px-3 py-2 rounded-xl bg-black text-white" @click="onCreate">Create</button>
          <p v-if="lastMnemonic" class="text-xs opacity-70">
            Backup your recovery phrase: <span class="font-mono">{{ lastMnemonic }}</span>
          </p>
        </div>
      </details>

      <details>
        <summary class="cursor-pointer font-medium">Import from Mnemonic</summary>
        <div class="mt-2 grid gap-2">
          <textarea v-model="mnemonic" rows="2" class="p-2 border rounded" placeholder="twelve word seed phrase"></textarea>
          <input v-model="importPass" type="password" class="p-2 border rounded" placeholder="Passphrase to encrypt locally"/>
          <button class="px-3 py-2 rounded-xl bg-black text-white" @click="onImportMnemonic">Import</button>
        </div>
      </details>

      <details>
        <summary class="cursor-pointer font-medium">Import Private Key</summary>
        <div class="mt-2 grid gap-2">
          <input v-model="privHex" class="p-2 border rounded" placeholder="0x… 64 hex chars"/>
          <input v-model="importPass2" type="password" class="p-2 border rounded" placeholder="Passphrase to encrypt locally"/>
          <button class="px-3 py-2 rounded-xl bg-black text-white" @click="onImportPrivKey">Import</button>
        </div>
      </details>

      <details>
        <summary class="cursor-pointer font-medium">Unlock Existing</summary>
        <div class="mt-2 grid gap-2">
          <input v-model="unlockPass" type="password" class="p-2 border rounded" placeholder="Enter passphrase"/>
          <button class="px-3 py-2 rounded-xl border" @click="onUnlock">Unlock</button>
        </div>
      </details>
    </div>

    <!-- Export Modal -->
    <div v-if="showExportModal" class="fixed inset-0 bg-gray-600 bg-opacity-75 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div class="relative p-5 border w-96 shadow-lg rounded-md bg-white">
        <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">Export Recovery Phrase</h3>
        
        <div v-if="!exportedMnemonic">
          <p class="text-sm text-gray-600 mb-4">Enter your passphrase to view your recovery phrase:</p>
          <input 
            v-model="exportPassphrase" 
            type="password" 
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 mb-4" 
            placeholder="Enter your passphrase"
          />
          <div class="flex gap-2">
            <button 
              @click="confirmExport" 
              class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Export
            </button>
            <button 
              @click="closeExportModal" 
              class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
            >
              Cancel
            </button>
          </div>
        </div>

        <div v-else>
          <p class="text-sm text-gray-600 mb-4">Your recovery phrase (keep this safe!):</p>
          <div class="bg-gray-100 p-4 rounded-md mb-4">
            <p class="font-mono text-sm break-words">{{ exportedMnemonic }}</p>
          </div>
          <div class="flex gap-2">
            <button 
              @click="copyToClipboard(exportedMnemonic)" 
              class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
            >
              Copy to Clipboard
            </button>
            <button 
              @click="closeExportModal" 
              class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// A polished local-first wallet for GenLayer (no third-party SDK).
// - Create/Import mnemonics or raw private keys (client-only).
// - AES-GCM encryption at rest (localStorage).
// - Dynamic account wiring into genlayer-js client.

import { ref, onMounted, onBeforeUnmount } from "vue";
import { createNewWallet, privateKeyFromMnemonic, isValidPrivateKey } from "../lib/localWallet.js";
import { decryptString } from "../lib/crypto.js";
import {
  setAccountFromPrivKey,
  saveEncryptedPrivKey,
  saveEncryptedMnemonic,
  getEncryptedMnemonic,
  importPrivKeySecure,      // nếu bạn vẫn dùng cho nút "Import Private Key"
  unlockWithPassphrase,
  tryLoadSession,
  getAccount,
  onAccountChanged,           // <<< mới
  clearAccount,
} from "../services/genlayer.js";

const lastMnemonic = ref("");
const mnemonic = ref("");
const privHex = ref("");

// Passphrases
const newPass = ref("");
const newPass2 = ref("");
const importPass = ref("");
const importPass2 = ref("");
const unlockPass = ref("");

// Export functionality
const showExportModal = ref(false);
const exportPassphrase = ref("");
const exportedMnemonic = ref("");

const addr = ref("");         // địa chỉ hiển thị

onMounted(() => {
  // lần đầu (nếu có session)
  tryLoadSession();
  addr.value = getAccount()?.address || "";

  // subscribe thay đổi account
  const off = onAccountChanged((acc) => {
    addr.value = acc?.address || "";
  });
  onBeforeUnmount(() => off());
});

// Create New Wallet
async function onCreate() {
  if (!newPass.value || newPass.value !== newPass2.value) return alert("Passphrase mismatch");
  const w = createNewWallet();
  lastMnemonic.value = w.mnemonic;
  setAccountFromPrivKey(w.privateKey);                 // 1) connect ngay
  try { 
    await saveEncryptedPrivKey(w.privateKey, newPass.value);
    await saveEncryptedMnemonic(w.mnemonic, newPass.value);
  } catch (e) { console.warn(e); }
  alert("Wallet created. Please back up your recovery phrase.");
}

// Import from Mnemonic
async function onImportMnemonic() {
  if (!mnemonic.value.trim()) return alert("Missing mnemonic");
  if (!importPass.value) return alert("Missing passphrase");
  const pk = privateKeyFromMnemonic(mnemonic.value.trim());
  setAccountFromPrivKey(pk);
  try { 
    await saveEncryptedPrivKey(pk, importPass.value);
    await saveEncryptedMnemonic(mnemonic.value.trim(), importPass.value);
  } catch (e) { console.warn(e); }
  lastMnemonic.value = "";
  alert("Wallet imported & encrypted locally.");
}

// Import Private Key
async function onImportPrivKey() {
  const pk = privHex.value.trim();
  if (!isValidPrivateKey(pk)) return alert("Invalid private key");
  if (!importPass2.value) return alert("Missing passphrase");
  // dùng sẵn helper tổng hợp
  await importPrivKeySecure(pk, importPass2.value);
  alert("Private key imported & encrypted locally.");
}

// Unlock Existing
async function onUnlock() {
  if (!unlockPass.value) return alert("Missing passphrase");
  try { await unlockWithPassphrase(unlockPass.value); }
  catch (e) { return alert("Unlock failed: " + (e?.message || e)); }
}

function onDisconnect() {
  clearAccount();
}

async function onExport() {
  showExportModal.value = true;
  exportPassphrase.value = "";
  exportedMnemonic.value = "";
}

async function confirmExport() {
  if (!exportPassphrase.value) {
    alert("Please enter your passphrase");
    return;
  }
  
  try {
    const mnemonic = await getEncryptedMnemonic(exportPassphrase.value);
    if (mnemonic) {
      exportedMnemonic.value = mnemonic;
      exportPassphrase.value = "";
    } else {
      alert("No mnemonic found or incorrect passphrase");
    }
  } catch (error) {
    alert("Failed to export: " + (error?.message || error));
  }
}

function closeExportModal() {
  showExportModal.value = false;
  exportPassphrase.value = "";
  exportedMnemonic.value = "";
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert("Copied to clipboard!");
  }).catch(() => {
    alert("Failed to copy to clipboard");
  });
}
</script>

<style scoped>
details > summary { list-style: none; }
details > summary::-webkit-details-marker { display: none; }
</style>
