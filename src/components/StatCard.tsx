import type { ReactNode } from 'react'

const StatCard = ({ label, value, icon }: { label: string; value: string; icon: ReactNode }) => {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm backdrop-blur">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
          {icon}
        </div>
      </div>
    </div>
  )
}

export default StatCard
