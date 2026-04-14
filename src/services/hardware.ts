// Hardware simulation service for biometric devices

export type FingerprintScanResult = {
  fingerprintId: string
  confidence: number
}

export type FaceScanResult = {
  faceId: string
  liveness: number
}

// Simulated hardware service for ESP32-S3 camera and R307 fingerprint sensor
export const hardwareService = {
  scanFingerprint: async (): Promise<FingerprintScanResult> => {
    // Simulate hardware latency
    await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000))
    return {
      fingerprintId: `fp-${Math.floor(1000 + Math.random() * 9000)}`,
      confidence: 0.85 + Math.random() * 0.14,
    }
  },

  scanFace: async (): Promise<FaceScanResult> => {
    // Simulate hardware latency
    await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 1500))
    return {
      faceId: `face-${Math.floor(1000 + Math.random() * 9000)}`,
      liveness: 0.88 + Math.random() * 0.11,
    }
  },
}
