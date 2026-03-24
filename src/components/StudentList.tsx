import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, User, Mail, TrendingUp } from 'lucide-react'
import type { Student } from '../contexts/MasStoreContext'

interface StudentListProps {
  students: Student[]
  lecturersById?: Record<string, string>
  variant?: 'default' | 'dashboard'
  onStudentClick?: (student: Student) => void
  showAttendanceRate?: (studentId: string) => number
}

const StudentList = ({
  students,
  lecturersById: _lecturersById = {},
  variant = 'default',
  onStudentClick,
  showAttendanceRate,
}: StudentListProps) => {
  const isDashboard = variant === 'dashboard'
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredStudents = students.filter((student) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.matricNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.program.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-6 shadow-sm ${
        isDashboard ? 'border-indigo-400/30 bg-white/5 text-white' : 'border-slate-200/70 bg-white/80'
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className={`text-lg font-semibold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>
            Student Roster
          </h3>
          <p className={`text-sm ${isDashboard ? 'text-indigo-100' : 'text-slate-500'}`}>
            {filteredStudents.length} students enrolled
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDashboard ? 'text-indigo-300' : 'text-slate-400'}`} />
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full rounded-xl border py-2 pl-10 pr-4 text-sm outline-none transition ${
              isDashboard
                ? 'border-indigo-400/30 bg-slate-950/60 text-white placeholder-indigo-300 focus:border-indigo-400'
                : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-indigo-400'
            }`}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`rounded-xl border px-4 py-2 text-sm outline-none transition ${
            isDashboard
              ? 'border-indigo-400/30 bg-slate-950/60 text-white focus:border-indigo-400'
              : 'border-slate-200 bg-white text-slate-900 focus:border-indigo-400'
          }`}
        >
          <option value="all">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div className="mt-4 grid gap-3">
        {filteredStudents.length === 0 ? (
          <div className={`rounded-xl border p-8 text-center ${isDashboard ? 'border-indigo-400/20 text-indigo-200' : 'border-slate-200 text-slate-500'}`}>
            No students found matching your criteria
          </div>
        ) : (
          filteredStudents.map((student, index) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onStudentClick?.(student)}
              className={`flex flex-col gap-4 rounded-xl border p-4 transition md:flex-row md:items-center md:justify-between ${
                isDashboard
                  ? 'border-indigo-400/20 bg-slate-950/30 hover:border-indigo-400/40 hover:bg-slate-950/50'
                  : 'border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md'
              } ${onStudentClick ? 'cursor-pointer' : ''}`}
            >
              <div className="flex items-center gap-4">
                <img
                  src={student.photoUrl}
                  alt={student.name}
                  className="h-12 w-12 rounded-full border-2 border-indigo-400/30"
                />
                <div>
                  <p className={`font-semibold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>
                    {student.name}
                  </p>
                  <p className={`text-xs ${isDashboard ? 'text-indigo-200' : 'text-slate-500'}`}>
                    {student.program} • {student.className}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs">
                    <span className={isDashboard ? 'text-indigo-300' : 'text-slate-400'}>
                      <User className="mr-1 inline h-3 w-3" />
                      {student.matricNumber}
                    </span>
                    {student.email && (
                      <span className={isDashboard ? 'text-indigo-300' : 'text-slate-400'}>
                        <Mail className="mr-1 inline h-3 w-3" />
                        {student.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {showAttendanceRate && (
                  <div className={`flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-medium ${
                    isDashboard ? 'bg-indigo-500/20 text-indigo-100' : 'bg-indigo-50 text-indigo-700'
                  }`}>
                    <TrendingUp className="h-3 w-3" />
                    {showAttendanceRate(student.id)}% attendance
                  </div>
                )}
                <div className="text-right">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      student.status === 'Active'
                        ? isDashboard ? 'bg-emerald-400/20 text-emerald-100' : 'bg-emerald-50 text-emerald-700'
                        : isDashboard ? 'bg-slate-500/20 text-slate-200' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {student.status}
                  </span>
                  <p className={`mt-1 text-xs ${isDashboard ? 'text-indigo-200' : 'text-slate-500'}`}>
                    Last seen {student.lastSeen}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}

export default StudentList
