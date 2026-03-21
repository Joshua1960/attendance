import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Database,
  Fingerprint,
  ShieldCheck,
  Users,
  KeyRound,
  LogOut,
  UserPlus,
  FileDown,
  BookOpen,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Sun,
  Moon,
  Clock,
  ClipboardCheck,
} from 'lucide-react'
import { BiometricProvider, useBiometric } from './contexts/BiometricContext'
import { MasStoreProvider, useMasStore } from './contexts/MasStoreContext'
import AttendanceTable from './components/AttendanceTable'
import BiometricConsole from './components/BiometricConsole'
import StatCard from './components/StatCard'
import StudentList from './components/StudentList'

type Role = 'none' | 'super' | 'lecturer'
type ScanMode = 'Face' | 'Fingerprint'
type ThemeMode = 'dark' | 'light'

const Dashboard = ({
  role,
  onLogout,
  theme,
  onToggleTheme,
  activeLecturerId,
}: {
  role: Role
  onLogout: () => void
  theme: ThemeMode
  onToggleTheme: () => void
  activeLecturerId: string | null
}) => {
  const { scanFingerprint, scanFace, isScanning } = useBiometric()
  const {
    students,
    admins,
    lecturers,
    logs,
    addStudent,
    deleteStudent,
    addLog,
    updateStudentLastSeen,
    updateLecturerStatus,
    updateStudentLecturers,
    addLecturer,
    deleteLecturer,
    deleteLogsByDate,
  } = useMasStore()
  const [internalLecturerId] = useState<string | null>(null)
  const [scanMode, setScanMode] = useState<ScanMode>('Face')
  const isDark = theme === 'dark'
  const headingText = isDark ? 'text-white' : 'text-slate-900'
  const bodyText = isDark ? 'text-indigo-100' : 'text-slate-600'
  const subtleText = isDark ? 'text-indigo-200' : 'text-slate-500'
  const [lastScan, setLastScan] = useState<
    | {
        status: 'success' | 'error'
        student?: (typeof students)[number]
        timestamp: string
        message: string
      }
    | undefined
  >(undefined)
  const [registration, setRegistration] = useState({
    name: '',
    matric: '',
    program: '',
    className: '',
    lecturerId: '',
  })
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [enrolledFingerprint, setEnrolledFingerprint] = useState(false)
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(null)
  const [lecturerDraft, setLecturerDraft] = useState({
    name: '',
    email: '',
    password: '',
    className: '',
  })
  const [studentAssignment, setStudentAssignment] = useState({
    studentId: '',
    lecturerIds: [] as string[],
  })
  const [sessionPromptOpen, setSessionPromptOpen] = useState(false)
  const [sessionClosePrompt, setSessionClosePrompt] = useState(false)
  const [sessionForm, setSessionForm] = useState({ label: '1st Class' })
  const [activeSession, setActiveSession] = useState<
    | {
        label: string
        date: string
        start: string
        end?: string
      }
    | undefined
  >(undefined)
  const [sessionHistory, setSessionHistory] = useState<
    { label: string; date: string; start: string; end: string }[]
  >([])
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null)
  const [calendarModalOpen, setCalendarModalOpen] = useState(false)
  const [confirmDialog, setConfirmDialog] = useState<
    | {
        type: 'student' | 'lecturer'
        id: string
        name: string
      }
    | undefined
  >(undefined)
  const [studentModal, setStudentModal] = useState<'active' | 'manage' | null>(null)
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false)
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false)
  const [addLecturerModalOpen, setAddLecturerModalOpen] = useState(false)
  const [assignLecturerModalOpen, setAssignLecturerModalOpen] = useState(false)

  const resolvedLecturerId = activeLecturerId ?? internalLecturerId
  const activeLecturer = lecturers.find((lecturer) => lecturer.id === resolvedLecturerId)

  const handleScan = async (method: 'Fingerprint' | 'Face') => {
    if (role === 'lecturer' && !activeSession) {
      setSessionPromptOpen(true)
      return
    }
    const scan = method === 'Fingerprint' ? await scanFingerprint() : await scanFace()
    const availableStudents =
      role === 'lecturer' && activeLecturer
        ? students.filter((student) => student.lecturerIds.includes(activeLecturer.id))
        : students
    if (availableStudents.length === 0) {
      setLastScan({
        status: 'error',
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        message: 'No students assigned to this lecturer yet.',
      })
      return
    }
    const activeStudent = availableStudents[Math.floor(Math.random() * availableStudents.length)]
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
    const isSuccess = Math.random() > 0.18

    if (!isSuccess) {
      setLastScan({
        status: 'error',
        timestamp,
        message: method === 'Face' ? 'Biometric mismatch detected.' : 'Access denied. Fingerprint not recognized.',
      })
      return
    }

    addLog({
      id: `log-${Date.now()}`,
      studentId: activeStudent.id,
      studentName: activeStudent.name,
      studentMatricNumber: activeStudent.matricNumber,
      classId: activeStudent.classId,
      className: activeStudent.className,
      sessionLabel: activeSession?.label ?? 'General Session',
      sessionDate: activeSession?.date ?? new Date().toISOString().slice(0, 10),
      sessionStart: activeSession?.start ?? timestamp,
      method: scan.method,
      timestamp,
      signal: scan.signal,
    })
    updateStudentLastSeen(activeStudent.id, timestamp)
    setLastScan({
      status: 'success',
      student: activeStudent,
      timestamp,
      message: `${scan.method} matched successfully`,
    })
  }

  const handleCapturePhoto = () => {
    const seed = registration.name || registration.matric || 'Student'
    setCapturedPhoto(`https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`)
    setRegistrationMessage('Facial capture complete. Photo saved.')
  }

  const handleEnrollFingerprint = async () => {
    await scanFingerprint()
    setEnrolledFingerprint(true)
    setRegistrationMessage('Fingerprint template enrolled successfully.')
  }

  const handleRegisterStudent = (event: React.FormEvent) => {
    event.preventDefault()
    if (!registration.name || !registration.matric || !registration.program || !registration.className) {
      setRegistrationMessage('Please complete all student fields.')
      return
    }
    if (role === 'super' && !registration.lecturerId) {
      setRegistrationMessage('Assign a lecturer before registering the student.')
      return
    }
    if (!capturedPhoto || !enrolledFingerprint) {
      setRegistrationMessage('Capture facial photo and enroll fingerprint to proceed.')
      return
    }
    const assignedLecturers =
      role === 'lecturer' && activeLecturer
        ? [activeLecturer.id]
        : registration.lecturerId
          ? [registration.lecturerId]
          : []
    addStudent({
      id: `st-${Date.now()}`,
      name: registration.name,
      matricNumber: registration.matric,
      program: registration.program,
      classId: role === 'lecturer' && activeLecturer ? activeLecturer.classId : `cl-${Math.floor(100 + Math.random() * 900)}`,
      className: role === 'lecturer' && activeLecturer ? activeLecturer.className : registration.className,
      photoUrl: capturedPhoto,
      lecturerIds: assignedLecturers,
      status: 'Active',
      lastSeen: 'Just now',
    })
    setRegistration({ name: '', matric: '', program: '', className: '', lecturerId: '' })
    setCapturedPhoto(null)
    setEnrolledFingerprint(false)
    setRegistrationMessage('Student registered successfully.')
  }

  const handleAddLecturer = (event: React.FormEvent) => {
    event.preventDefault()
    if (!lecturerDraft.name || !lecturerDraft.email || !lecturerDraft.password || !lecturerDraft.className) {
      return
    }
    addLecturer({
      id: `lec-${Date.now()}`,
      name: lecturerDraft.name,
      email: lecturerDraft.email,
      password: lecturerDraft.password,
      classId: `cl-${Math.floor(100 + Math.random() * 900)}`,
      className: lecturerDraft.className,
      status: 'Active',
    })
    setLecturerDraft({ name: '', email: '', password: '', className: '' })
  }

  const handleAssignLecturers = () => {
    if (!studentAssignment.studentId) return
    updateStudentLecturers(studentAssignment.studentId, studentAssignment.lecturerIds)
  }

  const beginSession = () => {
    const now = new Date()
    const date = now.toISOString().slice(0, 10)
    const start = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    setActiveSession({ label: sessionForm.label, date, start })
    setSessionPromptOpen(false)
  }

  const closeSession = () => {
    if (!activeSession) {
      setSessionClosePrompt(false)
      return
    }
    const end = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    setSessionHistory((prev) => [...prev, { ...activeSession, end }])
    setActiveSession(undefined)
    setSessionClosePrompt(false)
  }

  const confirmDelete = () => {
    if (!confirmDialog) return
    if (confirmDialog.type === 'student') {
      deleteStudent(confirmDialog.id)
    } else {
      deleteLecturer(confirmDialog.id)
    }
    setConfirmDialog(undefined)
  }

  const lecturerLogs = useMemo(
    () => logs.filter((log) => log.classId === activeLecturer?.classId),
    [logs, activeLecturer?.classId],
  )

  const calendarLogs = role === 'lecturer' ? lecturerLogs : logs
  const calendarDates = Array.from(new Set(calendarLogs.map((log) => log.sessionDate)))
  const calendarSessions = selectedCalendarDate
    ? calendarLogs.filter((log) => log.sessionDate === selectedCalendarDate)
    : []

  const exportCalendarSessions = () => {
    if (!selectedCalendarDate) return
    const data = calendarSessions
      .map(
        (log) =>
          `${log.studentName},${log.studentMatricNumber ?? ''},${log.className},${log.sessionLabel},${log.method},${log.sessionStart}`,
      )
      .join('\n')
    const csv = `Student,Matric,Class,Session,Method,Start Time\n${data}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `session-${selectedCalendarDate}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const deleteCalendarSession = () => {
    if (!selectedCalendarDate) return
    deleteLogsByDate(selectedCalendarDate)
    setSelectedCalendarDate(null)
    setCalendarModalOpen(false)
  }

  const exportAttendance = () => {
    const data = lecturerLogs
      .map(
        (log) =>
          `${log.timestamp},${log.studentName},${log.className},${log.method},${log.signal.replace(',', ' ')}`,
      )
      .join('\n')
    const csv = `Timestamp,Student,Class,Method,Signal\n${data}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'attendance-export.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div
        className={
          isDark
            ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950'
            : 'bg-gradient-to-br from-white via-slate-100 to-indigo-100'
        }
      >
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300">
              <Fingerprint className="h-6 w-6" />
            </div>
            <div>
              <h1 className={`text-2xl font-semibold ${headingText}`}>
                Multimodal Attendance System (M.A.S.)
              </h1>
            </div>
          </div>
          <div className="hidden items-center gap-4 text-xs text-indigo-200 md:flex">
            <span className="rounded-full border border-indigo-400/40 px-3 py-1">Provider Pattern</span>
            <span className="rounded-full border border-indigo-400/40 px-3 py-1">Hardware Simulation</span>
            <span className="rounded-full border border-indigo-400/40 px-3 py-1">Central Store</span>
          </div>
          <button
            onClick={onToggleTheme}
            className="ml-4 flex items-center gap-2 rounded-full border border-indigo-400/40 px-3 py-1 text-xs font-semibold text-indigo-100 transition hover:bg-white/10"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
        </header>
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pb-6 text-sm text-indigo-100">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              {role === 'super' ? 'Super Admin' : 'Lecturer Admin'}
            </span>
            {role === 'lecturer' && activeLecturer ? (
              <span className={`text-xs ${bodyText}`}>
                {activeLecturer.name} • {activeLecturer.className}
              </span>
            ) : (
              <span className={`text-xs ${bodyText}`}>System Overview & Global Control</span>
            )}
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 rounded-full border border-indigo-400/40 px-3 py-1 text-xs font-semibold text-indigo-100 transition hover:bg-white/10"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
        <section className="mx-auto w-full max-w-6xl px-6 pb-12">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <div
                className={`rounded-2xl border p-6 ${
                  isDark ? 'border-indigo-400/30 bg-white/5' : 'border-indigo-200 bg-white'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className={`text-lg font-semibold ${headingText}`}>Multimodal Scanning Interface</h2>
                    <p className={`text-sm ${bodyText}`}>
                      Switch between Face ID and Fingerprint for live verification.
                    </p>
                  </div>
                  <div className="flex rounded-full border border-indigo-400/30 bg-indigo-500/10 p-1 text-xs font-semibold">
                    {(['Face', 'Fingerprint'] as ScanMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setScanMode(mode)}
                        className={`rounded-full px-3 py-1 transition ${
                          scanMode === mode ? 'bg-white text-slate-900' : 'text-indigo-100'
                        }`}
                      >
                        {mode === 'Face' ? 'Face ID' : 'Fingerprint'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
                  <BiometricConsole onFingerprint={() => handleScan('Fingerprint')} onFace={() => handleScan('Face')} />
                  <div
                    className={`rounded-2xl border p-4 ${
                      isDark ? 'border-indigo-400/30 bg-slate-950/40' : 'border-indigo-200 bg-white'
                    }`}
                  >
                    <p className={`text-xs font-semibold uppercase ${subtleText}`}>Scan Result</p>
                    <div className="mt-3 space-y-3">
                      {isScanning ? (
                        <div className="space-y-3 rounded-xl border border-indigo-400/20 bg-white/5 p-4">
                          <div className="h-4 w-24 animate-pulse rounded-full bg-indigo-300/40" />
                          <div className="h-3 w-40 animate-pulse rounded-full bg-indigo-300/30" />
                          <div className="flex items-center gap-3">
                            <div className="h-12 w-12 animate-pulse rounded-full bg-indigo-300/40" />
                            <div className="space-y-2">
                              <div className="h-3 w-32 animate-pulse rounded-full bg-indigo-300/40" />
                              <div className="h-3 w-20 animate-pulse rounded-full bg-indigo-300/30" />
                            </div>
                          </div>
                        </div>
                      ) : lastScan ? (
                        <div
                          className={`rounded-xl border p-4 ${
                            lastScan.status === 'success'
                              ? 'border-emerald-400/40 bg-emerald-500/10'
                              : 'border-rose-400/50 bg-rose-500/10'
                          }`}
                        >
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            {lastScan.status === 'success' ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-rose-300" />
                            )}
                            <span>
                              {lastScan.status === 'success' ? 'Access Granted' : 'Access Denied'}
                            </span>
                          </div>
                          <p className="mt-2 text-xs text-indigo-100">{lastScan.message}</p>
                          <p className="mt-3 text-xs text-indigo-200">{lastScan.timestamp}</p>
                          {lastScan.status === 'success' && lastScan.student ? (
                            <div className="mt-4 flex items-center gap-3 rounded-lg bg-white/5 p-3">
                              <img
                                src={lastScan.student.photoUrl}
                                alt={lastScan.student.name}
                                className="h-12 w-12 rounded-full border border-white/20 object-cover"
                              />
                              <div>
                                <p className="text-sm font-semibold text-white">{lastScan.student.name}</p>
                                <p className="text-xs text-indigo-100">{lastScan.student.matricNumber}</p>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <p className="text-xs text-indigo-200">Run a scan to display the latest result.</p>
                      )}
                      <div className={`rounded-lg border border-indigo-400/20 bg-white/5 p-3 text-xs ${bodyText}`}>
                        Mode selected: <span className={`font-semibold ${headingText}`}>{scanMode}</span>
                      </div>
                      <button
                        onClick={() => handleScan(scanMode)}
                        disabled={isScanning}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {scanMode === 'Face' ? <Camera className="h-4 w-4" /> : <Fingerprint className="h-4 w-4" />}
                        Start {scanMode === 'Face' ? 'Face ID' : 'Fingerprint'} Scan
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <StatCard label="Total Students" value={`${students.length}`} icon={<Users className="h-5 w-5" />} />
                <StatCard label="Active Admins" value={`${admins.length}`} icon={<ShieldCheck className="h-5 w-5" />} />
                <StatCard
                  label={role === 'super' ? 'Global Scans' : 'Class Scans'}
                  value={`${role === 'super' ? logs.length : lecturerLogs.length}`}
                  icon={<Activity className="h-5 w-5" />}
                />
              </div>
              {role === 'lecturer' && (
                <div
                  className={`rounded-2xl border p-5 ${
                    isDark ? 'border-indigo-400/30 bg-white/5' : 'border-indigo-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-semibold ${headingText}`}>Attendance Session</p>
                      <p className={`text-xs ${bodyText}`}>
                        {activeSession
                          ? `${activeSession.label} • ${activeSession.date} • Started ${activeSession.start}`
                          : 'No active session yet.'}
                      </p>
                    </div>
                    <button
                      onClick={() => setSessionPromptOpen(true)}
                      className="rounded-full border border-indigo-400/40 px-3 py-1 text-xs font-semibold text-indigo-100"
                    >
                      Start Session
                    </button>
                  </div>
                  {activeSession && (
                    <button
                      onClick={() => setSessionClosePrompt(true)}
                      className="mt-4 flex items-center gap-2 rounded-full border border-rose-400/40 px-4 py-2 text-xs font-semibold text-rose-200"
                    >
                      <Clock className="h-4 w-4" />
                      Close Attendance Session
                    </button>
                  )}
                  {sessionHistory.length > 0 && (
                    <div className="mt-4 space-y-2 text-xs">
                      {sessionHistory.slice(-3).map((session) => (
                        <div key={`${session.label}-${session.start}`} className="flex items-center justify-between">
                          <span className={bodyText}>{session.label} • {session.date}</span>
                          <span className={bodyText}>{session.start} - {session.end}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {(role === 'super' || role === 'lecturer') && null}
            </div>
            <div
              className={`rounded-2xl border p-6 ${
                isDark ? 'border-indigo-500/30 bg-white/5' : 'border-indigo-200 bg-white'
              }`}
            >
              {role === 'super' ? (
                <>
                  <h2 className={`text-lg font-semibold ${headingText}`}>System Overview</h2>
                  <p className={`mt-2 text-sm ${bodyText}`}>
                    Oversee lecturer onboarding, clearance levels, and global attendance audit trails.
                  </p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <button
                      onClick={() => setAddLecturerModalOpen(true)}
                      className="rounded-xl border border-indigo-400/30 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-indigo-100 transition hover:bg-white/10"
                    >
                      Add Lecturer
                      <p className="mt-2 text-xs text-indigo-200">Create a new lecturer access account.</p>
                    </button>
                    <button
                      onClick={() => setAssignLecturerModalOpen(true)}
                      className="rounded-xl border border-indigo-400/30 bg-white/5 px-4 py-3 text-left text-sm font-semibold text-indigo-100 transition hover:bg-white/10"
                    >
                      Assign Students to Lecturers
                      <p className="mt-2 text-xs text-indigo-200">Link students to lecturer rosters.</p>
                    </button>
                  </div>
                  <div className="mt-6 space-y-4 text-sm">
                    {lecturers.map((lecturer) => (
                      <div
                        key={lecturer.id}
                        className="flex items-center justify-between rounded-xl border border-indigo-400/30 bg-white/5 p-3"
                      >
                        <div>
                          <p className={`font-semibold ${headingText}`}>{lecturer.name}</p>
                          <p className={`text-xs ${bodyText}`}>{lecturer.className} • {lecturer.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateLecturerStatus(
                                lecturer.id,
                                lecturer.status === 'Active' ? 'Pending' : 'Active',
                              )
                            }
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              lecturer.status === 'Active'
                                ? 'bg-emerald-400/20 text-emerald-100'
                                : 'bg-amber-300/20 text-amber-100'
                            }`}
                          >
                            {lecturer.status}
                          </button>
                          <button
                            onClick={() =>
                              setConfirmDialog({
                                type: 'lecturer',
                                id: lecturer.id,
                                name: lecturer.name,
                              })
                            }
                            className="rounded-full border border-rose-400/40 px-3 py-1 text-xs font-semibold text-rose-200"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className={`mt-6 rounded-xl border border-indigo-300/20 bg-indigo-500/10 p-4 text-xs ${bodyText}`}>
                    <p className={`font-semibold ${headingText}`}>Global Log Readiness</p>
                    <p className="mt-2">All attendance signals are synced across departments and classes.</p>
                  </div>
                </>
              ) : (
                <>
                  <h2 className={`text-lg font-semibold ${headingText}`}>Lecturer Command Center</h2>
                  <p className={`mt-2 text-sm ${bodyText}`}>
                    Access attendance records for your course and export daily reports for compliance.
                  </p>
                  <div className="mt-6 space-y-4 text-sm">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 rounded-lg bg-indigo-500/20 p-2 text-indigo-200">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div>
                        <p className={`font-semibold ${headingText}`}>Class Assigned</p>
                        <p className={bodyText}>{activeLecturer?.className ?? 'No class assigned'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="mt-1 rounded-lg bg-indigo-500/20 p-2 text-indigo-200">
                        <Database className="h-4 w-4" />
                      </div>
                      <div>
                        <p className={`font-semibold ${headingText}`}>Records Captured</p>
                        <p className={bodyText}>{lecturerLogs.length} entries logged today.</p>
                      </div>
                    </div>
                    <button
                      onClick={exportAttendance}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-300/30 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                    >
                      <FileDown className="h-4 w-4" />
                      Export Attendance CSV
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
      <main className="mx-auto mt-10 w-full max-w-6xl space-y-6 px-6 pb-16">
        <div className="grid gap-6 md:grid-cols-2">
          <button
            onClick={() => setAttendanceModalOpen(true)}
            className={`rounded-2xl border p-6 text-left transition hover:border-indigo-300 ${
              isDark ? 'border-indigo-400/30 bg-white/5' : 'border-indigo-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold ${headingText}`}>Attendance Logs</h3>
                <p className={`text-sm ${bodyText}`}>Review and audit multimodal attendance sessions.</p>
              </div>
              <span className="rounded-full border border-indigo-400/30 px-3 py-1 text-xs font-semibold text-indigo-100">
                {role === 'super' ? logs.length : lecturerLogs.length} entries
              </span>
            </div>
            <p className={`mt-4 text-xs ${subtleText}`}>Tap to view detailed logs.</p>
          </button>
          <button
            onClick={() => setStudentModal('active')}
            className={`rounded-2xl border p-6 text-left transition hover:border-indigo-300 ${
              isDark ? 'border-indigo-400/30 bg-white/5' : 'border-indigo-200 bg-white'
            }`}
          >
            <h3 className={`text-lg font-semibold ${headingText}`}>Active Students</h3>
            <p className={`mt-2 text-sm ${bodyText}`}>
              {role === 'super'
                ? 'View the current roster and attendance health across all classes.'
                : 'View the students assigned to your class.'}
            </p>
            <p className={`mt-4 text-xs ${subtleText}`}>
              {role === 'super' ? `${students.length} students tracked` : 'Tap to view your roster'}
            </p>
          </button>
          <button
            onClick={() => setStudentModal('manage')}
            className={`rounded-2xl border p-6 text-left transition hover:border-indigo-300 ${
              isDark ? 'border-indigo-400/30 bg-white/5' : 'border-indigo-200 bg-white'
            }`}
          >
            <h3 className={`text-lg font-semibold ${headingText}`}>Manage Students</h3>
            <p className={`mt-2 text-sm ${bodyText}`}>
              {role === 'super'
                ? 'Remove students or review enrollment assignments.'
                : 'Remove students or handle enrollment requests.'}
            </p>
            <p className={`mt-4 text-xs ${subtleText}`}>Open the management list</p>
          </button>
          {(role === 'super' || role === 'lecturer') && (
            <button
              onClick={() => setRegistrationModalOpen(true)}
              className={`rounded-2xl border p-6 text-left transition hover:border-indigo-300 ${
                isDark ? 'border-indigo-400/30 bg-white/5' : 'border-indigo-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-lg font-semibold ${headingText}`}>Student Registration</h2>
                  <p className={`text-sm ${bodyText}`}>Capture details and enroll biometrics.</p>
                </div>
                <div className="rounded-full bg-indigo-500/20 p-2 text-indigo-200">
                  <UserPlus className="h-4 w-4" />
                </div>
              </div>
              <p className={`mt-4 text-xs ${subtleText}`}>Tap to open the registration workflow.</p>
            </button>
          )}
        </div>
        <div className="grid gap-6">
          <div
            className={`rounded-2xl border p-6 ${
              isDark ? 'border-indigo-400/30 bg-white/5' : 'border-indigo-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-lg font-semibold ${headingText}`}>Session Calendar</h3>
                <p className={`text-sm ${bodyText}`}>
                  Click a date to view sessions and exports.
                </p>
              </div>
              <span className="rounded-full border border-indigo-400/30 px-3 py-1 text-xs font-semibold text-indigo-100">
                {calendarDates.length} active days
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {calendarDates.map((date) => (
                <button
                  key={date}
                  onClick={() => {
                    setSelectedCalendarDate(date)
                    setCalendarModalOpen(true)
                  }}
                  className="rounded-xl border border-indigo-400/20 bg-slate-950/20 px-4 py-4 text-left text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/10"
                >
                  <p className="text-xs text-indigo-200">Session Date</p>
                  <p className="mt-2 text-base font-semibold text-white">{date}</p>
                  <p className="mt-2 text-xs text-indigo-200">
                    {calendarLogs.filter((log) => log.sessionDate === date).length} records
                  </p>
                </button>
              ))}
              {calendarDates.length === 0 && (
                <div className="rounded-xl border border-indigo-400/20 bg-slate-950/20 p-6 text-center">
                  <p className={`text-sm ${bodyText}`}>No sessions logged yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <footer className={`mx-auto w-full max-w-6xl px-6 pb-10 text-center text-xs ${bodyText}`}>
        Designed and Developed by Joshua Joel and Adeyemi Favour
      </footer>
      {lastScan ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-6">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
              lastScan.status === 'success'
                ? 'border-emerald-400/40 bg-slate-900'
                : 'border-rose-400/50 bg-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-semibold">
                {lastScan.status === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-rose-400" />
                )}
                <span>{lastScan.status === 'success' ? 'Access Granted' : 'Access Denied'}</span>
              </div>
              <button
                onClick={() => setLastScan(undefined)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-indigo-100 transition hover:bg-white/10"
              >
                Close
              </button>
            </div>
            <p className="mt-2 text-sm text-indigo-100">{lastScan.message}</p>
            <p className="mt-1 text-xs text-indigo-300">{lastScan.timestamp}</p>
            {lastScan.status === 'success' && lastScan.student ? (
              <div className="mt-5 flex items-center gap-4 rounded-xl border border-white/10 bg-white/5 p-4">
                <img
                  src={lastScan.student.photoUrl}
                  alt={lastScan.student.name}
                  className="h-16 w-16 rounded-full border border-white/20 object-cover"
                />
                <div>
                  <p className="text-base font-semibold text-white">{lastScan.student.name}</p>
                  <p className="text-sm text-indigo-100">{lastScan.student.matricNumber}</p>
                  <p className="text-xs text-indigo-300">{lastScan.student.className}</p>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-100">
                Biometric mismatch. Please retry or contact an administrator.
              </div>
            )}
          </div>
        </div>
      ) : null}
      {sessionPromptOpen && role === 'lecturer' ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-6">
          <div className="w-full max-w-md rounded-2xl border border-indigo-400/40 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-semibold text-white">
                <ClipboardCheck className="h-5 w-5 text-indigo-300" />
                Start Attendance Session
              </div>
              <button
                onClick={() => setSessionPromptOpen(false)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-indigo-100"
              >
                Close
              </button>
            </div>
            <p className="mt-2 text-sm text-indigo-100">Enter class session and begin attendance.</p>
            <div className="mt-4 space-y-3">
              <input
                value={sessionForm.label}
                onChange={(event) => setSessionForm({ label: event.target.value })}
                placeholder="e.g. 1st Class"
                className="w-full rounded-xl border border-indigo-400/30 bg-slate-950/60 px-4 py-3 text-sm text-white"
              />
              <button
                onClick={beginSession}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white"
              >
                Start Session
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {sessionClosePrompt && role === 'lecturer' ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-6">
          <div className="w-full max-w-md rounded-2xl border border-rose-400/40 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-semibold text-white">
                <Clock className="h-5 w-5 text-rose-300" />
                Close Attendance
              </div>
              <button
                onClick={() => setSessionClosePrompt(false)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-indigo-100"
              >
                Cancel
              </button>
            </div>
            <p className="mt-2 text-sm text-indigo-100">
              End this session and finalize attendance logs for {activeSession?.label}.
            </p>
            <button
              onClick={closeSession}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white"
            >
              Close Session
            </button>
          </div>
        </div>
      ) : null}
      {confirmDialog ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-6">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
              isDark ? 'border-rose-400/40 bg-slate-900' : 'border-rose-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-lg font-semibold ${headingText}`}>Confirm Delete</p>
              <button
                onClick={() => setConfirmDialog(undefined)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-indigo-100"
              >
                Cancel
              </button>
            </div>
            <p className={`mt-2 text-sm ${bodyText}`}>
              Are you sure you want to delete {confirmDialog.name}? This action cannot be undone.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setConfirmDialog(undefined)}
                className="flex-1 rounded-xl border border-indigo-400/30 px-4 py-2 text-xs font-semibold text-indigo-100"
              >
                Keep
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {attendanceModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-6">
          <div
            className={`w-full max-w-4xl rounded-2xl border p-6 shadow-2xl ${
              isDark ? 'border-indigo-400/40 bg-slate-900' : 'border-indigo-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-lg font-semibold ${headingText}`}>Attendance Logs</p>
                <p className={`text-xs ${bodyText}`}>Session-based attendance records.</p>
              </div>
              <button
                onClick={() => setAttendanceModalOpen(false)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-indigo-100"
              >
                Close
              </button>
            </div>
            <div className="mt-4">
              <AttendanceTable logs={role === 'super' ? logs : lecturerLogs} variant="dashboard" />
            </div>
          </div>
        </div>
      ) : null}
      {registrationModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-6">
          <div
            className={`w-full max-w-3xl rounded-2xl border p-6 shadow-2xl ${
              isDark ? 'border-indigo-400/40 bg-slate-900' : 'border-indigo-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-lg font-semibold ${headingText}`}>Student Registration</p>
                <p className={`text-xs ${bodyText}`}>Capture details and enroll biometrics.</p>
              </div>
              <button
                onClick={() => setRegistrationModalOpen(false)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-indigo-100"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleRegisterStudent} className="mt-6 grid gap-4 md:grid-cols-2">
              <input
                value={registration.name}
                onChange={(event) => setRegistration({ ...registration, name: event.target.value })}
                placeholder="Full Name"
                className="w-full rounded-xl border border-indigo-400/30 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-indigo-300"
              />
              <input
                value={registration.matric}
                onChange={(event) => setRegistration({ ...registration, matric: event.target.value })}
                placeholder="Matric Number"
                className="w-full rounded-xl border border-indigo-400/30 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-indigo-300"
              />
              <input
                value={registration.program}
                onChange={(event) => setRegistration({ ...registration, program: event.target.value })}
                placeholder="Program"
                className="w-full rounded-xl border border-indigo-400/30 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-indigo-300"
              />
              {role === 'lecturer' ? (
                <input
                  value={activeLecturer?.className ?? ''}
                  disabled
                  className="w-full rounded-xl border border-indigo-400/30 bg-slate-900/40 px-4 py-3 text-sm text-white/70 outline-none"
                />
              ) : (
                <input
                  value={registration.className}
                  onChange={(event) => setRegistration({ ...registration, className: event.target.value })}
                  placeholder="Class"
                  className="w-full rounded-xl border border-indigo-400/30 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-indigo-300"
                />
              )}
              {role === 'super' && (
                <select
                  value={registration.lecturerId}
                  onChange={(event) => setRegistration({ ...registration, lecturerId: event.target.value })}
                  className="w-full rounded-xl border border-indigo-400/30 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-indigo-300"
                >
                  <option value="">Assign Lecturer</option>
                  {lecturers.map((lecturer) => (
                    <option key={lecturer.id} value={lecturer.id}>
                      {lecturer.name} • {lecturer.className}
                    </option>
                  ))}
                </select>
              )}
              <div className="rounded-xl border border-indigo-400/30 bg-white/5 p-4 md:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-indigo-300/30 bg-indigo-500/10 text-indigo-200">
                      {capturedPhoto ? (
                        <img src={capturedPhoto} alt="Student" className="h-14 w-14 rounded-full" />
                      ) : (
                        <Camera className="h-6 w-6" />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${headingText}`}>Facial Capture</p>
                      <p className={`text-xs ${bodyText}`}>
                        {capturedPhoto ? 'Photo stored for verification.' : 'Use device camera to capture.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    className="rounded-full border border-indigo-300/40 px-4 py-2 text-xs font-semibold text-indigo-100 transition hover:bg-white/10"
                  >
                    Capture Photo
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border border-indigo-300/30 bg-indigo-500/10 text-indigo-200">
                      <Fingerprint className="h-6 w-6" />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${headingText}`}>Fingerprint Enrollment</p>
                      <p className={`text-xs ${bodyText}`}>
                        {enrolledFingerprint ? 'Fingerprint enrolled.' : 'Scan fingerprint to enroll.'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleEnrollFingerprint}
                    className="rounded-full border border-indigo-300/40 px-4 py-2 text-xs font-semibold text-indigo-100 transition hover:bg-white/10"
                  >
                    Enroll Fingerprint
                  </button>
                </div>
              </div>
              <div className="md:col-span-2 flex flex-col gap-3">
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
                >
                  Register Student Profile
                </button>
                {registrationMessage && (
                  <p className={`text-xs ${bodyText}`}>{registrationMessage}</p>
                )}
              </div>
            </form>
          </div>
        </div>
      ) : null}
      {calendarModalOpen && selectedCalendarDate ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-6">
          <div
            className={`w-full max-w-2xl rounded-2xl border p-6 shadow-2xl ${
              isDark ? 'border-indigo-400/40 bg-slate-900' : 'border-indigo-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-lg font-semibold ${headingText}`}>Sessions on {selectedCalendarDate}</p>
                <p className={`text-xs ${bodyText}`}>
                  {calendarSessions.length} students present
                </p>
              </div>
              <button
                onClick={() => setCalendarModalOpen(false)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-indigo-100"
              >
                Close
              </button>
            </div>
            <div className="mt-4 space-y-3">
              {calendarSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-xl border border-indigo-400/20 bg-slate-950/30 px-4 py-3"
                >
                  <div>
                    <p className={`text-sm font-semibold ${headingText}`}>{session.studentName}</p>
                    <p className={`text-xs ${bodyText}`}>{session.studentMatricNumber ?? 'N/A'} • {session.sessionLabel}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs ${bodyText}`}>{session.className}</p>
                    <p className={`text-xs ${bodyText}`}>{session.sessionStart}</p>
                  </div>
                </div>
              ))}
              {calendarSessions.length === 0 && (
                <p className={`text-sm ${bodyText}`}>No sessions available for this date.</p>
              )}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={exportCalendarSessions}
                className="flex-1 rounded-xl border border-indigo-400/30 px-4 py-2 text-xs font-semibold text-indigo-100"
              >
                Export Session
              </button>
              <button
                onClick={deleteCalendarSession}
                className="flex-1 rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white"
              >
                Delete Session
              </button>
            </div>
          </div>
        </div>
      ) : null}
      {studentModal ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-6">
          <div
            className={`w-full max-w-3xl rounded-2xl border p-6 shadow-2xl ${
              isDark ? 'border-indigo-400/40 bg-slate-900' : 'border-indigo-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-lg font-semibold ${headingText}`}>
                  {studentModal === 'active' ? 'Active Students' : 'Manage Students'}
                </p>
                <p className={`text-xs ${bodyText}`}>
                  {studentModal === 'active'
                    ? 'Current roster overview.'
                    : 'Remove or update student access.'}
                </p>
              </div>
              <button
                onClick={() => setStudentModal(null)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-indigo-100"
              >
                Close
              </button>
            </div>
            <div className="mt-4">
              {studentModal === 'active' ? (
                <StudentList
                  students={
                    role === 'lecturer' && activeLecturer
                      ? students.filter((student) => student.lecturerIds.includes(activeLecturer.id))
                      : students
                  }
                  lecturersById={Object.fromEntries(lecturers.map((lecturer) => [lecturer.id, lecturer.name]))}
                  variant="dashboard"
                />
              ) : (
                <div className="space-y-2">
                  {(role === 'lecturer' && activeLecturer
                    ? students.filter((student) => student.lecturerIds.includes(activeLecturer.id))
                    : students
                  ).map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between rounded-xl border border-indigo-400/20 bg-slate-950/30 px-4 py-3"
                    >
                      <div>
                        <p className={`text-sm font-semibold ${headingText}`}>{student.name}</p>
                        <p className={`text-xs ${bodyText}`}>{student.matricNumber}</p>
                      </div>
                      <button
                        onClick={() =>
                          setConfirmDialog({
                            type: 'student',
                            id: student.id,
                            name: student.name,
                          })
                        }
                        className="rounded-full border border-rose-400/40 px-3 py-1 text-xs font-semibold text-rose-200"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
      {addLecturerModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-6">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl ${
              isDark ? 'border-indigo-400/40 bg-slate-900' : 'border-indigo-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-lg font-semibold ${headingText}`}>Add Lecturer</p>
              <button
                onClick={() => setAddLecturerModalOpen(false)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-indigo-100"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleAddLecturer} className="mt-4 space-y-3">
              <input
                value={lecturerDraft.name}
                onChange={(event) => setLecturerDraft({ ...lecturerDraft, name: event.target.value })}
                placeholder="Lecturer Name"
                className="w-full rounded-xl border border-indigo-400/30 bg-slate-950/60 px-4 py-3 text-sm text-white"
              />
              <input
                value={lecturerDraft.email}
                onChange={(event) => setLecturerDraft({ ...lecturerDraft, email: event.target.value })}
                placeholder="Email"
                className="w-full rounded-xl border border-indigo-400/30 bg-slate-950/60 px-4 py-3 text-sm text-white"
              />
              <input
                value={lecturerDraft.className}
                onChange={(event) => setLecturerDraft({ ...lecturerDraft, className: event.target.value })}
                placeholder="Class"
                className="w-full rounded-xl border border-indigo-400/30 bg-slate-950/60 px-4 py-3 text-sm text-white"
              />
              <input
                value={lecturerDraft.password}
                onChange={(event) => setLecturerDraft({ ...lecturerDraft, password: event.target.value })}
                placeholder="Password"
                type="password"
                className="w-full rounded-xl border border-indigo-400/30 bg-slate-950/60 px-4 py-3 text-sm text-white"
              />
              <button
                type="submit"
                className="flex w-full items-center justify-center rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white"
              >
                Save Lecturer
              </button>
            </form>
          </div>
        </div>
      ) : null}
      {assignLecturerModalOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-6">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl ${
              isDark ? 'border-indigo-400/40 bg-slate-900' : 'border-indigo-200 bg-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <p className={`text-lg font-semibold ${headingText}`}>Assign Students to Lecturers</p>
              <button
                onClick={() => setAssignLecturerModalOpen(false)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs text-indigo-100"
              >
                Close
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              <select
                value={studentAssignment.studentId}
                onChange={(event) =>
                  setStudentAssignment({ ...studentAssignment, studentId: event.target.value })
                }
                className="w-full rounded-xl border border-indigo-400/30 bg-slate-950/60 px-4 py-3 text-sm text-white"
              >
                <option value="">Select student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}  {student.matricNumber}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2">
                {lecturers.map((lecturer) => {
                  const isSelected = studentAssignment.lecturerIds.includes(lecturer.id)
                  return (
                    <button
                      key={lecturer.id}
                      type="button"
                      onClick={() =>
                        setStudentAssignment((prev) => ({
                          ...prev,
                          lecturerIds: isSelected
                            ? prev.lecturerIds.filter((id) => id !== lecturer.id)
                            : [...prev.lecturerIds, lecturer.id],
                        }))
                      }
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        isSelected
                          ? 'bg-indigo-500 text-white'
                          : 'border border-indigo-400/40 text-indigo-100'
                      }`}
                    >
                      {lecturer.name}
                    </button>
                  )
                })}
              </div>
              <button
                type="button"
                onClick={handleAssignLecturers}
                className="rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white"
              >
                Update Assignments
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

const Gateway = ({
  onAuthenticated,
}: {
  onAuthenticated: (role: Role, lecturerId?: string) => void
}) => {
  const { lecturers, addLecturer } = useMasStore()
  const [theme, setTheme] = useState<ThemeMode>('dark')
  const isDark = theme === 'dark'
  const [authError, setAuthError] = useState<string | null>(null)
  const [credentials, setCredentials] = useState({ username: '', password: '' })
  const [lecturerForm, setLecturerForm] = useState({ name: '', email: '', password: '', className: '' })
  const [lecturerLogin, setLecturerLogin] = useState({ email: '', password: '' })
  const [showLecturerSignup, setShowLecturerSignup] = useState(false)

  const handleSuperLogin = (event: React.FormEvent) => {
    event.preventDefault()
    if (credentials.username === 'admin' && credentials.password === 'admin') {
      onAuthenticated('super')
      setAuthError(null)
    } else {
      setAuthError('Invalid super admin credentials.')
    }
  }

  const handleLecturerSignup = (event: React.FormEvent) => {
    event.preventDefault()
    if (!lecturerForm.name || !lecturerForm.email || !lecturerForm.password || !lecturerForm.className) {
      setAuthError('Complete all lecturer sign-up fields.')
      return
    }
    addLecturer({
      id: `lec-${Date.now()}`,
      name: lecturerForm.name,
      email: lecturerForm.email,
      password: lecturerForm.password,
      classId: `cl-${Math.floor(100 + Math.random() * 900)}`,
      className: lecturerForm.className,
      status: 'Pending',
    })
    setAuthError('Lecturer registered. Awaiting admin approval.')
    setLecturerForm({ name: '', email: '', password: '', className: '' })
    setShowLecturerSignup(false)
  }

  const handleLecturerLogin = (event: React.FormEvent) => {
    event.preventDefault()
    const lecturer = lecturers.find(
      (item) => item.email === lecturerLogin.email && item.password === lecturerLogin.password,
    )
    if (!lecturer) {
      setAuthError('Lecturer credentials not found.')
      return
    }
    if (lecturer.status !== 'Active') {
      setAuthError('Lecturer account is pending activation.')
      return
    }
    onAuthenticated('lecturer', lecturer.id)
    setAuthError(null)
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300">
              <Fingerprint className="h-6 w-6" />
            </div>
            <div>
              <h1 className={`text-3xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                M.A.S. Access Gateway
              </h1>
            </div>
          </div>
          <p className={`max-w-2xl text-sm ${isDark ? 'text-indigo-100' : 'text-slate-600'}`}>
            Authenticate as Super Admin or Lecturer to manage attendance operations, biometric audits, and course
            reporting.
          </p>
        </header>

        <div className="flex items-center justify-between rounded-2xl border border-indigo-400/20 bg-white/5 px-4 py-3 text-xs">
          <p className={isDark ? 'text-indigo-100' : 'text-slate-600'}>
            Theme toggle for enterprise light/dark accessibility.
          </p>
          <button
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="flex items-center gap-2 rounded-full border border-indigo-400/40 px-3 py-1 text-xs font-semibold text-indigo-100 transition hover:bg-white/10"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {isDark ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>

        {authError && (
          <div className={`rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-4 py-3 text-sm ${isDark ? 'text-indigo-100' : 'text-slate-600'}`}>
            {authError}
          </div>
        )}

        {!showLecturerSignup ? (
          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <form
              onSubmit={handleSuperLogin}
              className={`rounded-2xl border p-6 shadow-lg ${
                isDark ? 'border-indigo-400/20 bg-white/5' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Super Admin Login</h2>
                <KeyRound className="h-5 w-5 text-indigo-200" />
              </div>
              <p className={`mt-2 text-xs ${isDark ? 'text-indigo-100' : 'text-slate-500'}`}>
                Credentials: admin / admin
              </p>
              <div className="mt-4 space-y-3">
                <input
                  value={credentials.username}
                  onChange={(event) => setCredentials({ ...credentials, username: event.target.value })}
                  placeholder="Username"
                  className="w-full rounded-xl border border-indigo-400/30 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-indigo-300"
                />
                <input
                  value={credentials.password}
                  type="password"
                  onChange={(event) => setCredentials({ ...credentials, password: event.target.value })}
                  placeholder="Password"
                  className="w-full rounded-xl border border-indigo-400/30 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-indigo-300"
                />
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Enter System Overview
                </button>
              </div>
            </form>

            <div
              className={`rounded-2xl border p-6 shadow-lg ${
                isDark ? 'border-indigo-400/20 bg-white/5' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Lecturer Login</h2>
                <Users className="h-5 w-5 text-indigo-200" />
              </div>
              <form onSubmit={handleLecturerLogin} className="mt-4 space-y-3">
                <input
                  value={lecturerLogin.email}
                  onChange={(event) => setLecturerLogin({ ...lecturerLogin, email: event.target.value })}
                  placeholder="Email"
                  className="w-full rounded-xl border border-indigo-400/30 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-indigo-300"
                />
                <input
                  value={lecturerLogin.password}
                  type="password"
                  onChange={(event) => setLecturerLogin({ ...lecturerLogin, password: event.target.value })}
                  placeholder="Password"
                  className="w-full rounded-xl border border-indigo-400/30 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-indigo-300"
                />
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500/80 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
                >
                  <ShieldCheck className="h-4 w-4" />
                  Sign In
                </button>
              </form>
              <button
                onClick={() => setShowLecturerSignup(true)}
                className="mt-4 w-full rounded-xl border border-indigo-400/40 bg-white/5 px-4 py-3 text-sm font-semibold text-indigo-100 transition hover:bg-white/10"
              >
                Create a lecturer access account
              </button>
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl">
            <div
              className={`rounded-2xl border p-8 shadow-lg ${
                isDark ? 'border-indigo-400/20 bg-white/5' : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Lecturer Registration
                  </h2>
                  <p className={`text-sm ${isDark ? 'text-indigo-100' : 'text-slate-500'}`}>
                    Create your lecturer access account to request activation.
                  </p>
                </div>
                <button
                  onClick={() => setShowLecturerSignup(false)}
                  className="rounded-full border border-indigo-400/40 px-3 py-1 text-xs font-semibold text-indigo-100"
                >
                  Back to login
                </button>
              </div>
              <form onSubmit={handleLecturerSignup} className="mt-6 grid gap-4 md:grid-cols-2">
                <input
                  value={lecturerForm.name}
                  onChange={(event) => setLecturerForm({ ...lecturerForm, name: event.target.value })}
                  placeholder="Full Name"
                  className="w-full rounded-xl border border-indigo-400/30 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-indigo-300"
                />
                <input
                  value={lecturerForm.email}
                  onChange={(event) => setLecturerForm({ ...lecturerForm, email: event.target.value })}
                  placeholder="Email"
                  className="w-full rounded-xl border border-indigo-400/30 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-indigo-300"
                />
                <input
                  value={lecturerForm.className}
                  onChange={(event) => setLecturerForm({ ...lecturerForm, className: event.target.value })}
                  placeholder="Assigned Class"
                  className="w-full rounded-xl border border-indigo-400/30 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-indigo-300"
                />
                <input
                  value={lecturerForm.password}
                  type="password"
                  onChange={(event) => setLecturerForm({ ...lecturerForm, password: event.target.value })}
                  placeholder="Password"
                  className="w-full rounded-xl border border-indigo-400/30 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none focus:border-indigo-300"
                />
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
                  >
                    <UserPlus className="h-4 w-4" />
                    Register Lecturer
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        <footer className={`mt-10 text-center text-xs ${isDark ? 'text-indigo-100' : 'text-slate-500'}`}>
          Designed and Developed by Joshua Joel and Adeyemi Favour
        </footer>
      </div>
    </div>
  )
}

function App() {
  const [role, setRole] = useState<Role>(() => {
    const stored = window.localStorage.getItem('mas-role')
    if (stored === 'super' || stored === 'lecturer') {
      return stored
    }
    return 'none'
  })
  const [activeLecturerId, setActiveLecturerId] = useState<string | null>(() =>
    window.localStorage.getItem('mas-lecturer-id'),
  )
  const [theme, setTheme] = useState<ThemeMode>('dark')

  useEffect(() => {
    if (role === 'none') {
      window.localStorage.removeItem('mas-role')
      window.localStorage.removeItem('mas-lecturer-id')
    } else {
      window.localStorage.setItem('mas-role', role)
      if (role === 'lecturer' && activeLecturerId) {
        window.localStorage.setItem('mas-lecturer-id', activeLecturerId)
      }
    }
  }, [role, activeLecturerId])

  return (
    <BiometricProvider>
      <MasStoreProvider>
        {role === 'none' ? (
          <Gateway
            onAuthenticated={(nextRole, lecturerId) => {
              setRole(nextRole)
              setActiveLecturerId(lecturerId ?? null)
            }}
          />
        ) : (
          <Dashboard
            role={role}
            onLogout={() => {
              setRole('none')
              setActiveLecturerId(null)
            }}
            theme={theme}
            onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            activeLecturerId={role === 'lecturer' ? activeLecturerId : null}
          />
        )}
      </MasStoreProvider>
    </BiometricProvider>
  )
}

export default App
