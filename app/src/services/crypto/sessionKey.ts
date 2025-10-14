'use client'

import { bytesToHex, hexToBytes } from '../../lib/hex'

export type EncryptedSessionPayload = {
  ct: string
  iv: string
  salt: string
  exp: number
  algo: 'AES-GCM'
  kdf: 'PBKDF2'
}

type BuildTypedDataParams = {
  evmAddress: string
  audience: string
  scope: string
  permissions: string[]
  ttlMs: number
  chainId: number
}

export function buildEip712TypedData(params: BuildTypedDataParams) {
  const nowMs = Date.now()
  const nonceBytes = crypto.getRandomValues(new Uint8Array(32))
  const nonce = bytesToHex(nonceBytes)
  const deadline = BigInt(Math.floor((nowMs + params.ttlMs) / 1000))

  const domain = {
    name: 'GenLayer Session Authorization',
    version: '1',
    chainId: params.chainId,
    verifyingContract: '0x0000000000000000000000000000000000000000',
  }

  const types = {
    Session: [
      { name: 'kind', type: 'string' },
      { name: 'evmAddress', type: 'address' },
      { name: 'audience', type: 'string' },
      { name: 'scope', type: 'string' },
      { name: 'permissions', type: 'string[]' },
      { name: 'nonce', type: 'bytes32' },
      { name: 'deadline', type: 'uint256' },
    ],
  } as const

  const message = {
    kind: 'GL_SESSION',
    evmAddress: params.evmAddress,
    audience: params.audience,
    scope: params.scope,
    permissions: params.permissions,
    nonce: `0x${nonce}` as const,
    deadline,
  }

  return { domain, types, primaryType: 'Session' as const, message }
}

async function hkdfSha256(ikm: Uint8Array, salt: Uint8Array, info: Uint8Array, length: number): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey('raw', ikm.buffer as ArrayBuffer, 'HKDF', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', salt: salt.buffer as ArrayBuffer, info: info.buffer as ArrayBuffer, hash: 'SHA-256' },
    keyMaterial,
    length * 8
  )
  return new Uint8Array(bits)
}

function isValidSecpScalar(bytes: Uint8Array): boolean {
  if (bytes.length !== 32) return false
  // Quick check: not all zeros
  return bytes.some(b => b !== 0)
}

export async function deriveSessionSeedFromSignature(params: {
  signature: string
  domainSalt: string
  nonce: string
  audience: string
}): Promise<Uint8Array> {
  const ikm = new Uint8Array(hexToBytes(params.signature.replace(/^0x/, '')))
  const salt = new Uint8Array(hexToBytes(params.domainSalt.replace(/^0x/, '')))
  const infoLeft = new Uint8Array(hexToBytes(params.nonce.replace(/^0x/, '')))
  const infoRight = new TextEncoder().encode(params.audience)
  const info = new Uint8Array(infoLeft.length + infoRight.length)
  info.set(infoLeft, 0)
  info.set(infoRight, infoLeft.length)

  let counter = 0
  while (true) {
    const ctr = new Uint8Array([counter])
    const infoWithCtr = new Uint8Array(info.length + ctr.length)
    infoWithCtr.set(info, 0)
    infoWithCtr.set(ctr, info.length)
    const out = await hkdfSha256(ikm, salt, infoWithCtr, 32)
    if (isValidSecpScalar(out)) {
      return out
    }
    counter++
  }
}

export function makeGenLayerPrivateKeyFromSeed(seed: Uint8Array): Uint8Array {
  if (seed.length !== 32) throw new Error('Seed must be 32 bytes')
  return seed
}

async function importPbkdf2Key(passphrase: string) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveKey'])
}

async function deriveAesGcmKey(pbkdf2Key: CryptoKey, salt: Uint8Array) {
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations: 120000, hash: 'SHA-256' },
    pbkdf2Key,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptSessionKey(params: { privKey: Uint8Array; passphrase: string; ttlMs: number }): Promise<EncryptedSessionPayload> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const pbkdf2Key = await importPbkdf2Key(params.passphrase)
  const aesKey = await deriveAesGcmKey(pbkdf2Key, salt)
  const exp = Date.now() + params.ttlMs
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, params.privKey.buffer as ArrayBuffer)
  const payload: EncryptedSessionPayload = {
    ct: bytesToHex(new Uint8Array(ct)),
    iv: bytesToHex(iv),
    salt: bytesToHex(salt),
    exp,
    algo: 'AES-GCM',
    kdf: 'PBKDF2',
  }
  // Zeroize
  params.privKey.fill(0)
  return payload
}

export async function decryptSessionKey(params: { payload: EncryptedSessionPayload; passphrase: string }): Promise<Uint8Array> {
  const { payload, passphrase } = params
  if (Date.now() > payload.exp) throw new Error('Session expired')
  const pbkdf2Key = await importPbkdf2Key(passphrase)
  const aesKey = await deriveAesGcmKey(pbkdf2Key, new Uint8Array(hexToBytes(payload.salt)))
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(hexToBytes(payload.iv)) },
    aesKey,
    new Uint8Array(hexToBytes(payload.ct))
  )
  return new Uint8Array(pt)
}


