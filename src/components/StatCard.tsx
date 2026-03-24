import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface StatCardProps {
  label: string
  value: string
  icon: ReactNode
  trend?: { value: number; isPositive: boolean }
  variant?: 'default' | 'dashboard'
}

const StatCard = ({ label, value, icon, trend, variant = 'default' }: StatCardProps) => {
  const isDashboard = variant === 'dashboard'
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-5 shadow-sm backdrop-blur transition-all hover:shadow-lg ${
        isDashboard
          ? 'border-indigo-400/30 bg-white/5 hover:border-indigo-400/50'
          : 'border-slate-200/70 bg-white/80'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${isDashboard ? 'text-indigo-200' : 'text-slate-500'}`}>
            {label}
          </p>
          <p className={`mt-2 text-3xl font-bold ${isDashboard ? 'text-white' : 'text-slate-900'}`}>
            {value}
          </p>
          {trend && (
            <p className={`mt-1 text-xs font-medium ${trend.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from last week
            </p>
          )}
        </div>
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
          isDashboard ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-600'
        }`}>
          {icon}
        </div>
      </div>
    </motion.div>
  )
}

export default StatCard
