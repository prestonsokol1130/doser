import { useState } from 'react'
import { GateLayer } from './components/gate/GateLayer'
import { isGateComplete } from './store/gateStore'

function App() {
  const [gateComplete, setGateComplete] = useState(() => isGateComplete())

  if (!gateComplete) {
    return <GateLayer onComplete={() => setGateComplete(true)} />
  }

  return <div className="min-h-screen bg-[var(--color-bg)]" />
}

export default App
