import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Filter, Download } from 'lucide-react'
import type { AttendanceLog } from '../contexts/MasStoreContext'

interface AttendanceTableProps {
  logs: AttendanceLog[]
  variant?: 'default' | 'dashboard'
  onExport?: () => void
}

const AttendanceTable = ({ logs, variant = 'default', onExport }: AttendanceTableProps) => {
  const isDashboard = variant === 'dashboard'
  const [searchTerm, setSearchTerm] = useState('')
  const [methodFilter, setMethodFilter] = useState<string>('all')

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = log.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.studentMatricNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.className.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMethod = methodFilter === 'all' || log.method === methodFilter
    return matchesSearch && matchesMethod
  })

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-6 shadow-sm ${isDashboard ? 'border-slate-700 bg-slate-900/50 text-white' : 'border-slate-200/70 bg-white/80'}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className={`text-lg font-semibold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>Attendance Logs</h3>
          <p className={`text-sm ${isDashboard ? 'text-slate-300' : 'text-slate-500'}`}>{filteredLogs.length} records found</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isDashboard ? 'bg-emerald-900/30 text-emerald-300' : 'bg-emerald-50 text-emerald-700'}`}>Live feed</span>
          {onExport && (
            <button onClick={onExport} className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${isDashboard ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>
              <Download className="h-3 w-3" />Export
            </button>
          )}
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDashboard ? 'text-slate-400' : 'text-slate-400'}`} />
          <input type="text" placeholder="Search by name, matric, or class..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full rounded-xl border py-2 pl-10 pr-4 text-sm outline-none transition ${isDashboard ? 'border-slate-600 bg-slate-800 text-white placeholder-slate-500 focus:border-slate-400' : 'border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:border-indigo-400'}`} />
        </div>
        <div className="relative">
          <Filter className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isDashboard ? 'text-slate-400' : 'text-slate-400'}`} />
          <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}
            className={`rounded-xl border py-2 pl-10 pr-8 text-sm outline-none transition appearance-none ${isDashboard ? 'border-slate-600 bg-slate-800 text-white focus:border-slate-400' : 'border-slate-200 bg-white text-slate-900 focus:border-indigo-400'}`}>
            <option value="all">All Methods</option>
            <option value="Face">Face ID</option>
            <option value="Fingerprint">Fingerprint</option>
          </select>
        </div>
      </div>
      <div className={`mt-4 overflow-hidden rounded-xl border ${isDashboard ? 'border-slate-700' : 'border-slate-200/70'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className={`${isDashboard ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'} text-xs uppercase tracking-wide`}>
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Matric No.</th>
                <th className="px-4 py-3">Session</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Signal</th>
                <th className="px-4 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDashboard ? 'divide-slate-700' : 'divide-slate-200/70'}`}>
              {filteredLogs.length === 0 ? (
                <tr><td colSpan={6} className={`px-4 py-8 text-center ${isDashboard ? 'text-slate-400' : 'text-slate-500'}`}>No attendance records found</td></tr>
              ) : (
                filteredLogs.map((log, index) => (
                  <motion.tr key={log.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }}
                    className={isDashboard ? 'bg-slate-800/30' : 'bg-white/80'}>
                    <td className={`px-4 py-3 font-medium ${isDashboard ? 'text-white' : 'text-slate-900'}`}>{log.studentName}</td>
                    <td className={`px-4 py-3 ${isDashboard ? 'text-slate-400' : 'text-slate-600'}`}>{log.studentMatricNumber || 'N/A'}</td>
                    <td className={`px-4 py-3 ${isDashboard ? 'text-slate-400' : 'text-slate-500'}`}>
                      <div className="flex flex-col"><span className="font-medium">{log.sessionLabel}</span><span className="text-xs opacity-70">{log.sessionDate}</span></div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${log.method === 'Face' ? isDashboard ? 'bg-slate-700 text-slate-300' : 'bg-indigo-50 text-indigo-700' : isDashboard ? 'bg-sky-900/30 text-sky-300' : 'bg-sky-50 text-sky-700'}`}>{log.method}</span>
                    </td>
                    <td className={`px-4 py-3 ${isDashboard ? 'text-slate-400' : 'text-slate-600'}`}>{log.signal}</td>
                    <td className={`px-4 py-3 ${isDashboard ? 'text-slate-400' : 'text-slate-500'}`}>{log.timestamp}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}

export default AttendanceTable
