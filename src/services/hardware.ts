export type FingerprintScanResult = {
  fingerprintId: string
  confidence: number
}

export type FaceScanResult = {
  faceId: string
  liveness: number
}

const simulateLatency = (min = 700, max = 1400) =>
  new Promise<void>((resolve) => {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min
    setTimeout(() => resolve(), delay)
  })

export const hardwareService = {
  async scanFingerprint(): Promise<FingerprintScanResult> {
    await simulateLatency(900, 1600)
    return {
      fingerprintId: `fp-${Math.floor(1000 + Math.random() * 9000)}`,
      confidence: Number((0.92 + Math.random() * 0.06).toFixed(2)),
    }
  },
  async scanFace(): Promise<FaceScanResult> {
    await simulateLatency(1100, 1800)
    return {
      faceId: `face-${Math.floor(1000 + Math.random() * 9000)}`,
      liveness: Number((0.9 + Math.random() * 0.08).toFixed(2)),
    }
  },
}
