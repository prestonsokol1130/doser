const STORAGE_KEY = 'doser-gate'

export type GateStep = 'age' | 'legal' | 'harm-reduction' | 'complete'

type GateState = {
  age: boolean
  legal: boolean
  harmReduction: boolean
}

const defaultState: GateState = {
  age: false,
  legal: false,
  harmReduction: false,
}

function readState(): GateState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultState }
    const parsed = JSON.parse(raw) as Partial<GateState>
    return {
      age: parsed.age === true,
      legal: parsed.legal === true,
      harmReduction: parsed.harmReduction === true,
    }
  } catch {
    return { ...defaultState }
  }
}

function writeState(state: GateState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Failed to write gate state to localStorage:', error)
  }
}

export function getGateStep(): GateStep {
  const state = readState()
  if (!state.age) return 'age'
  if (!state.legal) return 'legal'
  if (!state.harmReduction) return 'harm-reduction'
  return 'complete'
}

export function isGateComplete(): boolean {
  return getGateStep() === 'complete'
}

export function acceptAgeGate(): void {
  const state = readState()
  writeState({ ...state, age: true })
}

export function acceptLegalGate(): void {
  const state = readState()
  writeState({ ...state, legal: true })
}

export function acceptHarmReductionGate(): void {
  const state = readState()
  writeState({ ...state, harmReduction: true })
}
