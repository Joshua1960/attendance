import { useRef, useState, useCallback, useEffect } from 'react'
import Webcam from 'react-webcam'
import { Activity, Fingerprint, ScanFace, X, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBiometric } from '../contexts/BiometricContext'

type FaceVerificationStatus = 'idle' | 'scanning' | 'detecting' | 'verifying' | 'success' | 'failed'
type FingerprintStatus = 'idle' | 'scanning' | 'verifying' | 'success' | 'failed'

interface BiometricConsoleProps {
  onFingerprint: () => void
  onFaceVerificationComplete: (success: boolean, capturedImage: string | null) => void
}

const BiometricConsole = ({ onFingerprint, onFaceVerificationComplete }: BiometricConsoleProps) => {
  const { isScanning, lastSignal } = useBiometric()
  const webcamRef = useRef<Webcam>(null)
  
  const [isFaceMode, setIsFaceMode] = useState(false)
  const [isFingerprintMode, setIsFingerprintMode] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<FaceVerificationStatus>('idle')
  const [fingerprintStatus, setFingerprintStatus] = useState<FingerprintStatus>('idle')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [faceDetected, setFaceDetected] = useState(false)
  const [detectionProgress, setDetectionProgress] = useState(0)
  const [fingerprintProgress, setFingerprintProgress] = useState(0)
  const hasTriggeredVerification = useRef(false)

  const videoConstraints = {
    width: 480,
    height: 360,
    facingMode: 'user'
  }

  useEffect(() => {
    if (isFaceMode) {
      setVerificationStatus('scanning')
      setCapturedImage(null)
      setCameraError(null)
      setFaceDetected(false)
      setDetectionProgress(0)
      hasTriggeredVerification.current = false
    } else {
      setVerificationStatus('idle')
    }
  }, [isFaceMode])

  useEffect(() => {
    if (!isFaceMode || verificationStatus !== 'scanning' || hasTriggeredVerification.current) return

    let detectionCount = 0
    const requiredDetections = 8
    
    const interval = setInterval(() => {
      const detected = Math.random() > 0.25
      
      if (detected) {
        detectionCount++
        setFaceDetected(true)
        setDetectionProgress((detectionCount / requiredDetections) * 100)
        
        if (detectionCount >= requiredDetections && !hasTriggeredVerification.current) {
          hasTriggeredVerification.current = true
          clearInterval(interval)
          handleAutoCapture()
        }
      } else {
        if (detectionCount > 0) {
          detectionCount = Math.max(0, detectionCount - 2)
          setDetectionProgress((detectionCount / requiredDetections) * 100)
        }
        if (detectionCount === 0) {
          setFaceDetected(false)
        }
      }
    }, 200)

    return () => clearInterval(interval)
  }, [isFaceMode, verificationStatus])

  const handleAutoCapture = useCallback(() => {
    if (webcamRef.current) {
      setVerificationStatus('detecting')
      
      setTimeout(() => {
        const imageSrc = webcamRef.current?.getScreenshot()
        if (imageSrc) {
          setCapturedImage(imageSrc)
          setVerificationStatus('verifying')
          
          setTimeout(() => {
            const isSuccess = Math.random() > 0.15
            setVerificationStatus(isSuccess ? 'success' : 'failed')
            
            setTimeout(() => {
              onFaceVerificationComplete(isSuccess, imageSrc)
              setTimeout(() => {
                setIsFaceMode(false)
              }, 500)
            }, 1000)
          }, 1500)
        } else {
          setVerificationStatus('failed')
          setTimeout(() => {
            onFaceVerificationComplete(false, null)
          }, 1200)
        }
      }, 500)
    }
  }, [onFaceVerificationComplete])

  const handleStartFaceVerification = () => {
    setIsFaceMode(true)
  }

  const handleCancelFaceVerification = () => {
    setIsFaceMode(false)
    setCapturedImage(null)
    setVerificationStatus('idle')
    setCameraError(null)
    setFaceDetected(false)
    setDetectionProgress(0)
    hasTriggeredVerification.current = false
  }

  const handleRetry = () => {
    setCapturedImage(null)
    setVerificationStatus('scanning')
    setFaceDetected(false)
    setDetectionProgress(0)
    hasTriggeredVerification.current = false
  }

  const handleCameraError = useCallback(() => {
    setCameraError('Camera access denied. Please grant permission.')
  }, [])

  const handleStartFingerprint = () => {
    setIsFingerprintMode(true)
    setFingerprintStatus('scanning')
    setFingerprintProgress(0)
    
    let progress = 0
    const progressInterval = setInterval(() => {
      progress += Math.random() * 15 + 5
      if (progress >= 100) {
        progress = 100
        clearInterval(progressInterval)
        setFingerprintProgress(100)
        setFingerprintStatus('verifying')
        
        setTimeout(() => {
          onFingerprint()
          
          setTimeout(() => {
            const isSuccess = Math.random() > 0.15
            setFingerprintStatus(isSuccess ? 'success' : 'failed')
            
            setTimeout(() => {
              setIsFingerprintMode(false)
              setFingerprintStatus('idle')
            }, 1500)
          }, 1000)
        }, 500)
      } else {
        setFingerprintProgress(progress)
      }
    }, 150)
  }

  const handleCancelFingerprint = () => {
    setIsFingerprintMode(false)
    setFingerprintStatus('idle')
    setFingerprintProgress(0)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-indigo-600 via-indigo-500 to-sky-500 p-4 sm:p-6 text-white shadow-xl"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-bold">Live Biometric Console</h2>
          <p className="text-xs sm:text-sm text-white/80">
            {isFaceMode ? 'Facial Recognition Active' : isFingerprintMode ? 'Fingerprint Scanning' : 'ESP32-S3 camera & R307 fingerprint'}
          </p>
        </div>
        <div className={`rounded-full bg-white/15 p-2 sm:p-3 ${(isScanning || isFaceMode || isFingerprintMode) ? 'animate-pulse' : ''}`}>
          {isFaceMode ? <ScanFace className="h-5 w-5 sm:h-6 sm:w-6" /> : 
           isFingerprintMode ? <Fingerprint className="h-5 w-5 sm:h-6 sm:w-6" /> :
           <Activity className="h-5 w-5 sm:h-6 sm:w-6" />}
        </div>
      </div>

      <AnimatePresence>
        {isFaceMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-950 border border-white/20">
              {cameraError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                  <AlertTriangle className="h-10 w-10 text-rose-400 mb-3" />
                  <p className="text-xs text-rose-300">{cameraError}</p>
                  <button
                    onClick={() => setCameraError(null)}
                    className="mt-3 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold"
                  >
                    Retry
                  </button>
                </div>
              ) : capturedImage && verificationStatus !== 'scanning' ? (
                <div className="relative w-full h-full">
                  <img 
                    src={capturedImage} 
                    alt="Captured" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60">
                    {verificationStatus === 'verifying' && (
                      <div className="text-center">
                        <div className="relative">
                          <Loader2 className="h-12 w-12 text-white/70 animate-spin mx-auto" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <ScanFace className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <p className="mt-3 text-sm font-semibold">Verifying...</p>
                      </div>
                    )}
                    {verificationStatus === 'success' && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-center"
                      >
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/30 mx-auto">
                          <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                        </div>
                        <p className="mt-3 text-base font-semibold text-emerald-400">Attendance Taken!</p>
                      </motion.div>
                    )}
                    {verificationStatus === 'failed' && (
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="text-center"
                      >
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/30 mx-auto">
                          <AlertTriangle className="h-10 w-10 text-rose-400" />
                        </div>
                        <p className="mt-3 text-base font-semibold text-rose-400">Verification Failed</p>
                      </motion.div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    videoConstraints={videoConstraints}
                    onUserMediaError={handleCameraError}
                    className="w-full h-full object-cover"
                    mirrored
                  />
                  
                  <div className="absolute inset-0 pointer-events-none">
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <ellipse 
                        cx="50" 
                        cy="45" 
                        rx="22" 
                        ry="30" 
                        fill="none" 
                        stroke={faceDetected ? '#10b981' : 'rgba(255,255,255,0.5)'} 
                        strokeWidth="0.5"
                        strokeDasharray={faceDetected ? "0" : "2,2"}
                        className="transition-all duration-300"
                      />
                    </svg>
                    
                    {verificationStatus === 'detecting' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="absolute inset-0 bg-emerald-500/20"
                      />
                    )}
                    
                    <div className="absolute top-2 left-1/2 -translate-x-1/2">
                      <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${
                        faceDetected 
                          ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40' 
                          : 'bg-black/40 text-white/80 border border-white/20'
                      }`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${faceDetected ? 'bg-emerald-400 animate-pulse' : 'bg-white/60'}`} />
                        {faceDetected ? 'Hold Still' : 'Scanning...'}
                      </div>
                    </div>

                    {verificationStatus === 'scanning' && (
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="h-1 w-full rounded-full bg-black/40 overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${faceDetected ? 'bg-emerald-400' : 'bg-white/50'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${detectionProgress}%` }}
                            transition={{ duration: 0.2 }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="mt-3 flex gap-2">
              {verificationStatus === 'failed' ? (
                <>
                  <button
                    onClick={handleRetry}
                    className="flex-1 rounded-lg bg-white/20 px-3 py-2 text-xs font-semibold transition hover:bg-white/30"
                  >
                    Retry
                  </button>
                  <button
                    onClick={handleCancelFaceVerification}
                    className="flex-1 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/20"
                  >
                    Cancel
                  </button>
                </>
              ) : verificationStatus === 'scanning' ? (
                <button
                  onClick={handleCancelFaceVerification}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/20"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </button>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isFingerprintMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-950 border border-white/20 flex items-center justify-center">
              <div className="relative flex flex-col items-center justify-center">
                <div className="relative">
                  {fingerprintStatus === 'scanning' && (
                    <>
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-indigo-400"
                        initial={{ scale: 1, opacity: 0.8 }}
                        animate={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        style={{ width: 80, height: 80, left: -10, top: -10 }}
                      />
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-sky-400"
                        initial={{ scale: 1, opacity: 0.6 }}
                        animate={{ scale: 1.8, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                        style={{ width: 80, height: 80, left: -10, top: -10 }}
                      />
                    </>
                  )}
                  
                  <motion.div
                    className={`flex h-16 w-16 items-center justify-center rounded-full ${
                      fingerprintStatus === 'success' ? 'bg-emerald-500/30' :
                      fingerprintStatus === 'failed' ? 'bg-rose-500/30' :
                      'bg-indigo-500/30'
                    }`}
                    animate={fingerprintStatus === 'scanning' ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ duration: 1, repeat: fingerprintStatus === 'scanning' ? Infinity : 0 }}
                  >
                    {fingerprintStatus === 'success' ? (
                      <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                    ) : fingerprintStatus === 'failed' ? (
                      <AlertTriangle className="h-10 w-10 text-rose-400" />
                    ) : fingerprintStatus === 'verifying' ? (
                      <Loader2 className="h-10 w-10 text-white/70 animate-spin" />
                    ) : (
                      <Fingerprint className={`h-10 w-10 ${fingerprintStatus === 'scanning' ? 'text-white/70' : 'text-white/50'}`} />
                    )}
                  </motion.div>
                </div>

                {fingerprintStatus === 'scanning' && (
                  <motion.div
                    className="absolute left-1/2 -translate-x-1/2 w-20 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
                    initial={{ top: '20%' }}
                    animate={{ top: ['20%', '80%', '20%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}

                <p className={`mt-4 text-sm font-semibold ${
                  fingerprintStatus === 'success' ? 'text-emerald-400' :
                  fingerprintStatus === 'failed' ? 'text-rose-400' :
                  'text-white'
                }`}>
                  {fingerprintStatus === 'scanning' && 'Place finger on sensor...'}
                  {fingerprintStatus === 'verifying' && 'Verifying...'}
                  {fingerprintStatus === 'success' && 'Attendance Taken!'}
                  {fingerprintStatus === 'failed' && 'Verification Failed'}
                </p>

                {(fingerprintStatus === 'scanning' || fingerprintStatus === 'verifying') && (
                  <div className="mt-4 w-48">
                    <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-sky-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${fingerprintProgress}%` }}
                        transition={{ duration: 0.2 }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-white/70 text-center">{Math.round(fingerprintProgress)}%</p>
                  </div>
                )}
              </div>
            </div>

            {(fingerprintStatus === 'scanning' || fingerprintStatus === 'failed') && (
              <div className="mt-3">
                <button
                  onClick={handleCancelFingerprint}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold transition hover:bg-white/20"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {!isFaceMode && !isFingerprintMode && (
        <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartFingerprint}
            disabled={isScanning}
            className="flex items-center gap-2 rounded-full bg-white/10 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Fingerprint className="h-4 w-4" />
            Fingerprint
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleStartFaceVerification}
            disabled={isScanning}
            className="flex items-center gap-2 rounded-full bg-white/10 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ScanFace className="h-4 w-4" />
            Face ID
          </motion.button>
        </div>
      )}
      
      {!isFaceMode && !isFingerprintMode && (
        <div className="mt-4 sm:mt-6 rounded-xl border border-white/20 bg-white/10 p-3 sm:p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-white/80">System Signal</p>
          <div className="mt-2 flex items-center gap-2">
            {isScanning && (
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            )}
            <p className="text-xs sm:text-sm font-semibold">
              {isScanning ? 'Scanning biometric sensors...' : lastSignal || 'Awaiting first scan'}
            </p>
          </div>
        </div>
      )}
    </motion.div>
  )
}

export default BiometricConsole
