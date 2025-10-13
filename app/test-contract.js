// Test script to check contract connection
import { FootballBets } from './services/FootballBets'

const CONTRACT_ADDRESS = "0x2146690DCB6b857e375cA51D449e4400570e7c76"
const STUDIO_URL = "https://studio.genlayer.com/api"

async function testContractConnection() {
  console.log('Testing contract connection...')
  console.log('Contract Address:', CONTRACT_ADDRESS)
  console.log('Studio URL:', STUDIO_URL)
  
  try {
    const fb = new FootballBets(CONTRACT_ADDRESS, null, STUDIO_URL)
    
    console.log('Fetching bets...')
    const bets = await fb.getBets()
    console.log('Bets fetched:', bets.length)
    console.log('Sample bet:', bets[0])
    
    console.log('Fetching leaderboard...')
    const leaderboard = await fb.getLeaderboard()
    console.log('Leaderboard fetched:', leaderboard.length)
    console.log('Sample entry:', leaderboard[0])
    
    console.log('Contract connection successful!')
  } catch (error) {
    console.error('Contract connection failed:', error)
  }
}

// Run test if in browser
if (typeof window !== 'undefined') {
  testContractConnection()
}

export { testContractConnection }
