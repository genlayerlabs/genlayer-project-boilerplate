'use client'

import { createClient, createAccount as glCreateAccount, generatePrivateKey } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { encryptString, decryptString } from "../lib/crypto";
import {
  buildEip712TypedData,
  deriveSessionSeedFromSignature,
  makeGenLayerPrivateKeyFromSeed,
  encryptSessionKey,
  decryptSessionKey,
  type EncryptedSessionPayload,
} from "./crypto/sessionKey";
import { bytesToHex } from "../lib/hex";
import { pubsub } from "../lib/pubsub";
import { safeLocalStorage, safeSessionStorage } from "../lib/safe-storage";

// Client instance cache to avoid recreating clients on every call
const clientCache = new Map<string, any>();
const cacheTimeout = 5 * 60 * 1000; // 5 minutes

const ENC_KEY = "gl.enc.account.v1";
const SES_KEY = "gl.session.priv.v1";
const LAST_ADDR = "gl.last.address.v1";
const MNEMONIC_KEY = "gl.enc.mnemonic.v1";
const SES_AUTH_KEY = "gl.enc.session.v1"; // legacy key (kept for backward-compat)
const SES_V1_KEY = "gl:session:v1"; // new key per spec (encrypted)
const SES_RAW_KEY = "gl:session:raw"; // ephemeral raw session (no passphrase)

// State management
let _localAccount: any = null;
let _sessionAccount: any = null;
let _readOnlyAccount: any = null; // fallback account for read-only calls
let _externalEvmAddress: string | undefined;
let _primaryOnchainEngine: 'local' | 'session' | null = null;
let _endpoint: string | undefined = undefined;

// Initialize endpoint from environment; prefer Studionet unless overridden
try {
  const envUrl = (typeof process !== 'undefined' && process.env && (process.env.NEXT_PUBLIC_STUDIO_URL as string)) || undefined;
  _endpoint = envUrl || 'https://studio.genlayer.com/api';
} catch (e) {
  _endpoint = 'https://studio.genlayer.com/api';
}

// Type definitions
export interface ActiveAddresses {
  localAddress?: string;
  sessionAddress?: string;
  externalEvmAddress?: string;
}

export interface RouterState {
  primaryOnchainEngine: 'local' | 'session' | null;
  localAddress?: string;
  sessionAddress?: string;
  externalEvmAddress?: string;
  isConnectedLocal: boolean;
  isConnectedSession: boolean;
  isConnectedEvm: boolean;
}

// Basic address validation utilities
function validateAddress(address: string): `0x${string}` {
  // Simple validation - genlayer-js will handle proper validation
  if (!address.startsWith('0x') || address.length !== 42) {
    throw new Error(`Invalid address: ${address}`);
  }
  return address as `0x${string}`;
}

function normalizeAddress(addr: string | undefined | null): `0x${string}` {
  if (!addr) throw new Error('Contract address not configured');
  const a = String(addr).trim();
  if (!/^0x[0-9a-fA-F]{40}$/.test(a)) {
    throw new Error(`Invalid contract address format: ${addr}`);
  }
  // Preserve original casing (checksum or mixed-case) as provided
  return a as `0x${string}`;
}

// Basic private key format validation
function validatePrivateKey(privKey: string): `0x${string}` {
  // Private key should be 64 hex characters + 0x prefix = 66 total
  if (!privKey.startsWith('0x') || privKey.length !== 66) {
    throw new Error(`Invalid private key: ${privKey}`);
  }
  return privKey as `0x${string}`;
}

// Local wallet functions
export function setAccountFromPrivKey(privHex: string) {
  try {
    console.log('Setting account from private key:', privHex);
    const validatedKey = validatePrivateKey(privHex);
    console.log('Validated private key:', validatedKey);
    _localAccount = glCreateAccount(validatedKey);
    console.log('Created account:', _localAccount);
    safeLocalStorage.setItem(LAST_ADDR, _localAccount.address);
    pubsub.emit('accountChanged', { address: _localAccount.address });
    pubsub.emit('routerChanged', getRouterState());
    return _localAccount;
  } catch (error) {
    console.error('Error setting account from private key:', error);
    throw error;
  }
}

export async function saveEncryptedPrivKey(privHex: string, passphrase: string) {
  const payload = await encryptString(privHex, passphrase);
  safeLocalStorage.setItem(ENC_KEY, JSON.stringify(payload));
}

