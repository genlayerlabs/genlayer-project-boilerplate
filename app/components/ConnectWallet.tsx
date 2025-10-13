'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  Box,
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
} from '@mui/icons-material'
import {
  createAccountSecure,
  importPrivKeySecure,
  importMnemonicSecure,
  unlockWithPassphrase,
  getEncryptedMnemonic,
  clearAccount,
  onAccountChanged,
} from '@/services/genlayer'
import { decryptString } from '@/lib/crypto'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
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
}

export default function ConnectWallet() {
  const [tabValue, setTabValue] = useState(0)
  const [connectedAddr, setConnectedAddr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' })
  
  // Form states
  const [createPass, setCreatePass] = useState('')
  const [createPass2, setCreatePass2] = useState('')
  const [showCreatePass, setShowCreatePass] = useState(false)
  const [showCreatePass2, setShowCreatePass2] = useState(false)
  
  const [mnemonic, setMnemonic] = useState('')
  const [mnemonicPass, setMnemonicPass] = useState('')
  const [showMnemonicPass, setShowMnemonicPass] = useState(false)
  
  const [privKey, setPrivKey] = useState('')
  const [privPass, setPrivPass] = useState('')
  const [showPrivPass, setShowPrivPass] = useState(false)
  
  const [unlockPass, setUnlockPass] = useState('')
  const [showUnlockPass, setShowUnlockPass] = useState(false)

  // Stepper for create flow
  const [createStep, setCreateStep] = useState(0)
  
  // Export recovery phrase states
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportPassphrase, setExportPassphrase] = useState('')
  const [exportedMnemonic, setExportedMnemonic] = useState('')
  const [showMnemonic, setShowMnemonic] = useState(false)

  useEffect(() => {
    const off = onAccountChanged((account: any) => {
      setConnectedAddr(account?.address || null)
      if (account?.address) {
        setSnackbar({ open: true, message: 'Wallet connected successfully!', severity: 'success' })
      }
    })
    return () => { try { off?.(); } catch { /* noop */ } }
  }, [])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
    setCreateStep(0)
  }

  const showSnackbar = (message: string, severity: 'success' | 'error' = 'success') => {
    setSnackbar({ open: true, message, severity })
  }

  const handleCreate = async () => {
    if (!createPass || createPass !== createPass2) {
      showSnackbar('Passphrase mismatch', 'error')
      return
    }
    
    setLoading(true)
    try {
      await createAccountSecure(createPass)
      setCreateStep(2)
      showSnackbar('Wallet created and encrypted successfully!')
    } catch (error) {
      showSnackbar('Failed to create wallet', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleImportMnemonic = async () => {
    if (!mnemonic || !mnemonicPass) {
      showSnackbar('Mnemonic & passphrase required', 'error')
      return
    }
    
    setLoading(true)
    try {
      await importMnemonicSecure(mnemonic.trim(), mnemonicPass)
      setMnemonic('')
      setMnemonicPass('')
      showSnackbar('Mnemonic imported and encrypted successfully!')
    } catch (error) {
      showSnackbar('Invalid mnemonic phrase', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleImportPrivKey = async () => {
    if (!privKey || !privPass) {
      showSnackbar('Private key & passphrase required', 'error')
      return
    }
    
    setLoading(true)
    try {
      await importPrivKeySecure(privKey, privPass)
      showSnackbar('Private key imported and encrypted successfully!')
    } catch (error) {
      showSnackbar('Invalid private key', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleUnlock = async () => {
    if (!unlockPass) {
      showSnackbar('Passphrase required', 'error')
      return
    }
    
    setLoading(true)
    try {
      await unlockWithPassphrase(unlockPass)
      showSnackbar('Wallet unlocked successfully!')
    } catch (error) {
      showSnackbar('Unlock failed: Invalid passphrase', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleDisconnect = () => {
    clearAccount()
    setConnectedAddr(null)
    showSnackbar('Wallet disconnected')
  }

  const handleExport = () => {
    setShowExportModal(true)
    setExportPassphrase('')
    setExportedMnemonic('')
    setShowMnemonic(false)
  }

  const confirmExport = async () => {
    if (!exportPassphrase) {
      showSnackbar('Passphrase required', 'error')
      return
    }

    try {
      const encryptedMnemonic = getEncryptedMnemonic()
      if (!encryptedMnemonic) {
        showSnackbar('No mnemonic found', 'error')
        return
      }

      const payload = JSON.parse(encryptedMnemonic)
      const mnemonic = await decryptString(payload, exportPassphrase)
      setExportedMnemonic(mnemonic)
      setShowMnemonic(true)
      showSnackbar('Recovery phrase exported successfully!')
    } catch (error) {
      showSnackbar('Invalid passphrase', 'error')
    }
  }

  const closeExportModal = () => {
    setShowExportModal(false)
    setExportPassphrase('')
    setExportedMnemonic('')
    setShowMnemonic(false)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(exportedMnemonic)
      showSnackbar('Copied to clipboard!')
    } catch (error) {
      showSnackbar('Failed to copy', 'error')
    }
  }

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
          <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
            {connectedAddr}
          </Typography>
          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleExport}
              startIcon={<VpnKey />}
            >
              Export Recovery Phrase
            </Button>
          </Box>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardHeader title="Connect Wallet" />
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="wallet connection tabs">
              <Tab label="Create" icon={<AccountBalanceWallet />} />
              <Tab label="Mnemonic" icon={<VpnKey />} />
              <Tab label="Private Key" icon={<Lock />} />
              <Tab label="Unlock" icon={<Lock />} />
            </Tabs>
          </Box>

          {/* Create Tab */}
          <TabPanel value={tabValue} index={0}>
            <Stepper activeStep={createStep} sx={{ mb: 3 }}>
              <Step>
                <StepLabel>Set Passphrase</StepLabel>
              </Step>
              <Step>
                <StepLabel>Confirm</StepLabel>
              </Step>
              <Step>
                <StepLabel>Done</StepLabel>
              </Step>
            </Stepper>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                type={showCreatePass ? 'text' : 'password'}
                label="Set a passphrase"
                value={createPass}
                onChange={(e) => setCreatePass(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowCreatePass(!showCreatePass)}>
                        {showCreatePass ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                helperText="Choose a strong passphrase to encrypt your wallet"
              />
              
              <TextField
                fullWidth
                type={showCreatePass2 ? 'text' : 'password'}
                label="Confirm passphrase"
                value={createPass2}
                onChange={(e) => setCreatePass2(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowCreatePass2(!showCreatePass2)}>
                        {showCreatePass2 ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                error={createPass2 !== '' && createPass !== createPass2}
                helperText={createPass2 !== '' && createPass !== createPass2 ? 'Passphrases do not match' : ''}
              />

              <Button
                fullWidth
                variant="contained"
                onClick={handleCreate}
                disabled={loading || !createPass || !createPass2 || createPass !== createPass2}
                startIcon={loading ? <CircularProgress size={20} /> : <AccountBalanceWallet />}
              >
                {loading ? 'Creating...' : 'Create Wallet'}
              </Button>
            </Box>
          </TabPanel>

          {/* Mnemonic Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Mnemonic phrase"
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                placeholder="twelve word seed phrase"
                helperText="Enter your 12-word recovery phrase"
              />
              
              <TextField
                fullWidth
                type={showMnemonicPass ? 'text' : 'password'}
                label="Passphrase to encrypt locally"
                value={mnemonicPass}
                onChange={(e) => setMnemonicPass(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowMnemonicPass(!showMnemonicPass)}>
                        {showMnemonicPass ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                helperText="This will encrypt your mnemonic locally"
              />

              <Button
                fullWidth
                variant="contained"
                onClick={handleImportMnemonic}
                disabled={loading || !mnemonic || !mnemonicPass}
                startIcon={loading ? <CircularProgress size={20} /> : <VpnKey />}
              >
                {loading ? 'Importing...' : 'Import Mnemonic'}
              </Button>
            </Box>
          </TabPanel>

          {/* Private Key Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                label="Private Key"
                value={privKey}
                onChange={(e) => setPrivKey(e.target.value)}
                placeholder="0x… 64 hex chars"
                sx={{ fontFamily: 'monospace' }}
                helperText="Enter your private key (64 hex characters)"
              />
              
              <TextField
                fullWidth
                type={showPrivPass ? 'text' : 'password'}
                label="Passphrase to encrypt locally"
                value={privPass}
                onChange={(e) => setPrivPass(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPrivPass(!showPrivPass)}>
                        {showPrivPass ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                helperText="This will encrypt your private key locally"
              />

              <Button
                fullWidth
                variant="contained"
                onClick={handleImportPrivKey}
                disabled={loading || !privKey || !privPass}
                startIcon={loading ? <CircularProgress size={20} /> : <Lock />}
              >
                {loading ? 'Importing...' : 'Import Private Key'}
              </Button>
            </Box>
          </TabPanel>

          {/* Unlock Tab */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth
                type={showUnlockPass ? 'text' : 'password'}
                label="Enter passphrase"
                value={unlockPass}
                onChange={(e) => setUnlockPass(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowUnlockPass(!showUnlockPass)}>
                        {showUnlockPass ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                helperText="Enter the passphrase for your encrypted wallet"
              />

              <Button
                fullWidth
                variant="contained"
                onClick={handleUnlock}
                disabled={loading || !unlockPass}
                startIcon={loading ? <CircularProgress size={20} /> : <Lock />}
              >
                {loading ? 'Unlocking...' : 'Unlock Wallet'}
              </Button>
            </Box>
          </TabPanel>
        </CardContent>
      </Card>

      {/* Export Recovery Phrase Modal */}
      <Dialog open={showExportModal} onClose={closeExportModal} maxWidth="sm" fullWidth>
        <DialogTitle>Export Recovery Phrase</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Enter your passphrase to export your recovery phrase. Keep this phrase safe and never share it with anyone.
          </Typography>
          
          {!showMnemonic ? (
            <TextField
              fullWidth
              type="password"
              label="Enter passphrase"
              value={exportPassphrase}
              onChange={(e) => setExportPassphrase(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
              }}
              sx={{ mt: 2 }}
            />
          ) : (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Your recovery phrase:
              </Typography>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'grey.100', 
                borderRadius: 1, 
                border: 1, 
                borderColor: 'grey.300',
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                wordBreak: 'break-all'
              }}>
                {exportedMnemonic}
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ContentCopy />}
                onClick={copyToClipboard}
                sx={{ mt: 1 }}
              >
                Copy to Clipboard
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeExportModal}>
            Close
          </Button>
          {!showMnemonic && (
            <Button 
              onClick={confirmExport} 
              variant="contained"
              disabled={!exportPassphrase}
            >
              Export
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  )
}