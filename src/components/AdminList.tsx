import { ShieldCheck } from 'lucide-react'
import type { Admin } from '../contexts/MasStoreContext'

const AdminList = ({ admins }: { admins: Admin[] }) => {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Admin Access</h3>
        <p className="text-sm text-slate-500">Role-based control hierarchy</p>
      </div>
      <div className="mt-4 space-y-3">
        {admins.map((admin) => (
          <div
            key={admin.id}
            className="flex items-center justify-between rounded-xl border border-slate-100 bg-white px-4 py-3"
          >
            <div>
              <p className="font-semibold text-slate-900">{admin.name}</p>
              <p className="text-xs text-slate-500">{admin.role}</p>
            </div>
            <div className="flex items-center gap-2 text-right text-xs font-semibold text-indigo-700">
              <ShieldCheck className="h-4 w-4" />
              {admin.clearance}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminList
