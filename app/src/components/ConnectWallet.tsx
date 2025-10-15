'use client'

import React, { useState, useEffect, lazy, Suspense, memo, useCallback } from 'react'
import { useAccount as useEvmAccount, useConnect, useDisconnect, useChainId, useSignTypedData } from 'wagmi'
import { useConfig } from 'wagmi'
import { injected } from 'wagmi/connectors'
import {
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  Box,
  Collapse,
  TextField,
  Button,
  Alert,
  Snackbar,
  CircularProgress,
  InputAdornment,
  IconButton,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material'
import {
  Lock,
  Visibility,
  VisibilityOff,
  VpnKey,
  AccountBalanceWallet,
  CheckCircle,
  ContentCopy,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material'

// Lazy-load heavier components
const CreateBetDialog = lazy(() => import('./CreateBetDialog'))
// SessionManagement removed

// Session key functions removed
import {
  createAccountSecure,
  importPrivKeySecure,
  importMnemonicSecure,
  unlockWithPassphrase,
  getEncryptedMnemonic,
  clearAccount,
  onAccountChanged,
  createSessionFromEvmSignature,
  initClientFromSession,
  setPrimaryOnchainEngine,
  testCodeLoaded,
} from '../services/genlayer'
import { buildEip712TypedData } from '../services/crypto/sessionKey'
import { encryptString, decryptString } from '../lib/crypto'
import { safeLocalStorage, safeSessionStorage } from '../lib/safe-storage'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

const TabPanel = memo(function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`wallet-tabpanel-${index}`}
      aria-labelledby={`wallet-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  )
})

interface ConnectWalletProps {
  onConnected?: (address: string) => void
}

const ConnectWallet = memo(function ConnectWallet({ onConnected }: ConnectWalletProps) {
  // State management
  const [tabValue, setTabValue] = useState(0)
  const [connectedAddr, setConnectedAddr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  })

  // Create wallet state
  const [createPass, setCreatePass] = useState('')
  const [createPass2, setCreatePass2] = useState('')
  const [createStep, setCreateStep] = useState(0)
  const [showCreatePass, setShowCreatePass] = useState(false)
  const [showCreatePass2, setShowCreatePass2] = useState(false)

  // Import mnemonic state
  const [importMnemonic, setImportMnemonic] = useState('')
  const [importPass, setImportPass] = useState('')
  const [showImportPass, setShowImportPass] = useState(false)

  // Import private key state
  const [importPrivKey, setImportPrivKey] = useState('')
  const [importPrivPass, setImportPrivPass] = useState('')
  const [showImportPrivPass, setShowImportPrivPass] = useState(false)

  // Unlock state
  const [unlockPass, setUnlockPass] = useState('')
  const [showUnlockPass, setShowUnlockPass] = useState(false)

  // Export state
  const [exportPassphrase, setExportPassphrase] = useState('')
  const [showExportPassphrase, setShowExportPassphrase] = useState(false)
  const [exportedMnemonic, setExportedMnemonic] = useState('')
  const [showMnemonic, setShowMnemonic] = useState(false)

  // EVM state
  const [evmAddress, setEvmAddress] = useState<string | null>(null)
  const [sessionPassphrase, setSessionPassphrase] = useState('')
  const [showSessionPassphrase, setShowSessionPassphrase] = useState(false)
  const [authorizeStep, setAuthorizeStep] = useState(0)
  const [localCollapsed, setLocalCollapsed] = useState(true)

  // Wagmi hooks
  const { address: evmAccountAddress, isConnected: isEvmConnected } = useEvmAccount()
  const { connect: evmConnect, connectors } = useConnect()
  const { disconnect: evmDisconnect } = useDisconnect()
  const config = useConfig()
  const chainId = useChainId()
  const { signTypedDataAsync } = useSignTypedData()

  // Optimized handlers with useCallback
  const showSnackbar = useCallback((message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity })
  }, [])

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }, [])

  const handleCreate = useCallback(async () => {
    if (!createPass || createPass !== createPass2) {
      showSnackbar('Passphrase mismatch', 'error')
      return
    }
    
    setLoading(true)
    try {
      const account = await createAccountSecure(createPass)
      console.log('Wallet created successfully:', account);
      
      // Force set connectedAddr immediately
      if (account?.address) {
        setConnectedAddr(account.address)
        onConnected?.(account.address)
        showSnackbar('Wallet created and connected successfully!')
      }
      
      setCreateStep(2)
      
      // Show mnemonic for user to save
      const encryptedMnemonic = getEncryptedMnemonic()
      if (encryptedMnemonic) {
        try {
          const payload = JSON.parse(encryptedMnemonic)
          // If it's a plain mnemonic from session storage, it won't have salt/iv/data
            const mnemonic = (payload.salt && payload.iv && payload.data && payload.salt !== '' && payload.iv !== '') 
              ? await decryptString(payload, createPass) 
              : payload.encrypted;
          setExportedMnemonic(mnemonic)
          setShowMnemonic(true)
        } catch (error) {
          console.error('Failed to decrypt mnemonic for display:', error)
        }
      }
    } catch (error) {
      console.error('Failed to create wallet:', error);
      showSnackbar('Failed to create wallet', 'error')
    } finally {
      setLoading(false)
    }
  }, [createPass, createPass2, showSnackbar, onConnected])

  const handleImportMnemonic = useCallback(async () => {
    if (!importMnemonic.trim() || !importPass) {
      showSnackbar('Please fill in all fields', 'error')
      return
    }
    
    setLoading(true)
    try {
      const account = await importMnemonicSecure(importMnemonic.trim(), importPass)
      console.log('Wallet imported successfully:', account);
      
      if (account?.address) {
        setConnectedAddr(account.address)
        onConnected?.(account.address)
        showSnackbar('Wallet imported and connected successfully!')
      }
    } catch (error) {
      console.error('Failed to import wallet:', error);
      showSnackbar('Failed to import wallet', 'error')
    } finally {
      setLoading(false)
    }
  }, [importMnemonic, importPass, showSnackbar, onConnected])

  const handleImportPrivKey = useCallback(async () => {
    if (!importPrivKey.trim() || !importPrivPass) {
      showSnackbar('Please fill in all fields', 'error')
      return
    }
    
    setLoading(true)
    try {
      const account = await importPrivKeySecure(importPrivKey.trim(), importPrivPass)
      console.log('Wallet imported successfully:', account);
      
      if (account?.address) {
        setConnectedAddr(account.address)
        onConnected?.(account.address)
        showSnackbar('Wallet imported and connected successfully!')
      }
    } catch (error) {
      console.error('Failed to import wallet:', error);
      showSnackbar('Failed to import wallet', 'error')
    } finally {
      setLoading(false)
    }
  }, [importPrivKey, importPrivPass, showSnackbar, onConnected])

  const handleUnlock = useCallback(async () => {
    if (!unlockPass) {
      showSnackbar('Please enter passphrase', 'error')
      return
    }
    
    setLoading(true)
    try {
      const account = await unlockWithPassphrase(unlockPass)
      console.log('Wallet unlocked successfully:', account);
      
      if (account?.address) {
        setConnectedAddr(account.address)
        onConnected?.(account.address)
        showSnackbar('Wallet unlocked and connected successfully!')
      }
    } catch (error) {
      console.error('Failed to unlock wallet:', error);
      showSnackbar('Invalid passphrase', 'error')
    } finally {
      setLoading(false)
    }
  }, [unlockPass, showSnackbar, onConnected])

  const handleDisconnect = useCallback(async () => {
    try {
      await clearAccount()
      setConnectedAddr(null)
      setEvmAddress(null)
      setCreateStep(0)
      setAuthorizeStep(0)
      setShowMnemonic(false)
      setExportedMnemonic('')
      showSnackbar('Wallet disconnected')
    } catch (error) {
      console.error('Failed to disconnect wallet:', error);
      showSnackbar('Failed to disconnect wallet', 'error')
    }
  }, [showSnackbar])

  const confirmExport = useCallback(async () => {
    try {
      const encryptedMnemonic = getEncryptedMnemonic()
      
      if (!encryptedMnemonic) {
        showSnackbar('No mnemonic found', 'error')
        return
      }

      const payload = JSON.parse(encryptedMnemonic)
      
      // Check if it's encrypted (has salt, iv, data) or plain (session mode)
      let mnemonic: string;
      if (payload.salt && payload.iv && payload.data && payload.salt !== '' && payload.iv !== '') {
        // Encrypted mnemonic - need passphrase
        if (!exportPassphrase) {
          showSnackbar('Passphrase required for encrypted wallet', 'error')
          return
        }
        mnemonic = await decryptString(payload, exportPassphrase)
      } else {
        // Plain mnemonic (session mode) - no passphrase needed
        mnemonic = payload.encrypted;
      }
      
      setExportedMnemonic(mnemonic)
      setShowMnemonic(true)
      showSnackbar('Recovery phrase exported successfully!')
    } catch (error) {
      console.error('Export error:', error);
      showSnackbar('Invalid passphrase', 'error')
    }
  }, [exportPassphrase, showSnackbar])

  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(exportedMnemonic)
      showSnackbar('Copied to clipboard!')
    } catch (error) {
      console.error('Copy error:', error);
      showSnackbar('Failed to copy', 'error')
    }
  }, [exportedMnemonic, showSnackbar])

  const testMnemonicStorage = useCallback(() => {
    console.log('=== Testing Mnemonic Storage ===');
    console.log('localStorage mnemonic:', safeLocalStorage.getItem('gl.enc.mnemonic.v1'));
    console.log('sessionStorage mnemonic:', safeSessionStorage.getItem('gl.enc.mnemonic.v1'));
    console.log('getEncryptedMnemonic result:', getEncryptedMnemonic());
    console.log('=== End Test ===');
  }, [])

  // EVM handlers
  const handleEvmConnect = useCallback(async () => {
    try {
      const connector = connectors.find(c => c.id === 'injected')
      if (connector) {
        await evmConnect({ connector })
      }
    } catch (error) {
      console.error('Failed to connect EVM wallet:', error)
      showSnackbar('Failed to connect EVM wallet', 'error')
    }
  }, [evmConnect, connectors, showSnackbar])

  const handleEvmDisconnect = useCallback(async () => {
    try {
      await evmDisconnect()
      setEvmAddress(null)
      setAuthorizeStep(0)
    } catch (error) {
      console.error('Failed to disconnect EVM wallet:', error)
      showSnackbar('Failed to disconnect EVM wallet', 'error')
    }
  }, [evmDisconnect, showSnackbar])

  const onAuthorizeSession = useCallback(async (opts?: { auto?: boolean }) => {
    if (!evmAccountAddress) {
      showSnackbar('Please connect EVM wallet', 'error')
      return
    }

    setLoading(true)
    try {
      const audience = 'genlayer:studionet'
      const typed = buildEip712TypedData({
        evmAddress: evmAccountAddress,
        audience,
        scope: 'football_bets',
        permissions: ['create_bet','resolve_bet'],
        ttlMs: 2 * 60 * 60 * 1000, // 2h for auto-session
        chainId: chainId || 61999,
      })

      const signature = await signTypedDataAsync({
        domain: typed.domain as any,
        types: typed.types as any,
        primaryType: 'Session',
        message: typed.message as any,
        account: evmAccountAddress as `0x${string}`,
      })

      // No passphrase for auto-session; store raw ephemeral session
      await createSessionFromEvmSignature({
        evmAddress: evmAccountAddress,
        typedData: typed,
        signature,
        passphrase: opts?.auto ? '' : sessionPassphrase,
        ttlMs: 2 * 60 * 60 * 1000,
      })

      const ok = await initClientFromSession(opts?.auto ? '' : sessionPassphrase)
      if (!ok) {
        showSnackbar('Session init failed', 'error')
        setLoading(false)
        return
      }

      setPrimaryOnchainEngine('session')
      setEvmAddress(evmAccountAddress)
      setAuthorizeStep(2)
      showSnackbar('Session ready ✓')
      setSessionPassphrase('')
    } catch (error: any) {
      const msg = (error?.code === 4001 || /rejected/i.test(String(error?.message)))
        ? 'Signature rejected'
        : 'Failed to authorize session'
      console.error('Failed to authorize session:', error)
      showSnackbar(msg, 'error')
    } finally {
      setLoading(false)
    }
  }, [evmAccountAddress, sessionPassphrase, chainId, signTypedDataAsync, showSnackbar])

  // Effects
  useEffect(() => {
    const unsubscribe = onAccountChanged((address) => {
      console.log('Account changed:', address);
      setConnectedAddr(address)
      if (address) {
        onConnected?.(address)
      }
    })

    return unsubscribe
  }, [onConnected])

  useEffect(() => {
    if (isEvmConnected && evmAccountAddress) {
      setEvmAddress(evmAccountAddress)
      // Auto-authorize session (no passphrase)
      if (authorizeStep === 0) {
        setAuthorizeStep(1)
        onAuthorizeSession({ auto: true })
      }
    }
  }, [isEvmConnected, evmAccountAddress, authorizeStep, onAuthorizeSession])

  if (connectedAddr) {
    return (
      <Card sx={{ mb: 3 }}>
        <CardHeader
          title="Wallet Connected"
          avatar={<CheckCircle color="success" />}
          action={
            <Button variant="outlined" onClick={handleDisconnect}>
              Disconnect
            </Button>
          }
        />
        <CardContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Address: {connectedAddr ? String(connectedAddr) : 'Not connected'}
            </Typography>
          </Box>
          
          <Box sx={{ mb: 2 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={confirmExport}
              disabled={!getEncryptedMnemonic()}
              startIcon={<VpnKey />}
            >
              Export Recovery Phrase
            </Button>
            {!getEncryptedMnemonic() && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                Recovery phrase not available for generated wallets
              </Typography>
            )}
            {/* Debug info */}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontSize: '0.7rem' }}>
              Debug: Has mnemonic: {getEncryptedMnemonic() ? 'Yes' : 'No'}
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={testMnemonicStorage}
              sx={{ mt: 1 }}
            >
              Test Storage
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => testCodeLoaded()}
              sx={{ mt: 1, ml: 1 }}
            >
              Test Code Loaded
            </Button>
          </Box>

          {/* Export passphrase dialog */}
          <Dialog open={showMnemonic} onClose={() => setShowMnemonic(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Recovery Phrase</DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Write down these 12 words in the exact order shown. This is your only way to recover your wallet.
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'background.paper', 
                  borderRadius: 1, 
                  border: '1px solid', 
                  borderColor: 'divider',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  lineHeight: 1.5
                }}>
                  {exportedMnemonic || 'No mnemonic available'}
                </Box>
                <Box sx={{ mt: 1, fontSize: '0.75rem', color: 'text.secondary' }}>
                  Debug: exportedMnemonic = {JSON.stringify(exportedMnemonic)}
                </Box>
                <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={copyToClipboard}
                    startIcon={<ContentCopy />}
                  >
                    Copy
                  </Button>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowMnemonic(false)}>Close</Button>
            </DialogActions>
          </Dialog>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader title="Connect Wallet" />
      <CardContent>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="wallet connection tabs">
          <Tab label="GenLayer Local" disabled={isEvmConnected} />
          <Tab label="External EVM" disabled={!!connectedAddr} />
        </Tabs>

        {/* GenLayer Local Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>GenLayer Local</Typography>
            <Button size="small" onClick={() => setLocalCollapsed(!localCollapsed)} startIcon={localCollapsed ? <ExpandMore /> : <ExpandLess />}> {localCollapsed ? 'Expand' : 'Collapse'} </Button>
          </Box>
          <Collapse in={!localCollapsed} timeout="auto" unmountOnExit>
          <Box sx={{ mb: 3 }}>
            <Stepper activeStep={createStep} sx={{ mb: 3 }}>
              <Step>
                <StepLabel>Create/Import</StepLabel>
              </Step>
              <Step>
                <StepLabel>Set Passphrase</StepLabel>
              </Step>
              <Step>
                <StepLabel>Complete</StepLabel>
              </Step>
            </Stepper>

            {createStep === 0 && (
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button
                  variant="contained"
                  onClick={() => setCreateStep(1)}
                  startIcon={<VpnKey />}
                  fullWidth
                >
                  Create New Wallet
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setTabValue(1)}
                  startIcon={<AccountBalanceWallet />}
                  fullWidth
                >
                  Import Wallet
                </Button>
              </Box>
            )}

            {createStep === 1 && (
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  label="Passphrase"
                  type={showCreatePass ? 'text' : 'password'}
                  value={createPass}
                  onChange={(e) => setCreatePass(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowCreatePass(!showCreatePass)}
                          edge="end"
                        >
                          {showCreatePass ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth
                  label="Confirm Passphrase"
                  type={showCreatePass2 ? 'text' : 'password'}
                  value={createPass2}
                  onChange={(e) => setCreatePass2(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowCreatePass2(!showCreatePass2)}
                          edge="end"
                        >
                          {showCreatePass2 ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                    variant="contained"
                    onClick={handleCreate}
                  disabled={loading || !createPass || !createPass2 || isEvmConnected}
                    startIcon={loading ? <CircularProgress size={20} /> : <VpnKey />}
                    fullWidth
                  >
                    {loading ? 'Creating...' : 'Create Wallet'}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setCreateStep(0)}
                    fullWidth
                  >
                    Back
                  </Button>
                </Box>
              </Box>
            )}

            {createStep === 2 && showMnemonic && exportedMnemonic && (
              <Box sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'warning.main', borderRadius: 2, bgcolor: 'warning.light' }}>
                <Typography variant="h6" color="warning.dark" gutterBottom>
                  ⚠️ Save Your Recovery Phrase
                </Typography>
                <Typography variant="body2" color="warning.dark" sx={{ mb: 2 }}>
                  Write down these 12 words in the exact order shown. This is your only way to recover your wallet if you lose access.
                </Typography>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'background.paper', 
                  borderRadius: 1, 
                  border: '1px solid', 
                  borderColor: 'divider',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  lineHeight: 1.5
                }}>
                  {exportedMnemonic}
                </Box>
                <Typography variant="caption" color="warning.dark" sx={{ mt: 1, display: 'block' }}>
                  ⚠️ Never share this phrase with anyone. Anyone with this phrase can access your wallet.
                </Typography>
              </Box>
            )}

            {/* Import Mnemonic */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Import from Mnemonic
              </Typography>
              <TextField
                fullWidth
                label="Recovery Phrase (12 words)"
                multiline
                rows={3}
                value={importMnemonic}
                onChange={(e) => setImportMnemonic(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Passphrase"
                type={showImportPass ? 'text' : 'password'}
                value={importPass}
                onChange={(e) => setImportPass(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowImportPass(!showImportPass)}
                        edge="end"
                      >
                        {showImportPass ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              <Button
                variant="outlined"
                onClick={handleImportMnemonic}
                disabled={loading || !importMnemonic.trim() || !importPass || isEvmConnected}
                startIcon={loading ? <CircularProgress size={20} /> : <VpnKey />}
                fullWidth
              >
                {loading ? 'Importing...' : 'Import Wallet'}
              </Button>
            </Box>

            {/* Import Private Key */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Import from Private Key
              </Typography>
              <TextField
                fullWidth
                label="Private Key"
                type={showImportPrivPass ? 'text' : 'password'}
                value={importPrivKey}
                onChange={(e) => setImportPrivKey(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowImportPrivPass(!showImportPrivPass)}
                        edge="end"
                      >
                        {showImportPrivPass ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Passphrase"
                type={showImportPrivPass ? 'text' : 'password'}
                value={importPrivPass}
                onChange={(e) => setImportPrivPass(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowImportPrivPass(!showImportPrivPass)}
                        edge="end"
                      >
                        {showImportPrivPass ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              <Button
                variant="outlined"
                onClick={handleImportPrivKey}
                disabled={loading || !importPrivKey.trim() || !importPrivPass || isEvmConnected}
                startIcon={loading ? <CircularProgress size={20} /> : <VpnKey />}
                fullWidth
              >
                {loading ? 'Importing...' : 'Import Wallet'}
              </Button>
            </Box>

            {/* Unlock Existing Wallet */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Unlock Existing Wallet
              </Typography>
              <TextField
                fullWidth
                label="Passphrase"
                type={showUnlockPass ? 'text' : 'password'}
                value={unlockPass}
                onChange={(e) => setUnlockPass(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowUnlockPass(!showUnlockPass)}
                        edge="end"
                      >
                        {showUnlockPass ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />
              <Button
                variant="outlined"
                onClick={handleUnlock}
                disabled={loading || !unlockPass || isEvmConnected}
                startIcon={loading ? <CircularProgress size={20} /> : <Lock />}
                fullWidth
              >
                {loading ? 'Unlocking...' : 'Unlock Wallet'}
              </Button>
            </Box>
          </Box>
          </Collapse>
        </TabPanel>

        {/* External EVM Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            {!evmAddress ? (
              <Button
                variant="contained"
                onClick={handleEvmConnect}
                disabled={loading || !!connectedAddr}
                startIcon={loading ? <CircularProgress size={20} /> : <AccountBalanceWallet />}
                fullWidth
                sx={{ mb: 2 }}
              >
                {loading ? 'Connecting...' : 'Connect MetaMask'}
              </Button>
            ) : (
              <Box sx={{ mb: 2 }}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  EVM Wallet Connected: {evmAddress}
                </Alert>
                <Button
                  variant="outlined"
                  onClick={handleEvmDisconnect}
                  fullWidth
                >
                  Disconnect EVM Wallet
                </Button>
              </Box>
            )}

            {/* Session Authorization */}
            {evmAddress && authorizeStep === 1 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Authorize GenLayer Session
                </Typography>
                <TextField
                  fullWidth
                  label="Session Passphrase"
                  type={showSessionPassphrase ? 'text' : 'password'}
                  value={sessionPassphrase}
                  onChange={(e) => setSessionPassphrase(e.target.value)}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowSessionPassphrase(!showSessionPassphrase)}
                          edge="end"
                        >
                          {showSessionPassphrase ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  onClick={() => onAuthorizeSession()}
                  disabled={loading || !isEvmConnected}
                  startIcon={loading ? <CircularProgress size={20} /> : <Lock />}
                  fullWidth
                >
                  {loading ? 'Authorizing...' : 'Authorize Session'}
                </Button>
              </Box>
            )}

            {authorizeStep === 2 && (
              <Alert severity="success" sx={{ mt: 2 }}>
                Session authorized successfully! You can now create and resolve bets.
              </Alert>
            )}
          </Box>
        </TabPanel>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        >
          <Alert
            onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  )
})

export default ConnectWallet