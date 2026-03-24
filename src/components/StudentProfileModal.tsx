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

const StudentProfileModal = ({
  student,
  attendanceLogs,
  attendanceRate,
  lecturersById,
  onClose,
  variant = 'dashboard',
}: StudentProfileModalProps) => {
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border p-6 shadow-2xl ${
            isDashboard ? 'border-indigo-400/40 bg-slate-900' : 'border-slate-200 bg-white'
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <img
                src={student.photoUrl}
                alt={student.name}
                className="h-20 w-20 rounded-2xl border-2 border-indigo-400/30 object-cover"
              />
              <div>
                <h2 className={`text-xl font-bold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>
                  {student.name}
                </h2>
                <p className={`text-sm ${isDashboard ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {student.program}
                </p>
                <span
                  className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                    student.status === 'Active'
                      ? isDashboard ? 'bg-emerald-400/20 text-emerald-100' : 'bg-emerald-50 text-emerald-700'
                      : isDashboard ? 'bg-slate-500/20 text-slate-200' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {student.status}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`rounded-full p-2 transition ${
                isDashboard ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
              }`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Info Grid */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className={`rounded-xl border p-4 ${isDashboard ? 'border-indigo-400/20 bg-slate-950/50' : 'border-slate-100 bg-slate-50'}`}>
              <div className="flex items-center gap-2">
                <User className={`h-4 w-4 ${isDashboard ? 'text-indigo-300' : 'text-slate-400'}`} />
                <span className={`text-xs uppercase tracking-wide ${isDashboard ? 'text-indigo-200' : 'text-slate-500'}`}>
                  Matric Number
                </span>
              </div>
              <p className={`mt-1 font-semibold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>
                {student.matricNumber}
              </p>
            </div>
            <div className={`rounded-xl border p-4 ${isDashboard ? 'border-indigo-400/20 bg-slate-950/50' : 'border-slate-100 bg-slate-50'}`}>
              <div className="flex items-center gap-2">
                <BookOpen className={`h-4 w-4 ${isDashboard ? 'text-indigo-300' : 'text-slate-400'}`} />
                <span className={`text-xs uppercase tracking-wide ${isDashboard ? 'text-indigo-200' : 'text-slate-500'}`}>
                  Class
                </span>
              </div>
              <p className={`mt-1 font-semibold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>
                {student.className}
              </p>
            </div>
            {student.email && (
              <div className={`rounded-xl border p-4 ${isDashboard ? 'border-indigo-400/20 bg-slate-950/50' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex items-center gap-2">
                  <Mail className={`h-4 w-4 ${isDashboard ? 'text-indigo-300' : 'text-slate-400'}`} />
                  <span className={`text-xs uppercase tracking-wide ${isDashboard ? 'text-indigo-200' : 'text-slate-500'}`}>
                    Email
                  </span>
                </div>
                <p className={`mt-1 font-semibold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>
                  {student.email}
                </p>
              </div>
            )}
            {student.phone && (
              <div className={`rounded-xl border p-4 ${isDashboard ? 'border-indigo-400/20 bg-slate-950/50' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex items-center gap-2">
                  <Phone className={`h-4 w-4 ${isDashboard ? 'text-indigo-300' : 'text-slate-400'}`} />
                  <span className={`text-xs uppercase tracking-wide ${isDashboard ? 'text-indigo-200' : 'text-slate-500'}`}>
                    Phone
                  </span>
                </div>
                <p className={`mt-1 font-semibold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>
                  {student.phone}
                </p>
              </div>
            )}
          </div>

          {/* Attendance Stats */}
          <div className="mt-6">
            <h3 className={`text-sm font-semibold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>
              Attendance Performance
            </h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <div className={`rounded-xl border p-4 text-center ${isDashboard ? 'border-indigo-400/20 bg-slate-950/50' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className={`h-5 w-5 ${attendanceRate >= 80 ? 'text-emerald-400' : attendanceRate >= 60 ? 'text-amber-400' : 'text-rose-400'}`} />
                </div>
                <p className={`mt-2 text-3xl font-bold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>
                  {attendanceRate}%
                </p>
                <p className={`text-xs ${isDashboard ? 'text-indigo-200' : 'text-slate-500'}`}>
                  Attendance Rate
                </p>
              </div>
              <div className={`rounded-xl border p-4 text-center ${isDashboard ? 'border-indigo-400/20 bg-slate-950/50' : 'border-slate-100 bg-slate-50'}`}>
                <p className={`text-3xl font-bold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>
                  {attendanceLogs.length}
                </p>
                <p className={`text-xs ${isDashboard ? 'text-indigo-200' : 'text-slate-500'}`}>
                  Total Check-ins
                </p>
              </div>
              <div className={`rounded-xl border p-4 text-center ${isDashboard ? 'border-indigo-400/20 bg-slate-950/50' : 'border-slate-100 bg-slate-50'}`}>
                <p className={`text-3xl font-bold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>
                  {student.lastSeen}
                </p>
                <p className={`text-xs ${isDashboard ? 'text-indigo-200' : 'text-slate-500'}`}>
                  Last Seen
                </p>
              </div>
            </div>
          </div>

          {/* Lecturers */}
          {student.lecturerIds.length > 0 && (
            <div className="mt-6">
              <h3 className={`text-sm font-semibold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>
                Assigned Lecturers
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {student.lecturerIds.map((id) => (
                  <span
                    key={id}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      isDashboard ? 'bg-indigo-500/20 text-indigo-100' : 'bg-indigo-50 text-indigo-700'
                    }`}
                  >
                    {lecturersById[id] || id}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent Attendance */}
          <div className="mt-6">
            <h3 className={`text-sm font-semibold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>
              Recent Attendance History
            </h3>
            <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
              {attendanceLogs.length === 0 ? (
                <p className={`text-sm ${isDashboard ? 'text-indigo-200' : 'text-slate-500'}`}>
                  No attendance records yet
                </p>
              ) : (
                attendanceLogs.slice(0, 10).map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      isDashboard ? 'border-indigo-400/20 bg-slate-950/30' : 'border-slate-100 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`rounded-lg p-2 ${
                        isDashboard ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        {getMethodIcon(log.method)}
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isDashboard ? 'text-white' : 'text-slate-900'}`}>
                          {log.sessionLabel}
                        </p>
                        <p className={`text-xs ${isDashboard ? 'text-indigo-200' : 'text-slate-500'}`}>
                          {log.sessionDate} • {log.className}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${isDashboard ? 'text-white' : 'text-slate-900'}`}>
                        {log.timestamp}
                      </p>
                      <span className={`text-xs ${isDashboard ? 'text-indigo-200' : 'text-slate-500'}`}>
                        {log.method}
                      </span>
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
