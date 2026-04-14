import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, AlertTriangle, Info, X, AlertCircle } from 'lucide-react'

type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message?: string
}

interface NotificationContextValue {
  notify: (type: NotificationType, title: string, message?: string) => void
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  warning: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const notify = useCallback((type: NotificationType, title: string, message?: string) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    setNotifications((prev) => [...prev, { id, type, title, message }])
    setTimeout(() => removeNotification(id), 5000)
  }, [removeNotification])

  const success = useCallback((title: string, message?: string) => notify('success', title, message), [notify])
  const error = useCallback((title: string, message?: string) => notify('error', title, message), [notify])
  const warning = useCallback((title: string, message?: string) => notify('warning', title, message), [notify])
  const info = useCallback((title: string, message?: string) => notify('info', title, message), [notify])

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success': return <CheckCircle2 className="h-5 w-5 text-emerald-400" />
      case 'error': return <AlertCircle className="h-5 w-5 text-rose-400" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-amber-400" />
      case 'info': return <Info className="h-5 w-5 text-sky-400" />
    }
  }

  const getBorderColor = (type: NotificationType) => {
    switch (type) {
      case 'success': return 'border-emerald-500/40'
      case 'error': return 'border-rose-500/40'
      case 'warning': return 'border-amber-500/40'
      case 'info': return 'border-sky-500/40'
    }
  }

  return (
    <NotificationContext.Provider value={{ notify, success, error, warning, info }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm w-full">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              className={`rounded-xl border ${getBorderColor(notification.type)} bg-white/95 backdrop-blur-sm p-4 shadow-2xl`}
            >
              <div className="flex items-start gap-3">
                {getIcon(notification.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-900">{notification.title}</p>
                  {notification.message && (
                    <p className="text-xs text-slate-500 mt-1">{notification.message}</p>
                  )}
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="text-slate-400 hover:text-slate-600 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  )
}

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}