export async function saveEncryptedMnemonic(mnemonic: string, passphrase: string) {
  const payload = await encryptString(mnemonic, passphrase);
  safeLocalStorage.setItem(MNEMONIC_KEY, JSON.stringify(payload));
}

export function getEncryptedMnemonic(): string | null {
  // Check localStorage first (encrypted with passphrase)
  const encrypted = safeLocalStorage.getItem(MNEMONIC_KEY);
  if (encrypted) {
    console.log('Found encrypted mnemonic in localStorage:', encrypted);
    return encrypted;
  }
  
  // Check sessionStorage (plain mnemonic for session mode)
  const session = safeSessionStorage.getItem(MNEMONIC_KEY);
  if (session) {
    console.log('Found session mnemonic in sessionStorage:', session);
    return session;
  }
  
  console.log('No mnemonic found in storage');
  return null;
}

export async function createAccountSecure(passphrase?: string) {
  try {
    // Generate mnemonic first, then derive private key from it
    const { createNewWallet } = await import('../lib/localWallet');
    const wallet = createNewWallet();
    console.log('Generated mnemonic:', wallet.mnemonic);
    console.log('Generated private key:', wallet.privateKey);
    
    // Ensure private key has 0x prefix
    const privWithPrefix = wallet.privateKey.startsWith('0x') ? wallet.privateKey : `0x${wallet.privateKey}`;
    console.log('Private key with prefix:', privWithPrefix);
    
    setAccountFromPrivKey(privWithPrefix);
    
    if (passphrase) {
      await saveEncryptedPrivKey(privWithPrefix, passphrase);
      await saveEncryptedMnemonic(wallet.mnemonic, passphrase);
      safeSessionStorage.removeItem(SES_KEY);
    } else {
      safeSessionStorage.setItem(SES_KEY, privWithPrefix);
      // Also save mnemonic in session storage for export functionality
      const mnemonicPayload = {
        encrypted: wallet.mnemonic, // Store plain mnemonic in session mode
        salt: '',
        iv: '',
        iterations: 0
      };
      console.log('Saving session mnemonic payload:', mnemonicPayload);
      safeSessionStorage.setItem(MNEMONIC_KEY, JSON.stringify(mnemonicPayload));
    }
    console.log('Account created successfully:', _localAccount);
    return _localAccount;
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
}

export async function importPrivKeySecure(privHex: string, passphrase: string) {
  // Ensure private key has 0x prefix
  const privWithPrefix = privHex.startsWith('0x') ? privHex : `0x${privHex}`;
  setAccountFromPrivKey(privWithPrefix);
  await saveEncryptedPrivKey(privWithPrefix, passphrase);
  safeSessionStorage.removeItem(SES_KEY);
  return _localAccount;
}

export async function importMnemonicSecure(mnemonic: string, passphrase: string) {
  const { walletFromMnemonic } = await import('../lib/localWallet');
  const wallet = walletFromMnemonic(mnemonic);
  return await importPrivKeySecure(wallet.privateKey, passphrase);
}

// Utility to verify hot reload state during debugging
export function testCodeLoaded() {
  console.log('✅ NEW CODE IS LOADED! Current timestamp:', new Date().toISOString());
  return true;
}

export async function unlockWithPassphrase(passphrase: string) {
  console.log('🔓 UNLOCK DEBUG START - NEW CODE LOADED!');
  console.log('Looking for ENC_KEY:', ENC_KEY);
  console.log('Looking for MNEMONIC_KEY:', MNEMONIC_KEY);
  
  // First try to unlock from encrypted private key
  const rawPrivKey = safeLocalStorage.getItem(ENC_KEY);
  console.log('Raw private key found:', !!rawPrivKey);
  if (rawPrivKey) {
    try {
      const payload = JSON.parse(rawPrivKey);
      const priv = await decryptString(payload, passphrase);
      console.log('Successfully unlocked from private key');
      return setAccountFromPrivKey(priv);
    } catch (error) {
      console.log('Failed to unlock from private key, trying mnemonic...', error);
    }
  }
  
  // If no private key or failed, try to unlock from encrypted mnemonic (localStorage first)
  let rawMnemonic = safeLocalStorage.getItem(MNEMONIC_KEY);
  console.log('Raw mnemonic (localStorage) found:', !!rawMnemonic);
  if (!rawMnemonic) {
    // Fallback to sessionStorage (session-mode wallets)
    rawMnemonic = safeSessionStorage.getItem(MNEMONIC_KEY);
    console.log('Raw mnemonic (sessionStorage) found:', !!rawMnemonic);
  }
  
  if (!rawMnemonic) {
    console.log('No encrypted key found in either location');
    throw new Error('No encrypted key found');
  }
  
  const payload = JSON.parse(rawMnemonic);
  console.log('Mnemonic payload structure:', payload);
  
  // Detect encrypted vs session-mode payload
  let mnemonic: string;
  const isEncrypted = !!(payload && payload.salt && payload.iv && payload.data && payload.salt !== '' && payload.iv !== '');
  if (isEncrypted) {
    console.log('Detected encrypted mnemonic payload, attempting decryption...');
    mnemonic = await decryptString(payload, passphrase);
    console.log('Decrypted mnemonic successfully');
  } else if (payload && typeof payload.encrypted === 'string' && payload.encrypted.length > 0) {
    console.log('Detected session-mode mnemonic payload (plain).');
    mnemonic = payload.encrypted;
  } else if (typeof payload === 'string') {
    // Legacy plain string stored
    console.log('Detected legacy plain mnemonic string.');
    mnemonic = payload;
  } else {
    throw new Error('Unsupported mnemonic payload format');
  }
  
  // Import the mnemonic to create account
  const { walletFromMnemonic } = await import('../lib/localWallet');
  const wallet = walletFromMnemonic(mnemonic);
  
  // Ensure private key has 0x prefix
  const privWithPrefix = wallet.privateKey.startsWith('0x') ? wallet.privateKey : `0x${wallet.privateKey}`;
  console.log('=== UNLOCK DEBUG END - SUCCESS ===');
  return setAccountFromPrivKey(privWithPrefix);
}

export function tryLoadSession() {
  const priv = safeSessionStorage.getItem(SES_KEY);
  return priv ? setAccountFromPrivKey(priv) : null;
}

export function clearAccount() {
  _localAccount = null;
  _sessionAccount = null;
  _externalEvmAddress = undefined;
  _primaryOnchainEngine = null;
  // Preserve encrypted secrets (ENC_KEY, MNEMONIC_KEY) so users can unlock later
  // Only clear volatile/session-related entries
  safeLocalStorage.removeItem(LAST_ADDR);
  safeLocalStorage.removeItem(SES_AUTH_KEY);
  safeSessionStorage.removeItem(SES_KEY);
  pubsub.emit('accountChanged', null);
  pubsub.emit('routerChanged', getRouterState());
}

// Client management
export function makeClient({ allowReadOnly = true }: { allowReadOnly?: boolean } = {}) {
  let acc = _primaryOnchainEngine === 'session' ? _sessionAccount : _localAccount;
  // For read-only access on Studionet, provide a temporary in-memory account if none connected
  if (!acc && allowReadOnly) {
    if (!_readOnlyAccount) {
      try {
        // createAccount() with no args generates a new keypair
        _readOnlyAccount = glCreateAccount();
      } catch (e) {
        console.warn('Failed to create read-only account fallback:', e);
      }
    }
    acc = _readOnlyAccount || acc;
  }
  if (!acc && !allowReadOnly) {
    console.warn("No account available for client creation");
    return null;
  }

  const accountAddress = acc ? acc.address : 'readOnly';
  const cacheKey = `client_${accountAddress}_${_primaryOnchainEngine ?? 'none'}`;
  
  // Check cache first
  const cached = clientCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < cacheTimeout) {
    console.log("Using cached client for", accountAddress);
    return cached.client;
  }

  try {
    // Create client with Studionet chain per SDK docs
    const config: any = { 
      chain: studionet,
    };
    if (acc) {
      config.account = acc;
    }
    
    // Add custom endpoint if available
    if (_endpoint) {
      config.endpoint = _endpoint;
    }
    
    const client = createClient(config);
    
    // Cache the client
    clientCache.set(cacheKey, {
      client,
      timestamp: Date.now()
    });
    
    console.log("Client created and cached successfully");
    return client;
  } catch (error) {
    console.error("Failed to create client:", error);
    return null;
  }
}

