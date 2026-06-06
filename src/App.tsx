import { useState } from 'react'
import { AuthLayer } from './components/auth/AuthLayer'
import { GateLayer } from './components/gate/GateLayer'
import { isGateComplete } from './store/gateStore'

function App() {
  const [gateComplete, setGateComplete] = useState(() => isGateComplete())
  const [authComplete, setAuthComplete] = useState(false)

  if (!gateComplete) {
    return <GateLayer onComplete={() => setGateComplete(true)} />
  }

  if (!authComplete) {
    return <AuthLayer onComplete={() => setAuthComplete(true)} />
  }

  return <div className="min-h-screen bg-[var(--color-bg)]" />
}

export default App
