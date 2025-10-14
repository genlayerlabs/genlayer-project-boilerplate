import dynamic from 'next/dynamic'

const BetsApp = dynamic(() => import('../src/app/bets/page').then(m => m.default), { ssr: false })

export default function BetsPageBridge() {
  return <BetsApp />
}


