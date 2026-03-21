import type { AttendanceLog } from '../contexts/MasStoreContext'

const AttendanceTable = ({
  logs,
  variant = 'default',
}: {
  logs: AttendanceLog[]
  variant?: 'default' | 'dashboard'
}) => {
  const isDashboard = variant === 'dashboard'
  return (
    <div
      className={`rounded-2xl border p-6 shadow-sm ${
        isDashboard ? 'border-indigo-400/30 bg-white/5 text-white' : 'border-slate-200/70 bg-white/80'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-semibold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>
            Attendance Logs
          </h3>
          <p className={`text-sm ${isDashboard ? 'text-indigo-100' : 'text-slate-500'}`}>
            Latest multimodal authentications by session
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            isDashboard ? 'bg-emerald-400/20 text-emerald-100' : 'bg-emerald-50 text-emerald-700'
          }`}
        >
          Live feed
        </span>
      </div>
      <div className={`mt-4 overflow-hidden rounded-xl border ${isDashboard ? 'border-indigo-400/20' : 'border-slate-200/70'}`}>
        <table className="w-full text-left text-sm">
          <thead className={`${isDashboard ? 'bg-slate-950/60 text-indigo-200' : 'bg-slate-50 text-slate-500'} text-xs uppercase tracking-wide`}>
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Session</th>
              <th className="px-4 py-3">Method</th>
              <th className="px-4 py-3">Signal</th>
              <th className="px-4 py-3">Timestamp</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isDashboard ? 'divide-indigo-400/20' : 'divide-slate-200/70'}`}>
            {logs.map((log) => (
              <tr key={log.id} className={isDashboard ? 'bg-slate-950/30' : 'bg-white/80'}>
                <td className={`px-4 py-3 font-medium ${isDashboard ? 'text-white' : 'text-slate-900'}`}>
                  {log.studentName}
                </td>
                <td className={`px-4 py-3 ${isDashboard ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {log.sessionLabel} • {log.sessionDate} • {log.sessionStart}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      log.method === 'Face'
                        ? isDashboard
                          ? 'bg-indigo-500/20 text-indigo-100'
                          : 'bg-indigo-50 text-indigo-700'
                        : isDashboard
                          ? 'bg-sky-400/20 text-sky-100'
                          : 'bg-sky-50 text-sky-700'
                    }`}
                  >
                    {log.method}
                  </span>
                </td>
                <td className={`px-4 py-3 ${isDashboard ? 'text-indigo-200' : 'text-slate-600'}`}>
                  {log.signal}
                </td>
                <td className={`px-4 py-3 ${isDashboard ? 'text-indigo-200' : 'text-slate-500'}`}>
                  {log.timestamp}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AttendanceTable
