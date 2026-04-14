import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { AttendanceLog } from '../contexts/MasStoreContext'

interface AnalyticsChartProps {
  logs: AttendanceLog[]
  variant?: 'default' | 'dashboard'
}

const AnalyticsChart = ({ logs, variant = 'dashboard' }: AnalyticsChartProps) => {
  const isDashboard = variant === 'dashboard'

  const dailyData = useMemo(() => {
    const last7Days: { date: string; count: number; label: string }[] = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().slice(0, 10)
      const dayLabel = date.toLocaleDateString('en-US', { weekday: 'short' })
      const count = logs.filter(log => log.sessionDate === dateStr).length
      last7Days.push({ date: dateStr, count, label: dayLabel })
    }
    return last7Days
  }, [logs])

  const maxCount = Math.max(...dailyData.map(d => d.count), 1)

  const methodStats = useMemo(() => {
    const stats = { Face: 0, Fingerprint: 0 }
    logs.forEach(log => {
      if (log.method in stats) { stats[log.method as keyof typeof stats]++ }
    })
    return stats
  }, [logs])

  const totalScans = Object.values(methodStats).reduce((a, b) => a + b, 0)

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-6 ${isDashboard ? 'border-slate-700 bg-slate-900/50' : 'border-slate-200 bg-white'}`}>
      <h3 className={`text-lg font-semibold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>Attendance Analytics</h3>
      <p className={`text-sm ${isDashboard ? 'text-slate-300' : 'text-slate-500'}`}>Weekly attendance trends and method distribution</p>
      <div className="mt-6">
        <p className={`text-xs font-medium uppercase tracking-wide ${isDashboard ? 'text-slate-400' : 'text-slate-500'}`}>Last 7 Days</p>
        <div className="mt-3 flex items-end justify-between gap-2 h-32">
          {dailyData.map((day, index) => (
            <div key={day.date} className="flex flex-1 flex-col items-center gap-2">
              <motion.div initial={{ height: 0 }} animate={{ height: `${(day.count / maxCount) * 100}%` }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className={`w-full rounded-t-lg min-h-[4px] ${isDashboard ? 'bg-gradient-to-t from-indigo-500 to-sky-400' : 'bg-indigo-500'}`}
                style={{ minHeight: day.count > 0 ? '8px' : '4px' }} />
              <span className={`text-xs ${isDashboard ? 'text-slate-400' : 'text-slate-500'}`}>{day.label}</span>
              <span className={`text-xs font-semibold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>{day.count}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mt-8">
        <p className={`text-xs font-medium uppercase tracking-wide ${isDashboard ? 'text-slate-400' : 'text-slate-500'}`}>Scan Method Distribution</p>
        <div className="mt-3 space-y-3">
          {Object.entries(methodStats).map(([method, count]) => {
            const percentage = totalScans > 0 ? (count / totalScans) * 100 : 0
            const colors = { Face: 'bg-indigo-500', Fingerprint: 'bg-sky-500' }
            return (
              <div key={method}>
                <div className="flex items-center justify-between text-sm">
                  <span className={isDashboard ? 'text-slate-300' : 'text-slate-600'}>{method}</span>
                  <span className={`font-semibold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>{count} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className={`mt-1 h-2 rounded-full ${isDashboard ? 'bg-slate-800' : 'bg-slate-100'}`}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} transition={{ duration: 0.5 }}
                    className={`h-full rounded-full ${colors[method as keyof typeof colors]}`} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {[{ label: 'Total Scans', val: totalScans }, { label: 'Active Days', val: dailyData.filter(d => d.count > 0).length }, { label: 'Avg/Day', val: Math.round(totalScans / Math.max(dailyData.filter(d => d.count > 0).length, 1)) }].map(s => (
          <div key={s.label} className={`rounded-xl p-3 text-center ${isDashboard ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <p className={`text-2xl font-bold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>{s.val}</p>
            <p className={`text-xs ${isDashboard ? 'text-slate-400' : 'text-slate-500'}`}>{s.label}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default AnalyticsChart
