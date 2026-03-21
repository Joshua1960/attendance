import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { hardwareService } from '../services/hardware'

export type BiometricMethod = 'Fingerprint' | 'Face'

type BiometricContextValue = {
  isScanning: boolean
  lastSignal: string | null
  scanFingerprint: () => Promise<{ method: BiometricMethod; signal: string }>
  scanFace: () => Promise<{ method: BiometricMethod; signal: string }>
}

const BiometricContext = createContext<BiometricContextValue | undefined>(undefined)

export const BiometricProvider = ({ children }: { children: React.ReactNode }) => {
  const [isScanning, setIsScanning] = useState(false)
  const [lastSignal, setLastSignal] = useState<string | null>(null)

  const scanFingerprint = useCallback(async () => {
    setIsScanning(true)
    const result = await hardwareService.scanFingerprint()
    const signal = `${result.fingerprintId} • ${Math.round(result.confidence * 100)}% match`
    setLastSignal(signal)
    setIsScanning(false)
    return { method: 'Fingerprint' as const, signal }
  }, [])

  const scanFace = useCallback(async () => {
    setIsScanning(true)
    const result = await hardwareService.scanFace()
    const signal = `${result.faceId} • ${Math.round(result.liveness * 100)}% liveness`
    setLastSignal(signal)
    setIsScanning(false)
    return { method: 'Face' as const, signal }
  }, [])

  const value = useMemo(
    () => ({
      isScanning,
      lastSignal,
      scanFingerprint,
      scanFace,
    }),
    [isScanning, lastSignal, scanFingerprint, scanFace],
  )

  return <BiometricContext.Provider value={value}>{children}</BiometricContext.Provider>
}

export const useBiometric = () => {
  const context = useContext(BiometricContext)
  if (!context) {
    throw new Error('useBiometric must be used within BiometricProvider')
  }
  return context
}
