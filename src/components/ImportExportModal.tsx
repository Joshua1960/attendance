import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Download, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { Student } from '../contexts/MasStoreContext'

interface ImportExportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (students: Student[]) => void
  students: Student[]
  lecturers?: { id: string; name: string; className: string }[]
}

const ImportExportModal = ({ isOpen, onClose, onImport, students }: ImportExportModalProps) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import')
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    const csvHeaders = ['Name', 'Matric Number', 'Program', 'Class', 'Email', 'Phone', 'Status']
    const rows = students.map((s) => [s.name, s.matricNumber, s.program, s.className, s.email || '', s.phone || '', s.status])
    const csv = [csvHeaders.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `students-export-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const lines = text.split('\n').filter((line) => line.trim())
      const errors: string[] = []
      const newStudents: Student[] = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',')
        if (values.length < 4) { errors.push(`Row ${i + 1}: Missing required fields`); continue }
        const [name, matric, program, className, email, phone] = values.map((v) => v.trim())
        if (!name || !matric || !program || !className) { errors.push(`Row ${i + 1}: Missing name, matric, program, or class`); continue }
        newStudents.push({ id: `st-import-${Date.now()}-${i}`, name, matricNumber: matric, program, classId: `cl-${Math.floor(100 + Math.random() * 900)}`, className, photoUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}`, lecturerIds: [], status: 'Active', lastSeen: 'Never', email: email || undefined, phone: phone || undefined, enrolledDate: new Date().toISOString().slice(0, 10) })
      }
      if (newStudents.length > 0) onImport(newStudents)
      setImportResult({ success: newStudents.length, errors })
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  const downloadTemplate = () => {
    const template = 'Name,Matric Number,Program,Class,Email,Phone\nJohn Doe,MAS-2025-001,Computer Science,Database System (CSC 301),john.doe@university.edu,+234 801 234 5678'
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'student-import-template.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm" onClick={onClose}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Import / Export Students</h2>
            <button onClick={onClose} className="rounded-full p-2 text-slate-400 transition hover:bg-white/10"><X className="h-5 w-5" /></button>
          </div>
          <div className="mt-4 flex rounded-xl border border-slate-600 bg-slate-800 p-1">
            <button onClick={() => setActiveTab('import')} className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab === 'import' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}><Upload className="mr-2 inline h-4 w-4" />Import</button>
            <button onClick={() => setActiveTab('export')} className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${activeTab === 'export' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}><Download className="mr-2 inline h-4 w-4" />Export</button>
          </div>
          {activeTab === 'import' ? (
            <div className="mt-6">
              <div onClick={() => fileInputRef.current?.click()} className="cursor-pointer rounded-xl border-2 border-dashed border-slate-600 bg-slate-800/30 p-8 text-center transition hover:border-slate-500 hover:bg-slate-800/50">
                <Upload className="mx-auto h-12 w-12 text-slate-400" />
                <p className="mt-4 text-sm font-semibold text-white">Click to upload CSV file</p>
                <p className="mt-1 text-xs text-slate-400">or drag and drop</p>
              </div>
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
              <button onClick={downloadTemplate} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-600 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5"><FileText className="h-4 w-4" />Download CSV Template</button>
              {importResult && (
                <div className="mt-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                  <div className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-400" /><span className="text-sm font-semibold text-white">{importResult.success} students imported successfully</span></div>
                  {importResult.errors.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 text-rose-400"><AlertCircle className="h-4 w-4" /><span className="text-xs font-semibold">{importResult.errors.length} errors</span></div>
                      <ul className="mt-2 max-h-24 overflow-y-auto text-xs text-rose-300">{importResult.errors.map((error, i) => <li key={i}>{error}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-6">
              <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                <p className="text-sm text-slate-300">Export all {students.length} students to a CSV file.</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400"><FileText className="h-4 w-4" /><span>Includes: Name, Matric, Program, Class, Email, Phone, Status</span></div>
              </div>
              <button onClick={handleExport} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"><Download className="h-4 w-4" />Export to CSV</button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default ImportExportModal
