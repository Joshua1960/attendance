import { createContext, useCallback, useContext, useMemo, useState } from 'react'

export type Student = {
  id: string
  name: string
  matricNumber: string
  program: string
  classId: string
  className: string
  photoUrl: string
  lecturerIds: string[]
  status: 'Active' | 'Pending' | 'Inactive'
  lastSeen: string
  email?: string
  phone?: string
  enrolledDate?: string
}

export type Lecturer = {
  id: string
  name: string
  email: string
  password: string
  classId: string
  className: string
  status: 'Active' | 'Pending' | 'Inactive'
}

export type AttendanceLog = {
  id: string
  studentId: string
  studentName: string
  studentMatricNumber?: string
  classId: string
  className: string
  sessionLabel: string
  sessionDate: string
  sessionStart: string
  method: 'Face' | 'Fingerprint'
  timestamp: string
  signal: string
}

type MasStoreContextValue = {
  students: Student[]
  lecturers: Lecturer[]
  logs: AttendanceLog[]
  addStudent: (student: Student) => void
  deleteStudent: (id: string) => void
  updateStudentLastSeen: (id: string, lastSeen: string) => void
  updateStudentLecturers: (id: string, lecturerIds: string[]) => void
  addLecturer: (lecturer: Lecturer) => void
  deleteLecturer: (id: string) => void
  updateLecturerStatus: (id: string, status: Lecturer['status']) => void
  addLog: (log: AttendanceLog) => void
  deleteLogsByDate: (date: string) => void
  importStudents: (students: Omit<Student, 'id'>[]) => void
  getStudentAttendance: (studentId: string) => AttendanceLog[]
  getAttendanceRate: (studentId: string) => number
}

const MasStoreContext = createContext<MasStoreContextValue | undefined>(undefined)

// Demo data for the application
const demoStudents: Student[] = [
  {
    id: 'st-001',
    name: 'Adeyemi Favour',
    matricNumber: 'CSC/2021/001',
    program: 'Computer Science',
    classId: 'cl-101',
    className: 'Database System (CSC 301)',
    photoUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Adeyemi',
    lecturerIds: ['lec-001'],
    status: 'Active',
    lastSeen: '2 hours ago',
    email: 'adeyemi.f@university.edu',
    phone: '+234 801 234 5678',
    enrolledDate: '2021-09-15',
  },
  {
    id: 'st-002',
    name: 'Joshua Joel',
    matricNumber: 'CSC/2021/002',
    program: 'Computer Science',
    classId: 'cl-101',
    className: 'Database System (CSC 301)',
    photoUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Joshua',
    lecturerIds: ['lec-001'],
    status: 'Active',
    lastSeen: '1 day ago',
    email: 'joshua.j@university.edu',
    phone: '+234 802 345 6789',
    enrolledDate: '2021-09-15',
  },
  {
    id: 'st-003',
    name: 'Chioma Nwosu',
    matricNumber: 'CSC/2021/003',
    program: 'Computer Science',
    classId: 'cl-101',
    className: 'Database System (CSC 301)',
    photoUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Chioma',
    lecturerIds: ['lec-001'],
    status: 'Active',
    lastSeen: '3 hours ago',
    email: 'chioma.n@university.edu',
    phone: '+234 803 456 7890',
    enrolledDate: '2021-09-16',
  },
  {
    id: 'st-004',
    name: 'Emeka Okafor',
    matricNumber: 'CSC/2021/004',
    program: 'Computer Science',
    classId: 'cl-102',
    className: 'Software Engineering (CSC 302)',
    photoUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Emeka',
    lecturerIds: ['lec-002'],
    status: 'Active',
    lastSeen: '5 hours ago',
    email: 'emeka.o@university.edu',
    phone: '+234 804 567 8901',
    enrolledDate: '2021-09-17',
  },
  {
    id: 'st-005',
    name: 'Fatima Ibrahim',
    matricNumber: 'CSC/2021/005',
    program: 'Computer Science',
    classId: 'cl-101',
    className: 'Database System (CSC 301)',
    photoUrl: 'https://api.dicebear.com/9.x/initials/svg?seed=Fatima',
    lecturerIds: ['lec-001'],
    status: 'Pending',
    lastSeen: 'Never',
    email: 'fatima.i@university.edu',
    phone: '+234 805 678 9012',
    enrolledDate: '2021-09-18',
  },
]

const demoLecturers: Lecturer[] = [
  {
    id: 'lec-001',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@university.edu',
    password: 'lecturer123',
    classId: 'cl-101',
    className: 'Database System (CSC 301)',
    status: 'Active',
  },
  {
    id: 'lec-002',
    name: 'Prof. Michael Chen',
    email: 'michael.chen@university.edu',
    password: 'lecturer456',
    classId: 'cl-102',
    className: 'Software Engineering (CSC 302)',
    status: 'Active',
  },
  {
    id: 'lec-003',
    name: 'Dr. Amara Obi',
    email: 'amara.obi@university.edu',
    password: 'lecturer789',
    classId: 'cl-103',
    className: 'Data Structures (CSC 201)',
    status: 'Pending',
  },
]

