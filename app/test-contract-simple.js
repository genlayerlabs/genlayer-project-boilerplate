// Simple contract test
const CONTRACT_ADDRESS = "0x2146690DCB6b857e375cA51D449e4400570e7c76"
const STUDIO_URL = "https://studio.genlayer.com/api"

console.log('=== CONTRACT ADDRESS VERIFICATION ===')
console.log('Contract Address:', CONTRACT_ADDRESS)
console.log('Studio URL:', STUDIO_URL)
console.log('Contract Address Length:', CONTRACT_ADDRESS.length)
console.log('Is Valid Ethereum Address:', /^0x[a-fA-F0-9]{40}$/.test(CONTRACT_ADDRESS))

// Test if we can access the contract
async function testContractAccess() {
  try {
    console.log('\n=== TESTING CONTRACT ACCESS ===')
    
    // Test basic fetch to studio API
    const response = await fetch(STUDIO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_getCode',
        params: [CONTRACT_ADDRESS, 'latest'],
        id: 1
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('Contract exists:', data.result !== '0x')
      console.log('Contract code length:', data.result?.length || 0)
    } else {
      console.log('API Error:', response.status, response.statusText)
    }
  } catch (error) {
    console.error('Contract access test failed:', error)
  }
}

// Run test if in browser
if (typeof window !== 'undefined') {
  testContractAccess()
}
