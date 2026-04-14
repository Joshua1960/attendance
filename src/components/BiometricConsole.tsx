import { useRef, useState, useCallback, useEffect } from 'react'
import Webcam from 'react-webcam'
import { Fingerprint, ScanFace, X, CheckCircle2, AlertTriangle, Loader2, Wifi, Camera } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBiometric } from '../contexts/BiometricContext'
import type { Student } from '../contexts/MasStoreContext'

type FaceVerificationStatus = 'idle' | 'scanning' | 'detecting' | 'verifying' | 'success' | 'failed'
type FingerprintStatus = 'idle' | 'scanning' | 'verifying' | 'success' | 'failed'

export type ScanResult = {
  status: 'success' | 'error'
  student?: Student
  timestamp: string
  message: string
  capturedImage?: string | null
}

export type CameraConfig = {
  type: 'webcam' | 'external'
  externalUrl?: string
}

interface BiometricConsoleProps {
  onFingerprint: () => void
  onFaceVerificationComplete: (success: boolean, capturedImage: string | null) => void
  scanResult?: ScanResult
  isScanning: boolean
  cameraConfig?: CameraConfig
  onOpenCameraSettings?: () => void
}

const BiometricConsole = ({ 
  onFingerprint, 
  onFaceVerificationComplete, 
  scanResult,
  isScanning,
  cameraConfig = { type: 'webcam' },
  onOpenCameraSettings
}: BiometricConsoleProps) => {
  const { lastSignal } = useBiometric()
  const webcamRef = useRef<Webcam>(null)
  const externalImgRef = useRef<HTMLImageElement>(null)
  
  const [isFaceMode, setIsFaceMode] = useState(false)
  const [isFingerprintMode, setIsFingerprintMode] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<FaceVerificationStatus>('idle')
  const [fingerprintStatus, setFingerprintStatus] = useState<FingerprintStatus>('idle')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [faceDetected, setFaceDetected] = useState(false)
  const [detectionProgress, setDetectionProgress] = useState(0)
  const [fingerprintProgress, setFingerprintProgress] = useState(0)
  const [externalStreamLoading, setExternalStreamLoading] = useState(false)
  const hasTriggeredVerification = useRef(false)

  const isExternalCamera = cameraConfig.type === 'external' && cameraConfig.externalUrl

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
      if (isExternalCamera) {
        setExternalStreamLoading(true)
      }
    } else {
      setVerificationStatus('idle')
      setExternalStreamLoading(false)
    }
  }, [isFaceMode, isExternalCamera])

  useEffect(() => {
    if (isExternalCamera && isFaceMode && externalStreamLoading) {
      const timer = setTimeout(() => {
        setExternalStreamLoading(false)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [isExternalCamera, isFaceMode, externalStreamLoading])

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
    setVerificationStatus('detecting')
    
    setTimeout(() => {
      let imageSrc: string | null = null
      
      if (isExternalCamera) {
        const canvas = document.createElement('canvas')
        canvas.width = 480
        canvas.height = 360
        const ctx = canvas.getContext('2d')
        if (ctx && externalImgRef.current) {
          ctx.drawImage(externalImgRef.current, 0, 0, 480, 360)
          imageSrc = canvas.toDataURL('image/jpeg')
        }
        
        if (!imageSrc) {
          imageSrc = `https://api.dicebear.com/9.x/initials/svg?seed=${Date.now()}`
        }
      } else if (webcamRef.current) {
        imageSrc = webcamRef.current.getScreenshot()
      }
      
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
  }, [onFaceVerificationComplete, isExternalCamera])

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
    setExternalStreamLoading(false)
  }

  const handleRetry = () => {
    setCapturedImage(null)
    setVerificationStatus('scanning')
    setFaceDetected(false)
    setDetectionProgress(0)
    hasTriggeredVerification.current = false
    if (isExternalCamera) {
      setExternalStreamLoading(true)
    }
  }

  const handleCameraError = useCallback(() => {
    setCameraError('Camera access denied. Please grant permission.')
  }, [])

  const handleExternalCameraError = useCallback(() => {
    setCameraError('Failed to connect to external camera. Please check the IP address.')
    setExternalStreamLoading(false)
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

  const renderExternalCamera = () => {
    if (externalStreamLoading) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950">
          <Loader2 className="h-8 w-8 text-white/70 animate-spin mb-2" />
          <p className="text-xs text-white/80">Connecting...</p>
        </div>
      )
    }

    return (
      <>
        <img
          ref={externalImgRef}
          src={cameraConfig.externalUrl}
          alt="External Camera Stream"
          className="w-full h-full object-cover"
          onError={handleExternalCameraError}
          onLoad={() => setExternalStreamLoading(false)}
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
              <Wifi className="h-3 w-3 mr-1" />
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
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-indigo-600 via-indigo-500 to-sky-500 p-3 sm:p-4 text-white shadow-xl"
    >
      {/* Header - Compact */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold">Take Attendance</h2>
        </div>
        <div className="flex items-center gap-2">
          {isExternalCamera && (
            <div className="flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs">
              <Wifi className="h-3 w-3" />
              <span className="hidden sm:inline">External</span>
            </div>
          )}
          <div className={`rounded-full bg-white/15 p-1.5 sm:p-2 ${(isScanning || isFaceMode || isFingerprintMode) ? 'animate-pulse' : ''}`}>
            {isFaceMode ? <ScanFace className="h-4 w-4 sm:h-5 sm:w-5" /> : 
             isFingerprintMode ? <Fingerprint className="h-4 w-4 sm:h-5 sm:w-5" /> :
             <Fingerprint className="h-4 w-4 sm:h-5 sm:w-5" />}
          </div>
        </div>
      </div>

      {/* Main Content Area - Scanner + Result */}
      <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
        {/* Scanner Area */}
        <div className="space-y-2">
          <AnimatePresence>
            {isFaceMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-950 border border-white/20">
                  {cameraError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center">
                      <AlertTriangle className="h-8 w-8 text-rose-400 mb-2" />
                      <p className="text-xs text-rose-300">{cameraError}</p>
                      <button
                        onClick={() => {
                          setCameraError(null)
                          if (isExternalCamera) {
                            setExternalStreamLoading(true)
                          }
                        }}
                        className="mt-2 rounded-lg bg-white/20 px-3 py-1.5 text-xs font-semibold"
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
                              <Loader2 className="h-10 w-10 text-white/70 animate-spin mx-auto" />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <ScanFace className="h-5 w-5 text-white" />
                              </div>
                            </div>
                            <p className="mt-2 text-sm font-semibold">Verifying...</p>
                          </div>
                        )}
                        {verificationStatus === 'success' && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-center"
                          >
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/30 mx-auto">
                              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                            </div>
                            <p className="mt-2 text-sm font-semibold text-emerald-400">Attendance Taken!</p>
                          </motion.div>
                        )}
                        {verificationStatus === 'failed' && (
                          <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="text-center"
                          >
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/30 mx-auto">
                              <AlertTriangle className="h-8 w-8 text-rose-400" />
                            </div>
                            <p className="mt-2 text-sm font-semibold text-rose-400">Failed</p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  ) : isExternalCamera ? (
                    renderExternalCamera()
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

                <div className="flex gap-2">
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
                className="overflow-hidden"
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
                            style={{ width: 70, height: 70, left: -7, top: -7 }}
                          />
                          <motion.div
                            className="absolute inset-0 rounded-full border-2 border-sky-400"
                            initial={{ scale: 1, opacity: 0.6 }}
                            animate={{ scale: 1.7, opacity: 0 }}
                            transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                            style={{ width: 70, height: 70, left: -7, top: -7 }}
                          />
                        </>
                      )}
                      
                      <motion.div
                        className={`flex h-14 w-14 items-center justify-center rounded-full ${
                          fingerprintStatus === 'success' ? 'bg-emerald-500/30' :
                          fingerprintStatus === 'failed' ? 'bg-rose-500/30' :
                          'bg-indigo-500/30'
                        }`}
                        animate={fingerprintStatus === 'scanning' ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ duration: 1, repeat: fingerprintStatus === 'scanning' ? Infinity : 0 }}
                      >
                        {fingerprintStatus === 'success' ? (
                          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                        ) : fingerprintStatus === 'failed' ? (
                          <AlertTriangle className="h-8 w-8 text-rose-400" />
                        ) : fingerprintStatus === 'verifying' ? (
                          <Loader2 className="h-8 w-8 text-white/70 animate-spin" />
                        ) : (
                          <Fingerprint className={`h-8 w-8 ${fingerprintStatus === 'scanning' ? 'text-white/70' : 'text-white/50'}`} />
                        )}
                      </motion.div>
                    </div>

                    {fingerprintStatus === 'scanning' && (
                      <motion.div
                        className="absolute left-1/2 -translate-x-1/2 w-16 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent"
                        initial={{ top: '20%' }}
                        animate={{ top: ['20%', '80%', '20%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                      />
                    )}

                    <p className={`mt-3 text-sm font-semibold ${
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
                      <div className="mt-3 w-40">
                        <div className="h-1 w-full rounded-full bg-white/20 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-sky-400"
                            initial={{ width: 0 }}
                            animate={{ width: `${fingerprintProgress}%` }}
                            transition={{ duration: 0.2 }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-white/70 text-center">{Math.round(fingerprintProgress)}%</p>
                      </div>
                    )}
                  </div>
                </div>

                {(fingerprintStatus === 'scanning' || fingerprintStatus === 'failed') && (
                  <div className="mt-2">
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
          
          {/* Action Buttons */}
          {!isFaceMode && !isFingerprintMode && (
            <div className="flex flex-wrap gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartFingerprint}
                disabled={isScanning}
                className="flex items-center gap-2 rounded-full bg-white/15 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Fingerprint className="h-4 w-4" />
                Fingerprint
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartFaceVerification}
                disabled={isScanning}
                className="flex items-center gap-2 rounded-full bg-white/15 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ScanFace className="h-4 w-4" />
                Face ID
              </motion.button>
              {onOpenCameraSettings && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onOpenCameraSettings}
                  className="flex items-center gap-2 rounded-full bg-white/15 px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/25"
                >
                  <Camera className="h-4 w-4" />
                  <span className="hidden sm:inline">Camera</span>
                </motion.button>
              )}
            </div>
          )}
        </div>

        {/* Scan Result Panel */}
        <div className="rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Scan Result</p>
          <div className="mt-2 space-y-2">
            {isScanning ? (
              <div className="space-y-2 rounded-xl border border-white/20 bg-white/5 p-3">
                <div className="h-3 w-20 animate-pulse rounded-full bg-white/40" />
                <div className="h-2 w-32 animate-pulse rounded-full bg-white/30" />
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-white/40" />
                  <div className="space-y-1.5">
                    <div className="h-2 w-24 animate-pulse rounded-full bg-white/40" />
                    <div className="h-2 w-16 animate-pulse rounded-full bg-white/30" />
                  </div>
                </div>
              </div>
            ) : scanResult ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-xl border p-3 ${
                  scanResult.status === 'success'
                    ? 'border-emerald-400/40 bg-emerald-500/20'
                    : 'border-rose-400/50 bg-rose-500/20'
                }`}
              >
                {scanResult.capturedImage && (
                  <div className="mb-2 overflow-hidden rounded-lg border border-white/20">
                    <img
                      src={scanResult.capturedImage}
                      alt="Captured face"
                      className="w-full h-16 object-cover"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm font-semibold">
                  {scanResult.status === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-rose-300" />
                  )}
                  <span>
                    {scanResult.status === 'success'
                      ? 'Attendance Taken'
                      : 'Verification Failed'}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-white/80">
                  {scanResult.message}
                </p>
                {scanResult.status === 'success' && scanResult.student ? (
                  <div className="mt-2 flex items-center gap-2 rounded-lg bg-white/10 p-2">
                    <img
                      src={scanResult.capturedImage || scanResult.student.photoUrl}
                      alt={scanResult.student.name}
                      className="h-8 w-8 rounded-full border border-white/20 object-cover"
                    />
                    <div>
                      <p className="text-xs font-semibold">
                        {scanResult.student.name}
                      </p>
                      <p className="text-[10px] text-white/70">
                        {scanResult.student.matricNumber}
                      </p>
                    </div>
                  </div>
                ) : null}
                <p className="mt-1.5 text-[10px] text-white/60">
                  {scanResult.timestamp}
                </p>
              </motion.div>
            ) : (
              <div className="rounded-xl border border-white/20 bg-white/5 p-3 text-center">
                <Fingerprint className="h-6 w-6 mx-auto text-white/40 mb-1.5" />
                <p className="text-xs text-white/60">
                  Run a scan to see results
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default BiometricConsole
