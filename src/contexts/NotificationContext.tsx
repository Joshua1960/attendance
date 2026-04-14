import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react'

type NotificationType = 'success' | 'error' | 'info' | 'warning'

type Notification = {
  id: string
  type: NotificationType
  title: string
  message: string
}

type NotificationContextValue = {
  success: (title: string, message: string) => void
  error: (title: string, message: string) => void
  info: (title: string, message: string) => void
  warning: (title: string, message: string) => void
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined)

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((type: NotificationType, title: string, message: string) => {
    const id = `notif-${Date.now()}`
    setNotifications((prev) => [...prev, { id, type, title, message }])
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 4000)
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const value = useMemo(
    () => ({
      success: (title: string, message: string) => addNotification('success', title, message),
      error: (title: string, message: string) => addNotification('error', title, message),
      info: (title: string, message: string) => addNotification('info', title, message),
      warning: (title: string, message: string) => addNotification('warning', title, message),
    }),
    [addNotification],
  )

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        <AnimatePresence>
          {notifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              className={`flex items-start gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-sm max-w-sm ${
                notification.type === 'success'
                  ? 'border-emerald-400/40 bg-emerald-950/90 text-emerald-100'
                  : notification.type === 'error'
                    ? 'border-rose-400/40 bg-rose-950/90 text-rose-100'
                    : notification.type === 'warning'
                      ? 'border-amber-400/40 bg-amber-950/90 text-amber-100'
                      : 'border-sky-400/40 bg-sky-950/90 text-sky-100'
              }`}
            >
              {notification.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />}
              {notification.type === 'error' && <AlertTriangle className="h-5 w-5 text-rose-400 flex-shrink-0" />}
              {notification.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0" />}
              {notification.type === 'info' && <Info className="h-5 w-5 text-sky-400 flex-shrink-0" />}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{notification.title}</p>
                <p className="text-xs opacity-80 mt-0.5">{notification.message}</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-white/60 hover:text-white transition flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
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