const demoLogs: AttendanceLog[] = [
  {
    id: 'log-001',
    studentId: 'st-001',
    studentName: 'Adeyemi Favour',
    studentMatricNumber: 'CSC/2021/001',
    classId: 'cl-101',
    className: 'Database System (CSC 301)',
    sessionLabel: '1st Class',
    sessionDate: new Date().toISOString().slice(0, 10),
    sessionStart: '09:00 AM',
    method: 'Face',
    timestamp: '09:15 AM',
    signal: 'face-1234 • 96% match',
  },
  {
    id: 'log-002',
    studentId: 'st-002',
    studentName: 'Joshua Joel',
    studentMatricNumber: 'CSC/2021/002',
    classId: 'cl-101',
    className: 'Database System (CSC 301)',
    sessionLabel: '1st Class',
    sessionDate: new Date().toISOString().slice(0, 10),
    sessionStart: '09:00 AM',
    method: 'Fingerprint',
    timestamp: '09:22 AM',
    signal: 'fp-5678 • 94% match',
  },
  {
    id: 'log-003',
    studentId: 'st-003',
    studentName: 'Chioma Nwosu',
    studentMatricNumber: 'CSC/2021/003',
    classId: 'cl-101',
    className: 'Database System (CSC 301)',
    sessionLabel: '1st Class',
    sessionDate: new Date().toISOString().slice(0, 10),
    sessionStart: '09:00 AM',
    method: 'Face',
    timestamp: '09:30 AM',
    signal: 'face-9012 • 98% match',
  },
]

export const MasStoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [students, setStudents] = useState<Student[]>(demoStudents)
  const [lecturers, setLecturers] = useState<Lecturer[]>(demoLecturers)
  const [logs, setLogs] = useState<AttendanceLog[]>(demoLogs)

  const addStudent = useCallback((student: Student) => {
    setStudents((prev) => [...prev, student])
  }, [])

  const deleteStudent = useCallback((id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id))
  }, [])

  const updateStudentLastSeen = useCallback((id: string, lastSeen: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, lastSeen } : s))
    )
  }, [])

  const updateStudentLecturers = useCallback((id: string, lecturerIds: string[]) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, lecturerIds } : s))
    )
  }, [])

  const addLecturer = useCallback((lecturer: Lecturer) => {
    setLecturers((prev) => [...prev, lecturer])
  }, [])

  const deleteLecturer = useCallback((id: string) => {
    setLecturers((prev) => prev.filter((l) => l.id !== id))
  }, [])

  const updateLecturerStatus = useCallback((id: string, status: Lecturer['status']) => {
    setLecturers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l))
    )
  }, [])

  const addLog = useCallback((log: AttendanceLog) => {
    setLogs((prev) => [...prev, log])
  }, [])

  const deleteLogsByDate = useCallback((date: string) => {
    setLogs((prev) => prev.filter((l) => l.sessionDate !== date))
  }, [])

  const importStudents = useCallback((newStudents: Omit<Student, 'id'>[]) => {
    const studentsWithIds = newStudents.map((s) => ({
      ...s,
      id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    }))
    setStudents((prev) => [...prev, ...studentsWithIds])
  }, [])

  const getStudentAttendance = useCallback(
    (studentId: string) => logs.filter((l) => l.studentId === studentId),
    [logs]
  )

  const getAttendanceRate = useCallback(
    (studentId: string) => {
      const studentLogs = logs.filter((l) => l.studentId === studentId)
      // Assuming 10 sessions per month for demo
      return Math.min(100, Math.round((studentLogs.length / 10) * 100))
    },
    [logs]
  )

  const value = useMemo(
    () => ({
      students,
      lecturers,
      logs,
      addStudent,
      deleteStudent,
      updateStudentLastSeen,
      updateStudentLecturers,
      addLecturer,
      deleteLecturer,
      updateLecturerStatus,
      addLog,
      deleteLogsByDate,
      importStudents,
      getStudentAttendance,
      getAttendanceRate,
    }),
    [
      students,
      lecturers,
      logs,
      addStudent,
      deleteStudent,
      updateStudentLastSeen,
      updateStudentLecturers,
      addLecturer,
      deleteLecturer,
      updateLecturerStatus,
      addLog,
      deleteLogsByDate,
      importStudents,
      getStudentAttendance,
      getAttendanceRate,
    ]
  )

  return <MasStoreContext.Provider value={value}>{children}</MasStoreContext.Provider>
}

export const useMasStore = () => {
  const context = useContext(MasStoreContext)
  if (!context) {
    throw new Error('useMasStore must be used within MasStoreProvider')
  }
  return context
}
