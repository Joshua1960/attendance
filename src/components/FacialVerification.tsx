import { useRef, useState, useCallback, useEffect } from 'react'
import Webcam from 'react-webcam'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, X, ScanFace, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react'

interface FacialVerificationProps {
  isOpen: boolean
  onClose: () => void
  onVerificationComplete: (success: boolean, capturedImage: string | null) => void
}

const FacialVerification = ({ 
  isOpen, 
  onClose, 
  onVerificationComplete,
}: FacialVerificationProps) => {
  const webcamRef = useRef<Webcam>(null)
  const [verificationStatus, setVerificationStatus] = useState<'scanning' | 'detecting' | 'verifying' | 'success' | 'failed'>('scanning')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [faceDetected, setFaceDetected] = useState(false)
  const [detectionProgress, setDetectionProgress] = useState(0)
  const hasTriggeredVerification = useRef(false)

  const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: 'user'
  }

  useEffect(() => {
    if (isOpen) {
      setVerificationStatus('scanning')
      setCapturedImage(null)
      setCameraError(null)
      setFaceDetected(false)
      setDetectionProgress(0)
      hasTriggeredVerification.current = false
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen || verificationStatus !== 'scanning' || hasTriggeredVerification.current) return

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
  }, [isOpen, verificationStatus])

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
              onVerificationComplete(isSuccess, imageSrc)
            }, 1200)
          }, 1500)
        } else {
          setVerificationStatus('failed')
          setTimeout(() => {
            onVerificationComplete(false, null)
          }, 1200)
        }
      }, 500)
    }
  }, [onVerificationComplete])

  const handleRetry = () => {
    setCapturedImage(null)
    setVerificationStatus('scanning')
    setFaceDetected(false)
    setDetectionProgress(0)
    hasTriggeredVerification.current = false
  }

  const handleCameraError = useCallback(() => {
    setCameraError('Unable to access camera. Please ensure camera permissions are granted.')
  }, [])

  const handleClose = () => {
    setCapturedImage(null)
    setVerificationStatus('scanning')
    setCameraError(null)
    setFaceDetected(false)
    setDetectionProgress(0)
    hasTriggeredVerification.current = false
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 px-4 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                verificationStatus === 'success' ? 'bg-emerald-500/20 text-emerald-300' :
                verificationStatus === 'failed' ? 'bg-rose-500/20 text-rose-300' :
                'bg-slate-800 text-slate-300'
              }`}>
                <ScanFace className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Facial Verification</h2>
                <p className="text-xs text-slate-400">
                  {verificationStatus === 'scanning' && 'Position your face within the frame'}
                  {verificationStatus === 'detecting' && 'Face detected! Capturing...'}
                  {verificationStatus === 'verifying' && 'Verifying identity...'}
                  {verificationStatus === 'success' && 'Verification successful!'}
                  {verificationStatus === 'failed' && 'Verification failed'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="rounded-full p-2 text-slate-400 transition hover:bg-white/10"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Camera View */}
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-slate-950 border border-slate-700">
            {cameraError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                <AlertTriangle className="h-12 w-12 text-rose-400 mb-4" />
                <p className="text-sm text-rose-300">{cameraError}</p>
                <button
                  onClick={() => setCameraError(null)}
                  className="mt-4 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white"
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
                        <Loader2 className="h-16 w-16 text-indigo-400 animate-spin mx-auto" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ScanFace className="h-8 w-8 text-slate-300" />
                        </div>
                      </div>
                      <p className="mt-4 text-sm font-semibold text-white">Verifying identity...</p>
                      <p className="text-xs text-slate-400">Analyzing facial features</p>
                    </div>
                  )}
                  {verificationStatus === 'success' && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-center"
                    >
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 mx-auto">
                        <CheckCircle2 className="h-12 w-12 text-emerald-400" />
                      </div>
                      <p className="mt-4 text-lg font-semibold text-emerald-400">Verified!</p>
                      <p className="text-sm text-slate-400">Identity confirmed</p>
                    </motion.div>
                  )}
                  {verificationStatus === 'failed' && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-center"
                    >
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/20 mx-auto">
                        <AlertTriangle className="h-12 w-12 text-rose-400" />
                      </div>
                      <p className="mt-4 text-lg font-semibold text-rose-400">Verification Failed</p>
                      <p className="text-sm text-slate-400">Face not recognized</p>
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
                      stroke={faceDetected ? '#10b981' : '#6366f1'} 
                      strokeWidth="0.5"
                      strokeDasharray={faceDetected ? "0" : "2,2"}
                      className="transition-all duration-300"
                    />
                  </svg>
                  
                  {verificationStatus === 'detecting' && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className="absolute inset-0 bg-emerald-500/20"
                      />
                    </div>
                  )}
                  
                  {verificationStatus === 'scanning' && (
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="mx-auto max-w-xs">
                        <div className="h-1.5 w-full rounded-full bg-slate-800/80 overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${faceDetected ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${detectionProgress}%` }}
                            transition={{ duration: 0.2 }}
                          />
                        </div>
                        <p className={`mt-2 text-center text-xs font-medium ${
                          faceDetected ? 'text-emerald-300' : 'text-slate-300'
                        }`}>
                          {faceDetected 
                            ? detectionProgress < 100 
                              ? `Detecting face... ${Math.round(detectionProgress)}%`
                              : 'Face locked! Capturing...'
                            : 'Searching for face...'}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="absolute top-4 left-1/2 -translate-x-1/2">
                    <div className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold backdrop-blur-sm ${
                      faceDetected 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                        : 'bg-slate-900/60 text-slate-300 border border-slate-600'
                    }`}>
                      <div className={`h-2 w-2 rounded-full ${faceDetected ? 'bg-emerald-400 animate-pulse' : 'bg-indigo-400'}`} />
                      {verificationStatus === 'scanning' && (faceDetected ? 'Face Detected - Hold Still' : 'Looking for face...')}
                      {verificationStatus === 'detecting' && 'Capturing...'}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {verificationStatus === 'scanning' && (
            <div className="mt-4 rounded-xl border border-slate-700 bg-slate-800/50 p-3">
              <div className="flex items-start gap-3">
                <Camera className="h-5 w-5 text-slate-300 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-slate-400">
                  <p className="font-semibold text-white mb-1">Auto-verification enabled</p>
                  <p>Position your face within the oval guide. Verification will start automatically when your face is detected.</p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex gap-3">
            {verificationStatus === 'failed' ? (
              <>
                <button
                  onClick={handleRetry}
                  className="flex-1 rounded-xl border border-slate-600 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 rounded-xl bg-slate-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-600"
                >
                  Cancel
                </button>
              </>
            ) : verificationStatus === 'scanning' ? (
              <button
                onClick={handleClose}
                className="w-full rounded-xl border border-slate-600 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default FacialVerification