export function setEndpoint(url?: string) { 
  _endpoint = url || undefined; 
}

export function getAccount() { 
  return _localAccount; 
}

export function getLastAddress(): string { 
  return safeLocalStorage.getItem(LAST_ADDR) || "";
}

export function onAccountChanged(fn: (account: any) => void) {
  return pubsub.on('accountChanged', fn);
}

// ------------------- Enhanced Router API -------------------

export function onRouterChanged(fn: (state: RouterState) => void) {
  return pubsub.on('routerChanged', fn);
}

export function getRouterState(): RouterState {
  return {
    primaryOnchainEngine: _primaryOnchainEngine,
    localAddress: _localAccount?.address ? String(_localAccount.address) : undefined,
    sessionAddress: _sessionAccount?.address ? String(_sessionAccount.address) : undefined,
    externalEvmAddress: _externalEvmAddress ? String(_externalEvmAddress) : undefined,
    isConnectedLocal: !!_localAccount,
    isConnectedSession: !!_sessionAccount,
    isConnectedEvm: !!_externalEvmAddress,
  };
}

export function setPrimaryOnchainEngine(engine: 'local' | 'session') {
  _primaryOnchainEngine = engine;
  pubsub.emit('routerChanged', getRouterState());
}

export function getActiveAddresses(): ActiveAddresses {
  return {
    localAddress: _localAccount?.address,
    sessionAddress: _sessionAccount?.address,
    externalEvmAddress: _externalEvmAddress,
  };
}

