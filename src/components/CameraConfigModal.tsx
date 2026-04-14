import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Camera, 
  Wifi, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Monitor,
  ArrowRight
} from 'lucide-react'
import type { CameraConfig } from './BiometricConsole'

interface CameraConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (config: CameraConfig) => void
  currentConfig?: CameraConfig
  isFirstTime?: boolean
}

const CameraConfigModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  currentConfig = { type: 'webcam' },
  isFirstTime = false 
}: CameraConfigModalProps) => {
  const [cameraType, setCameraType] = useState<'webcam' | 'external'>(currentConfig.type)
  const [ipAddress, setIpAddress] = useState(currentConfig.externalUrl || '')
  const [port, setPort] = useState('8080')
  const [streamPath, setStreamPath] = useState('/video')
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCameraType(currentConfig.type)
      setIpAddress(currentConfig.externalUrl || '')
      setTestResult(null)
      setError(null)
    }
  }, [isOpen, currentConfig])

  const buildStreamUrl = () => {
    if (!ipAddress) return ''
    const cleanIp = ipAddress.replace(/^https?:\/\//, '').replace(/\/$/, '')
    return `http://${cleanIp}:${port}${streamPath}`
  }

  const handleTestConnection = async () => {
    if (!ipAddress) {
      setError('Please enter an IP address')
      return
    }

    setIsTesting(true)
    setTestResult(null)
    setError(null)

    // Simulate connection test
    await new Promise(resolve => setTimeout(resolve, 1500))

    const isSuccess = Math.random() > 0.3
    
    if (isSuccess) {
      setTestResult('success')
    } else {
      setTestResult('error')
      setError('Connection failed. Check IP and ensure camera is powered on.')
    }
    
    setIsTesting(false)
  }

  const handleSave = () => {
    if (cameraType === 'external' && !ipAddress) {
      setError('Please enter an IP address')
      return
    }

    const config: CameraConfig = {
      type: cameraType,
      externalUrl: cameraType === 'external' ? buildStreamUrl() : undefined
    }

    onSave(config)
    onClose()
  }

  const handleSkip = () => {
    onSave({ type: 'webcam' })
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Header - Compact */}
            <div className="relative bg-gradient-to-r from-indigo-600 to-sky-500 px-4 py-4 sm:px-5 sm:py-5">
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    <Camera className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-white">
                      {isFirstTime ? 'Setup Camera' : 'Camera Settings'}
                    </h2>
                    <p className="text-xs text-white/70 hidden sm:block">
                      {isFirstTime ? 'Choose your camera for Face ID' : 'Configure camera'}
                    </p>
                  </div>
                </div>
                {!isFirstTime && (
                  <button
                    onClick={onClose}
                    className="rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Content - Compact */}
            <div className="p-4 sm:p-5 space-y-4">
              {/* Camera Type Selection - Compact */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Camera Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setCameraType('webcam')}
                    className={`flex items-center gap-2 rounded-xl border p-3 transition ${
                      cameraType === 'webcam'
                        ? 'border-indigo-400 bg-indigo-500/20'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <Monitor className={`h-5 w-5 ${cameraType === 'webcam' ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <div className="text-left">
                      <span className={`text-sm font-medium block ${cameraType === 'webcam' ? 'text-white' : 'text-slate-300'}`}>
                        Webcam
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => setCameraType('external')}
                    className={`flex items-center gap-2 rounded-xl border p-3 transition ${
                      cameraType === 'external'
                        ? 'border-indigo-400 bg-indigo-500/20'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                  >
                    <Wifi className={`h-5 w-5 ${cameraType === 'external' ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <div className="text-left">
                      <span className={`text-sm font-medium block ${cameraType === 'external' ? 'text-white' : 'text-slate-300'}`}>
                        WiFi Camera
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* External Camera Configuration - Compact */}
              <AnimatePresence>
                {cameraType === 'external' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-3 overflow-hidden"
                  >
                    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 space-y-3">
                      {/* IP Address */}
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                          IP Address
                        </label>
                        <input
                          type="text"
                          value={ipAddress}
                          onChange={(e) => {
                            setIpAddress(e.target.value)
                            setTestResult(null)
                            setError(null)
                          }}
                          placeholder="192.168.1.100"
                          className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-400"
                        />
                      </div>

                      {/* Port and Path - Inline */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            Port
                          </label>
                          <input
                            type="text"
                            value={port}
                            onChange={(e) => {
                              setPort(e.target.value)
                              setTestResult(null)
                            }}
                            placeholder="8080"
                            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            Stream Path
                          </label>
                          <input
                            type="text"
                            value={streamPath}
                            onChange={(e) => {
                              setStreamPath(e.target.value)
                              setTestResult(null)
                            }}
                            placeholder="/video"
                            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-400"
                          />
                        </div>
                      </div>

                      {/* Test Connection Button */}
                      <button
                        onClick={handleTestConnection}
                        disabled={!ipAddress || isTesting}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isTesting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <Wifi className="h-4 w-4" />
                            Test Connection
                          </>
                        )}
                      </button>

                      {/* Test Result - Compact */}
                      <AnimatePresence>
                        {testResult === 'success' && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-500/10 p-2.5"
                          >
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span className="text-xs text-emerald-300">Connected! Camera ready.</span>
                          </motion.div>
                        )}
                        {testResult === 'error' && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="flex items-center gap-2 rounded-lg border border-rose-400/40 bg-rose-500/10 p-2.5"
                          >
                            <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
                            <span className="text-xs text-rose-300">{error || 'Connection failed'}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Help Text - Compact */}
                      <p className="text-[11px] text-slate-500">
                        Tip: ESP32-CAM usually uses <code className="bg-slate-900 px-1 rounded text-slate-400">/stream</code> path. Ensure same WiFi network.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Message */}
              {error && cameraType !== 'external' && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-400/40 bg-rose-500/10 p-2.5">
                  <AlertTriangle className="h-4 w-4 text-rose-400" />
                  <span className="text-xs text-rose-300">{error}</span>
                </div>
              )}
            </div>

            {/* Footer - Compact */}
            <div className="border-t border-slate-700 bg-slate-800/50 px-4 py-3 sm:px-5 sm:py-4">
              <div className="flex gap-2">
                {isFirstTime && (
                  <button
                    onClick={handleSkip}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-700"
                  >
                    Skip
                  </button>
                )}
                <button
                  onClick={handleSave}
                  disabled={cameraType === 'external' && !ipAddress}
                  className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-500 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isFirstTime ? (
                    <>
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CameraConfigModal
