import type { Student } from '../contexts/MasStoreContext'

const StudentList = ({
  students,
  lecturersById = {},
  variant = 'default',
}: {
  students: Student[]
  lecturersById?: Record<string, string>
  variant?: 'default' | 'dashboard'
}) => {
  const isDashboard = variant === 'dashboard'
  return (
    <div
      className={`rounded-2xl border p-6 shadow-sm ${
        isDashboard ? 'border-indigo-400/30 bg-white/5 text-white' : 'border-slate-200/70 bg-white/80'
      }`}
    >
      <div>
        <h3 className={`text-lg font-semibold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>
          Active Students
        </h3>
        <p className={`text-sm ${isDashboard ? 'text-indigo-100' : 'text-slate-500'}`}>
          Realtime class roster monitoring
        </p>
      </div>
      <div className="mt-4 grid gap-3">
        {students.map((student) => (
          <div
            key={student.id}
            className={`flex flex-col gap-3 rounded-xl border px-4 py-3 md:flex-row md:items-center md:justify-between ${
              isDashboard ? 'border-indigo-400/20 bg-slate-950/30' : 'border-slate-100 bg-white'
            }`}
          >
            <div>
              <p className={`font-semibold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>{student.name}</p>
              <p className={`text-xs ${isDashboard ? 'text-indigo-200' : 'text-slate-500'}`}>
                {student.program} • {student.className}
              </p>
              <p className={`text-xs ${isDashboard ? 'text-indigo-300' : 'text-slate-400'}`}>
                {student.matricNumber}
              </p>
              {student.lecturerIds.length > 0 && (
                <p className={`text-xs ${isDashboard ? 'text-indigo-200' : 'text-slate-400'}`}>
                  Lecturers: {student.lecturerIds.map((id) => lecturersById[id] ?? id).join(', ')}
                </p>
              )}
            </div>
            <div className={`text-right ${isDashboard ? 'text-indigo-200' : ''}`}>
              <span
                className={`rounded-full px-2 py-1 text-xs font-semibold ${
                  student.status === 'Active'
                    ? isDashboard
                      ? 'bg-emerald-400/20 text-emerald-100'
                      : 'bg-emerald-50 text-emerald-700'
                    : isDashboard
                      ? 'bg-slate-500/20 text-slate-200'
                      : 'bg-slate-100 text-slate-500'
                }`}
              >
                {student.status}
              </span>
              <p className={`mt-1 text-xs ${isDashboard ? 'text-indigo-200' : 'text-slate-500'}`}>
                Last seen {student.lastSeen}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StudentList
