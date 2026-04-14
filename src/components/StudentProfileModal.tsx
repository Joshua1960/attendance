import { motion, AnimatePresence } from 'framer-motion'
import { X, User, Mail, Phone, BookOpen, TrendingUp, Fingerprint, ScanFace } from 'lucide-react'
import type { Student, AttendanceLog } from '../contexts/MasStoreContext'

interface StudentProfileModalProps {
  student: Student | null
  attendanceLogs: AttendanceLog[]
  attendanceRate: number
  lecturersById: Record<string, string>
  onClose: () => void
  variant?: 'default' | 'dashboard'
}

const StudentProfileModal = ({ student, attendanceLogs, attendanceRate, lecturersById, onClose, variant = 'dashboard' }: StudentProfileModalProps) => {
  const isDashboard = variant === 'dashboard'
  if (!student) return null

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'Face': return <ScanFace className="h-4 w-4" />
      case 'Fingerprint': return <Fingerprint className="h-4 w-4" />
      default: return null
    }
  }

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm" onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl ${isDashboard ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <img src={student.photoUrl} alt={student.name} className={`h-20 w-20 rounded-2xl border-2 object-cover ${isDashboard ? 'border-slate-600' : 'border-indigo-200'}`} />
              <div>
                <h2 className={`text-xl font-bold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>{student.name}</h2>
                <p className={`text-sm ${isDashboard ? 'text-slate-400' : 'text-slate-500'}`}>{student.program}</p>
                <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${student.status === 'Active' ? isDashboard ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-50 text-emerald-700' : isDashboard ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>{student.status}</span>
              </div>
            </div>
            <button onClick={onClose} className={`rounded-full p-2 transition ${isDashboard ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}><X className="h-5 w-5" /></button>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {[
              { icon: <User className="h-4 w-4" />, label: 'Matric Number', value: student.matricNumber },
              { icon: <BookOpen className="h-4 w-4" />, label: 'Class', value: student.className },
              ...(student.email ? [{ icon: <Mail className="h-4 w-4" />, label: 'Email', value: student.email }] : []),
              ...(student.phone ? [{ icon: <Phone className="h-4 w-4" />, label: 'Phone', value: student.phone }] : []),
            ].map((item) => (
              <div key={item.label} className={`rounded-xl border p-4 ${isDashboard ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex items-center gap-2">
                  <span className={isDashboard ? 'text-slate-400' : 'text-slate-400'}>{item.icon}</span>
                  <span className={`text-xs uppercase tracking-wide ${isDashboard ? 'text-slate-400' : 'text-slate-500'}`}>{item.label}</span>
                </div>
                <p className={`mt-1 font-semibold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>{item.value}</p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <h3 className={`text-sm font-semibold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>Attendance Performance</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <div className={`rounded-xl border p-4 text-center ${isDashboard ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
                <TrendingUp className={`h-5 w-5 mx-auto ${attendanceRate >= 80 ? 'text-emerald-400' : attendanceRate >= 60 ? 'text-amber-400' : 'text-rose-400'}`} />
                <p className={`mt-2 text-3xl font-bold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>{attendanceRate}%</p>
                <p className={`text-xs ${isDashboard ? 'text-slate-400' : 'text-slate-500'}`}>Attendance Rate</p>
              </div>
              <div className={`rounded-xl border p-4 text-center ${isDashboard ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
                <p className={`text-3xl font-bold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>{attendanceLogs.length}</p>
                <p className={`text-xs ${isDashboard ? 'text-slate-400' : 'text-slate-500'}`}>Total Check-ins</p>
              </div>
              <div className={`rounded-xl border p-4 text-center ${isDashboard ? 'border-slate-700 bg-slate-800/50' : 'border-slate-100 bg-slate-50'}`}>
                <p className={`text-3xl font-bold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>{student.lastSeen}</p>
                <p className={`text-xs ${isDashboard ? 'text-slate-400' : 'text-slate-500'}`}>Last Seen</p>
              </div>
            </div>
          </div>
          {student.lecturerIds.length > 0 && (
            <div className="mt-6">
              <h3 className={`text-sm font-semibold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>Assigned Lecturers</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {student.lecturerIds.map((id) => (
                  <span key={id} className={`rounded-full px-3 py-1 text-xs font-medium ${isDashboard ? 'bg-slate-700 text-slate-300' : 'bg-indigo-50 text-indigo-700'}`}>{lecturersById[id] || id}</span>
                ))}
              </div>
            </div>
          )}
          <div className="mt-6">
            <h3 className={`text-sm font-semibold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>Recent Attendance History</h3>
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
              {attendanceLogs.length === 0 ? (
                <p className={`text-sm ${isDashboard ? 'text-slate-400' : 'text-slate-500'}`}>No attendance records yet</p>
              ) : (
                attendanceLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className={`flex items-center justify-between rounded-lg border p-3 ${isDashboard ? 'border-slate-700 bg-slate-800/30' : 'border-slate-100 bg-slate-50'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2 ${isDashboard ? 'bg-slate-800 text-slate-400' : 'bg-indigo-50 text-indigo-600'}`}>{getMethodIcon(log.method)}</div>
                      <div>
                        <p className={`text-sm font-medium ${isDashboard ? 'text-white' : 'text-slate-900'}`}>{log.sessionLabel}</p>
                        <p className={`text-xs ${isDashboard ? 'text-slate-400' : 'text-slate-500'}`}>{log.sessionDate} • {log.className}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${isDashboard ? 'text-white' : 'text-slate-900'}`}>{log.timestamp}</p>
                      <span className={`text-xs ${isDashboard ? 'text-slate-400' : 'text-slate-500'}`}>{log.method}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default StudentProfileModal
