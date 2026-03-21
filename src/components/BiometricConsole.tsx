import { Activity, Fingerprint, ScanFace } from 'lucide-react'
import { useBiometric } from '../contexts/BiometricContext'

const BiometricConsole = ({
  onFingerprint,
  onFace,
}: {
  onFingerprint: () => void
  onFace: () => void
}) => {
  const { isScanning, lastSignal } = useBiometric()

  return (
    <div className="rounded-2xl border border-indigo-200/60 bg-gradient-to-br from-indigo-600 via-indigo-500 to-sky-500 p-6 text-white shadow-lg">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Live Biometric Console</h2>
          <p className="text-sm text-indigo-100">
            Simulated ESP32-S3 camera and R307 fingerprint module
          </p>
        </div>
        <div className="rounded-full bg-white/15 p-3">
          <Activity className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={onFingerprint}
          disabled={isScanning}
          className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Fingerprint className="h-4 w-4" />
          Fingerprint Scan
        </button>
        <button
          onClick={onFace}
          disabled={isScanning}
          className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ScanFace className="h-4 w-4" />
          Face Recognition
        </button>
      </div>
      <div className="mt-6 rounded-xl border border-white/20 bg-white/10 p-4">
        <p className="text-xs uppercase tracking-wide text-indigo-100">System Signal</p>
        <p className="mt-2 text-sm font-semibold">
          {isScanning ? 'Scanning biometric sensors...' : lastSignal || 'Awaiting first scan'}
        </p>
      </div>
    </div>
  )
}

export default BiometricConsole
