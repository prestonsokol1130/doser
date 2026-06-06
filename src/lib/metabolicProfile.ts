import type { HeightUnit, WeightUnit } from '../types'

const LBS_PER_KG = 2.2046226218
const CM_PER_IN = 2.54

export function kgToLbs(kg: number): number {
  return Math.round(kg * LBS_PER_KG * 10) / 10
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / LBS_PER_KG) * 10) / 10
}

export function normalizeWeightToKg(value: number, unit: WeightUnit): number {
  return unit === 'lbs' ? lbsToKg(value) : Math.round(value * 10) / 10
}

export function cmToIn(cm: number): number {
  return Math.round((cm / CM_PER_IN) * 10) / 10
}

export function inToCm(inches: number): number {
  return Math.round(inches * CM_PER_IN * 10) / 10
}

export function normalizeHeightToCm(value: number, unit: HeightUnit): number {
  return unit === 'in' ? inToCm(value) : Math.round(value * 10) / 10
}