// Session management
export async function createSessionFromEvmSignature(params: {
  evmAddress: string;
  typedData: any; // EIP-712 payload user signs in wagmi
  signature: string;
  passphrase: string;
  ttlMs?: number;
}) {
  const ttlMs = params.ttlMs ?? 7 * 24 * 60 * 60 * 1000;
  const audience: string = params.typedData?.message?.audience || 'genlayer:studionet';
  const nonce: string = params.typedData?.message?.nonce || '0x' + '00'.repeat(32);
  // Derive a stable domain salt from domain name to avoid requiring extra hash deps
  const domainSaltHex = '0x' + Array.from(new TextEncoder().encode('GL_SESSION_V1')).map(b => b.toString(16).padStart(2, '0')).join('');

  // 1) HKDF-SHA256 from signature → seed
  const seed32 = await deriveSessionSeedFromSignature({
    signature: params.signature,
    domainSalt: domainSaltHex,
    nonce,
    audience,
  });

  // 2) Make GenLayer private key from seed
  const privKeyBytes = makeGenLayerPrivateKeyFromSeed(seed32);
  const privHex = ("0x" + bytesToHex(privKeyBytes)) as `0x${string}`;

  // 3) Create session account
  _sessionAccount = glCreateAccount(privHex);
  _externalEvmAddress = validateAddress(params.evmAddress);
  _primaryOnchainEngine = 'session';

  // 4) Persist session key
  if (params.passphrase && params.passphrase.length >= 8) {
    // Encrypted, long-lived
    const encPayload = await encryptSessionKey({ privKey: privKeyBytes, passphrase: params.passphrase, ttlMs });
    safeLocalStorage.setItem(SES_V1_KEY, JSON.stringify(encPayload));
    // Clear any raw session
    safeSessionStorage.removeItem(SES_RAW_KEY);
  } else {
    // Ephemeral raw session in sessionStorage
    const expiry = Date.now() + ttlMs;
    safeSessionStorage.setItem(SES_RAW_KEY, JSON.stringify({ priv: "0x" + bytesToHex(privKeyBytes), exp: expiry }));
  }

  pubsub.emit('routerChanged', getRouterState());
  return { sessionAddress: _sessionAccount.address };
}

export async function initClientFromSession(passphrase: string) {
  // First: check raw ephemeral session
  const rawEphemeral = safeSessionStorage.getItem(SES_RAW_KEY);
  if (rawEphemeral) {
    try {
      const { priv, exp } = JSON.parse(rawEphemeral || '{}');
      if (priv && exp && Date.now() < Number(exp)) {
        _sessionAccount = glCreateAccount(priv as `0x${string}`);
        _primaryOnchainEngine = 'session';
        const config: any = { chain: studionet, account: _sessionAccount };
        if (_endpoint) config.endpoint = _endpoint;
        const client = createClient(config);
        await client.initializeConsensusSmartContract();
        pubsub.emit('routerChanged', getRouterState());
        return true;
      }
    } catch (e) {
      console.warn('Failed to load raw session:', e);
    }
  }

  // Else: encrypted session in localStorage
  const rawNew = safeLocalStorage.getItem(SES_V1_KEY);
  if (!rawNew) return false;
  try {
    const payload: EncryptedSessionPayload = JSON.parse(rawNew);
    const privBytes = await decryptSessionKey({ payload, passphrase });
    const privHex = ("0x" + bytesToHex(privBytes)) as `0x${string}`;
    _sessionAccount = glCreateAccount(privHex);
    _primaryOnchainEngine = 'session';
    const config: any = { chain: studionet, account: _sessionAccount };
    if (_endpoint) config.endpoint = _endpoint;
    const client = createClient(config);
    await client.initializeConsensusSmartContract();
    pubsub.emit('routerChanged', getRouterState());
    return true;
  } catch (e) {
    console.error('initClientFromSession (encrypted) failed:', e);
    return false;
  }
}

export async function initClientFromLocal(passphrase: string) {
  try {
    await unlockWithPassphrase(passphrase);
    _primaryOnchainEngine = 'local';
    pubsub.emit('routerChanged', getRouterState());
    return true;
  } catch {
    return false;
  }
}

export function revokeSession() {
  _sessionAccount = null;
  _externalEvmAddress = undefined;
  safeLocalStorage.removeItem(SES_AUTH_KEY);
  safeLocalStorage.removeItem(SES_V1_KEY);
  if (!_localAccount) _primaryOnchainEngine = null; else _primaryOnchainEngine = 'local';
  pubsub.emit('routerChanged', getRouterState());
}

// ------------------- IO Wrappers -------------------

export async function read(method: string, args: any[] = []) {
  const client = makeClient({ allowReadOnly: true });
  
  const resolvedAddr = process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0xA3E91f209D40949A23d5b54e8A4949E578fdeB0E';
  const address = normalizeAddress(resolvedAddr);
  console.log('Reading contract:', { method, args, address, endpoint: _endpoint, chain: 'studionet', envAddr: resolvedAddr });
  
  try {
    // Try direct read first
    return await client.readContract({ address, functionName: method, args });
  } catch (error) {
    console.warn('Direct read failed, initializing consensus contract and retrying...', error);
    try {
      await client.initializeConsensusSmartContract();
      const result = await client.readContract({ address, functionName: method, args });
      return result;
    } catch (err2) {
      console.error('Error fetching gen_call from GenLayer RPC after init:', err2);
      try {
        const schema = await client.getContractSchema({ address });
        console.log('Contract schema (diagnostic):', schema);
      } catch (e) {
        console.warn('Failed to fetch contract schema for diagnostics:', e);
      }
      throw err2;
    }
  }
}

export async function writeWithFinality(method: string, args: any[] = [], opts?: { retries?: number; interval?: number; status?: any }) {
  // Writes require an account; session or local
  if (!_localAccount && !_sessionAccount) {
    throw new Error('No account available for write operation');
  }
  const client = makeClient({ allowReadOnly: false });
  if (!client) {
    throw new Error('No client available');
  }
  
  const address = normalizeAddress(process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0xA3E91f209D40949A23d5b54e8A4949E578fdeB0E');
  console.log('Writing contract:', { method, args, address, endpoint: _endpoint });
  
  try {
    // Initialize consensus smart contract first
    await client.initializeConsensusSmartContract();
    
    const hash = await client.writeContract({ 
      address, 
      functionName: method, 
      args, 
      value: BigInt(0) 
    });
    
    const status = opts?.status ?? 'FINALIZED';
    const retries = opts?.retries ?? 200;
    const interval = opts?.interval ?? 3000;
    
    const receipt = await client.waitForTransactionReceipt({ 
      hash, 
      status, 
      retries, 
      interval 
    });
    
    return receipt;
  } catch (error) {
    console.error('Error writing contract:', error);
    throw error;
  }
}

export async function getTransaction(params: { hash: string }) {
  const client = makeClient();
  return client.getTransaction({ hash: params.hash as any });
}

export async function waitForTransactionReceipt(params: { hash: string; status?: any; retries?: number; interval?: number }) {
  const client = makeClient();
  return client.waitForTransactionReceipt({ ...params, hash: params.hash as any });
}

export async function appealTransaction(params: { txId: string }) {
  const client = makeClient();
  return client.appealTransaction({ txId: params.txId as any });
}

// Utility to verify contract address is valid and reachable on studionet
export async function verifyContractAddress(address?: `0x${string}`) {
  const client = makeClient({ allowReadOnly: true });
  const addr = address || (process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS as `0x${string}`);
  if (!addr) throw new Error('Missing contract address');
  await client.initializeConsensusSmartContract();
  const schema = await client.getContractSchema({ address: addr });
  return schema;
}
