import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  Fingerprint,
  ShieldCheck,
  Users,
  LogOut,
  UserPlus,
  FileDown,
  BookOpen,
  Sun,
  Moon,
  Clock,
  ClipboardCheck,
  BarChart3,
  Upload,
  X,
} from "lucide-react";
import { BiometricProvider, useBiometric } from "./contexts/BiometricContext";
import { MasStoreProvider, useMasStore } from "./contexts/MasStoreContext";
import {
  NotificationProvider,
  useNotification,
} from "./contexts/NotificationContext";
import BiometricConsole, { type ScanResult, type CameraConfig } from "./components/BiometricConsole";
import CameraConfigModal from "./components/CameraConfigModal";

import type { Student } from "./contexts/MasStoreContext";

type Role = "none" | "super" | "lecturer";
type ThemeMode = "dark" | "light";

const Dashboard = ({
  role,
  onLogout,
  theme,
  onToggleTheme,
  activeLecturerId,
  cameraConfig,
  onOpenCameraSettings,
}: {
  role: Role;
  onLogout: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  activeLecturerId: string | null;
  cameraConfig: CameraConfig;
  onOpenCameraSettings: () => void;
}) => {
  const { scanFingerprint, isScanning } = useBiometric();
  const {
    students,
    lecturers,
    logs,
    addStudent,
    deleteStudent,
    addLog,
    updateStudentLastSeen,
    updateLecturerStatus,
    updateStudentLecturers,
    addLecturer,
    deleteLecturer,
    deleteLogsByDate,
    getAttendanceRate,
  } = useMasStore();
  const { success, error: notifyError, info } = useNotification();

  const [internalLecturerId] = useState<string | null>(null);
  const isDark = theme === "dark";
  const headingText = isDark ? "text-white" : "text-slate-900";
  const bodyText = isDark ? "text-slate-300" : "text-slate-600";
  const subtleText = isDark ? "text-slate-400" : "text-slate-500";

  const [scanResult, setScanResult] = useState<ScanResult | undefined>(undefined);
  const [registration, setRegistration] = useState({
    name: "",
    matric: "",
    program: "",
    className: "",
    lecturerId: "",
    email: "",
    phone: "",
  });
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [enrolledFingerprint, setEnrolledFingerprint] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(null);
  const [lecturerDraft, setLecturerDraft] = useState({
    name: "",
    email: "",
    password: "",
    className: "",
  });
  const [studentAssignment, setStudentAssignment] = useState({
    studentId: "",
    lecturerIds: [] as string[],
  });
  const [sessionPromptOpen, setSessionPromptOpen] = useState(false);
  const [sessionClosePrompt, setSessionClosePrompt] = useState(false);
  const [sessionForm, setSessionForm] = useState({ label: "1st Class" });
  const [activeSession, setActiveSession] = useState<
    | {
        label: string;
        date: string;
        start: string;
        end?: string;
      }
    | undefined
  >(undefined);
  const [, setSessionHistory] = useState<
    { label: string; date: string; start: string; end: string }[]
  >([]);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<
    | {
        type: "student" | "lecturer";
        id: string;
        name: string;
      }
    | undefined
  >(undefined);
  const [studentModal, setStudentModal] = useState<"active" | "manage" | null>(null);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [addLecturerModalOpen, setAddLecturerModalOpen] = useState(false);
  const [assignLecturerModalOpen, setAssignLecturerModalOpen] = useState(false);
  const [analyticsModalOpen, setAnalyticsModalOpen] = useState(false);
  const [importExportModalOpen, setImportExportModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const resolvedLecturerId = activeLecturerId ?? internalLecturerId;
  const activeLecturer = lecturers.find(
    (lecturer) => lecturer.id === resolvedLecturerId,
  );

  const handleFacialVerificationComplete = (
    isSuccess: boolean,
    capturedImage: string | null
  ) => {

    const availableStudents =
      role === "lecturer" && activeLecturer
        ? students.filter((student) =>
            student.lecturerIds.includes(activeLecturer.id),
          )
        : students;

    if (availableStudents.length === 0) {
      setScanResult({
        status: "error",
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        message: "No students assigned to this lecturer yet.",
        capturedImage,
      });
      notifyError("Scan Failed", "No students assigned to this lecturer yet.");
      return;
    }

    const activeStudent =
      availableStudents[Math.floor(Math.random() * availableStudents.length)];
    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (!isSuccess) {
      setScanResult({
        status: "error",
        timestamp,
        message: "Facial verification failed. Face not recognized.",
        capturedImage,
      });
      notifyError("Verification Failed", "Facial verification failed.");
      return;
    }

    const signal = `face-${Math.floor(1000 + Math.random() * 9000)} • ${Math.round(92 + Math.random() * 6)}% match`;

    addLog({
      id: `log-${Date.now()}`,
      studentId: activeStudent.id,
      studentName: activeStudent.name,
      studentMatricNumber: activeStudent.matricNumber,
      classId: activeStudent.classId,
      className: activeStudent.className,
      sessionLabel: activeSession?.label ?? "General Session",
      sessionDate: activeSession?.date ?? new Date().toISOString().slice(0, 10),
      sessionStart: activeSession?.start ?? timestamp,
      method: "Face",
      timestamp,
      signal,
    });
    updateStudentLastSeen(activeStudent.id, timestamp);
    setScanResult({
      status: "success",
      student: activeStudent,
      timestamp,
      message: `Face ID verified successfully`,
      capturedImage,
    });
    success(
      "Attendance Taken",
      `${activeStudent.name} checked in via Face ID.`,
    );
  };

  const handleScan = async (_method: "Fingerprint") => {
    if (role === "lecturer" && !activeSession) {
      setSessionPromptOpen(true);
      return;
    }

    const scan = await scanFingerprint();

    const availableStudents =
      role === "lecturer" && activeLecturer
        ? students.filter((student) =>
            student.lecturerIds.includes(activeLecturer.id),
          )
        : students;

    if (availableStudents.length === 0) {
      setScanResult({
        status: "error",
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        message: "No students assigned to this lecturer yet.",
      });
      notifyError("Scan Failed", "No students assigned to this lecturer yet.");
      return;
    }

    const activeStudent =
      availableStudents[Math.floor(Math.random() * availableStudents.length)];
    const timestamp = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const isSuccess = Math.random() > 0.15;

    if (!isSuccess) {
      setScanResult({
        status: "error",
        timestamp,
        message: "Fingerprint not recognized. Please try again.",
      });
      notifyError("Verification Failed", "Fingerprint not recognized.");
      return;
    }

    addLog({
      id: `log-${Date.now()}`,
      studentId: activeStudent.id,
      studentName: activeStudent.name,
      studentMatricNumber: activeStudent.matricNumber,
      classId: activeStudent.classId,
      className: activeStudent.className,
      sessionLabel: activeSession?.label ?? "General Session",
      sessionDate: activeSession?.date ?? new Date().toISOString().slice(0, 10),
      sessionStart: activeSession?.start ?? timestamp,
      method: scan.method,
      timestamp,
      signal: scan.signal,
    });
    updateStudentLastSeen(activeStudent.id, timestamp);
    setScanResult({
      status: "success",
      student: activeStudent,
      timestamp,
      message: `Fingerprint verified successfully`,
    });
    success(
      "Attendance Taken",
      `${activeStudent.name} checked in via Fingerprint.`,
    );
  };

  const handleCapturePhoto = () => {
    const seed = registration.name || registration.matric || "Student";
    setCapturedPhoto(
      `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(seed)}`,
    );
    setRegistrationMessage("Facial capture complete. Photo saved.");
    info("Photo Captured", "Facial photo has been stored.");
  };

  const handleEnrollFingerprint = async () => {
    await scanFingerprint();
    setEnrolledFingerprint(true);
    setRegistrationMessage("Fingerprint template enrolled successfully.");
    info("Fingerprint Enrolled", "Biometric template saved.");
  };

  const handleRegisterStudent = (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !registration.name ||
      !registration.matric ||
      !registration.program ||
      !registration.className
    ) {
      setRegistrationMessage("Please complete all student fields.");
      notifyError(
        "Registration Failed",
        "Please complete all required fields.",
      );
      return;
    }
    if (role === "super" && !registration.lecturerId) {
      setRegistrationMessage(
        "Assign a lecturer before registering the student.",
      );
      notifyError("Registration Failed", "Please assign a lecturer.");
      return;
    }
    if (!capturedPhoto || !enrolledFingerprint) {
      setRegistrationMessage(
        "Capture facial photo and enroll fingerprint to proceed.",
      );
      notifyError(
        "Registration Failed",
        "Complete biometric enrollment first.",
      );
      return;
    }
    const assignedLecturers =
      role === "lecturer" && activeLecturer
        ? [activeLecturer.id]
        : registration.lecturerId
          ? [registration.lecturerId]
          : [];
    addStudent({
      id: `st-${Date.now()}`,
      name: registration.name,
      matricNumber: registration.matric,
      program: registration.program,
      classId:
        role === "lecturer" && activeLecturer
          ? activeLecturer.classId
          : `cl-${Math.floor(100 + Math.random() * 900)}`,
      className:
        role === "lecturer" && activeLecturer
          ? activeLecturer.className
          : registration.className,
      photoUrl: capturedPhoto,
      lecturerIds: assignedLecturers,
      status: "Active",
      lastSeen: "Just now",
      email: registration.email || undefined,
      phone: registration.phone || undefined,
      enrolledDate: new Date().toISOString().slice(0, 10),
    });
    setRegistration({
      name: "",
      matric: "",
      program: "",
      className: "",
      lecturerId: "",
      email: "",
      phone: "",
    });
    setCapturedPhoto(null);
    setEnrolledFingerprint(false);
    setRegistrationMessage("Student registered successfully.");
    success("Student Registered", `${registration.name} has been enrolled.`);
  };

  const handleAddLecturer = (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !lecturerDraft.name ||
      !lecturerDraft.email ||
      !lecturerDraft.password ||
      !lecturerDraft.className
    ) {
      notifyError("Failed", "Please complete all lecturer fields.");
      return;
    }
    addLecturer({
      id: `lec-${Date.now()}`,
      name: lecturerDraft.name,
      email: lecturerDraft.email,
      password: lecturerDraft.password,
      classId: `cl-${Math.floor(100 + Math.random() * 900)}`,
      className: lecturerDraft.className,
      status: "Active",
    });
    setLecturerDraft({ name: "", email: "", password: "", className: "" });
    setAddLecturerModalOpen(false);
    success("Lecturer Added", `${lecturerDraft.name} has been added.`);
  };

  const handleAssignLecturers = () => {
    if (!studentAssignment.studentId) {
      notifyError("Failed", "Please select a student.");
      return;
    }
    updateStudentLecturers(
      studentAssignment.studentId,
      studentAssignment.lecturerIds,
    );
    success("Assignment Updated", "Student lecturer assignments updated.");
  };

  const beginSession = () => {
    const now = new Date();
    const date = now.toISOString().slice(0, 10);
    const start = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setActiveSession({ label: sessionForm.label, date, start });
    setSessionPromptOpen(false);
    success(
      "Session Started",
      `${sessionForm.label} attendance session is now active.`,
    );
  };

  const closeSession = () => {
    if (!activeSession) {
      setSessionClosePrompt(false);
      return;
    }
    const end = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setSessionHistory((prev) => [...prev, { ...activeSession, end }]);
    info("Session Closed", `${activeSession.label} has been closed.`);
    setActiveSession(undefined);
    setSessionClosePrompt(false);
  };

  const confirmDelete = () => {
    if (!confirmDialog) return;
    if (confirmDialog.type === "student") {
      deleteStudent(confirmDialog.id);
      success("Student Deleted", `${confirmDialog.name} has been removed.`);
    } else {
      deleteLecturer(confirmDialog.id);
      success("Lecturer Deleted", `${confirmDialog.name} has been removed.`);
    }
    setConfirmDialog(undefined);
  };

  const lecturerLogs = useMemo(
    () => logs.filter((log) => log.classId === activeLecturer?.classId),
    [logs, activeLecturer?.classId],
  );

  const calendarLogs = role === "lecturer" ? lecturerLogs : logs;
  const calendarDates = Array.from(
    new Set(calendarLogs.map((log) => log.sessionDate)),
  )
    .sort()
    .reverse();
  const calendarSessions = selectedCalendarDate
    ? calendarLogs.filter((log) => log.sessionDate === selectedCalendarDate)
    : [];

  const exportCalendarSessions = () => {
    if (!selectedCalendarDate) return;
    const data = calendarSessions
      .map(
        (log) =>
          `${log.studentName},${log.studentMatricNumber ?? ""},${log.className},${log.sessionLabel},${log.method},${log.sessionStart}`,
      )
      .join("\n");
    const csv = `Student,Matric,Class,Session,Method,Start Time\n${data}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `session-${selectedCalendarDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    success("Exported", "Session data exported to CSV.");
  };

  const deleteCalendarSession = () => {
    if (!selectedCalendarDate) return;
    deleteLogsByDate(selectedCalendarDate);
    setSelectedCalendarDate(null);
    setCalendarModalOpen(false);
    success("Deleted", "Session logs have been removed.");
  };

  const exportAttendance = () => {
    const data = lecturerLogs
      .map(
        (log) =>
          `${log.timestamp},${log.studentName},${log.studentMatricNumber || ""},${log.className},${log.method},${log.signal.replace(",", " ")}`,
      )
      .join("\n");
    const csv = `Timestamp,Student,Matric,Class,Method,Signal\n${data}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "attendance-export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    success("Exported", "Attendance data exported to CSV.");
  };

  const handleStudentClick = (student: Student) => {
    setSelectedStudent(student);
  };

  // Stats for BiometricConsole
  const consoleStats = {
    totalStudents: students.length,
    activeLecturers: lecturers.filter((l) => l.status === "Active").length,
    totalScans: role === "super" ? logs.length : lecturerLogs.length,
    activeSessions: activeSession ? 1 : 0,
  };

  return (
    <div
      className={`min-h-screen ${isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"}`}
    >
      {/* Professional Navbar */}
      <nav
        className={`sticky top-0 z-40 border-b backdrop-blur-lg ${
          isDark
            ? "border-slate-800 bg-slate-950/80"
            : "border-slate-200 bg-white/80"
        }`}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3 sm:gap-4">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-indigo-600"
            >
              <Fingerprint className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </motion.div>
            <div className="flex flex-col">
              <h1
                className={`text-base sm:text-lg font-bold tracking-tight ${headingText}`}
              >
                <span className="hidden md:inline">
                  Multimodal Attendance System
                </span>
                <span className="md:hidden">M.A.S.</span>
              </h1>
              <p className={`text-[10px] sm:text-xs ${subtleText} hidden sm:block`}>
                Biometric Attendance Management
              </p>
            </div>
          </div>

          {/* Center - User Info */}
          <div className="hidden lg:flex items-center gap-3">
            <div
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 ${
                isDark ? "bg-slate-900" : "bg-slate-50"
              }`}
            >
              <ShieldCheck
                className={`h-4 w-4 ${
                  role === "super" ? "text-indigo-500" : "text-emerald-500"
                }`}
              />
              <span className={`text-xs font-semibold ${headingText}`}>
                {role === "super" ? "Super Admin" : "Lecturer"}
              </span>
            </div>
            {role === "lecturer" && activeLecturer && (
              <div className={`text-xs ${bodyText}`}>
                <span className="font-medium">{activeLecturer.name}</span>
                <span className="mx-1.5">•</span>
                <span>{activeLecturer.className}</span>
              </div>
            )}
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onToggleTheme}
              className={`flex h-9 w-9 items-center justify-center rounded-lg transition ${
                isDark
                  ? "bg-slate-900 text-slate-300 hover:bg-slate-800"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={onLogout}
              className={`flex items-center gap-2 rounded-lg px-3 sm:px-4 py-2 text-xs font-semibold transition ${
                isDark
                  ? "bg-slate-900 text-slate-300 hover:bg-slate-800"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </nav>

      <div
        className={
          isDark
            ? "bg-slate-950"
            : "bg-slate-50"
        }
      >

        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
          <div className="space-y-6">
            {/* Lecturer Layout */}
            {role === "lecturer" && (
              <>
                {/* Session Control - Full Width Above */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border p-5 ${
                    isDark
                      ? "border-slate-700 bg-slate-900/50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-sm font-semibold ${headingText}`}>
                        Attendance Session
                      </p>
                      <p className={`text-xs ${bodyText}`}>
                        {activeSession
                          ? `${activeSession.label} • ${activeSession.date} • Started ${activeSession.start}`
                          : "No active session. Start one to begin tracking."}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {!activeSession && (
                        <button
                          onClick={() => setSessionPromptOpen(true)}
                          className="rounded-full bg-indigo-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-400"
                        >
                          Start Session
                        </button>
                      )}
                      {activeSession && (
                        <button
                          onClick={() => setSessionClosePrompt(true)}
                          className={`flex items-center gap-2 rounded-full border border-rose-400/40 px-4 py-2 text-xs font-semibold transition hover:bg-rose-500/10 ${isDark ? "text-rose-300" : "text-rose-600"}`}
                        >
                          <Clock className="h-4 w-4" />
                          Close Session
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Take Attendance and Lecturer Command Center Side by Side */}
                <div className="grid gap-6 lg:grid-cols-[40%_60%]">
                  {/* Take Attendance - 40% width */}
                  <BiometricConsole
                    onFingerprint={() => handleScan("Fingerprint")}
                    onFaceVerificationComplete={handleFacialVerificationComplete}
                    scanResult={scanResult}
                    isScanning={isScanning}
                    stats={consoleStats}
                    cameraConfig={cameraConfig}
                    onOpenCameraSettings={onOpenCameraSettings}
                  />

                  {/* Lecturer Command Center - 60% width */}
                  <div
                    className={`rounded-2xl border p-4 sm:p-6 ${
                      isDark
                        ? "border-slate-700 bg-slate-900/50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <h2 className={`text-lg font-semibold ${headingText}`}>
                      Lecturer Command Center
                    </h2>
                    <p className={`mt-2 text-sm ${bodyText}`}>
                      Access attendance records and export reports for your class.
                    </p>
                    <div className="mt-6 space-y-4 text-sm">
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-1 rounded-lg p-2 ${isDark ? "bg-slate-800 text-slate-400" : "bg-indigo-50 text-indigo-600"}`}
                        >
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div>
                          <p className={`font-semibold ${headingText}`}>
                            Class Assigned
                          </p>
                          <p className={bodyText}>
                            {activeLecturer?.className ?? "No class assigned"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-1 rounded-lg p-2 ${isDark ? "bg-slate-800 text-slate-400" : "bg-indigo-50 text-indigo-600"}`}
                        >
                          <Database className="h-4 w-4" />
                        </div>
                        <div>
                          <p className={`font-semibold ${headingText}`}>
                            Records Captured
                          </p>
                          <p className={bodyText}>
                            {lecturerLogs.length} entries logged.
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={exportAttendance}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${isDark ? "border-slate-600 bg-slate-800 text-white hover:bg-slate-700" : "border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"}`}
                      >
                        <FileDown className="h-4 w-4" />
                        Export Attendance CSV
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Super Admin Layout */}
            {role === "super" && (
              <div className="grid gap-6 lg:grid-cols-[40%_60%]">
                {/* Take Attendance - 40% width */}
                <BiometricConsole
                  onFingerprint={() => handleScan("Fingerprint")}
                  onFaceVerificationComplete={handleFacialVerificationComplete}
                  scanResult={scanResult}
                  isScanning={isScanning}
                  stats={consoleStats}
                  cameraConfig={cameraConfig}
                  onOpenCameraSettings={onOpenCameraSettings}
                />

                {/* System Overview - 60% width */}
                <div
                  className={`rounded-2xl border p-4 sm:p-6 ${
                    isDark
                      ? "border-slate-700 bg-slate-900/50"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <h2 className={`text-lg font-semibold ${headingText}`}>
                    System Overview
                  </h2>
                  <p className={`mt-2 text-sm ${bodyText}`}>
                    Manage lecturers, view global analytics, and control system
                    access.
                  </p>
                  <div className="mt-4 grid gap-3 grid-cols-2">
                    <button
                      onClick={() => setAddLecturerModalOpen(true)}
                      className={`rounded-xl border px-3 sm:px-4 py-3 text-left text-sm font-semibold transition ${isDark ? "border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"}`}
                    >
                      <UserPlus className="mb-2 h-5 w-5" />
                      Add Lecturer
                    </button>
                    <button
                      onClick={() => setAssignLecturerModalOpen(true)}
                      className={`rounded-xl border px-3 sm:px-4 py-3 text-left text-sm font-semibold transition ${isDark ? "border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800" : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"}`}
                    >
                      <Users className="mb-2 h-5 w-5" />
                      Assign Students
                    </button>
                  </div>
                  <div className="mt-6 space-y-3 text-sm max-h-48 sm:max-h-64 overflow-y-auto">
                    {lecturers.map((lecturer) => (
                      <div
                        key={lecturer.id}
                        className={`flex items-center justify-between rounded-xl border p-3 ${isDark ? "border-slate-700 bg-slate-900/50" : "border-slate-200 bg-slate-50"}`}
                      >
                        <div>
                          <p className={`font-semibold ${headingText}`}>
                            {lecturer.name}
                          </p>
                          <p className={`text-xs ${bodyText}`}>
                            {lecturer.className}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              updateLecturerStatus(
                                lecturer.id,
                                lecturer.status === "Active"
                                  ? "Pending"
                                  : "Active",
                              )
                            }
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              lecturer.status === "Active"
                                ? "bg-emerald-900/30 text-emerald-400"
                                : "bg-amber-500/20 text-amber-300"
                            }`}
                          >
                            {lecturer.status}
                          </button>
                          <button
                            onClick={() =>
                              setConfirmDialog({
                                type: "lecturer",
                                id: lecturer.id,
                                name: lecturer.name,
                              })
                            }
                            className={`rounded-full border border-rose-400/40 px-3 py-1 text-xs font-semibold ${isDark ? "text-rose-300" : "text-rose-600"}`}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                    {lecturers.length === 0 && (
                      <p className={`text-center text-sm ${bodyText}`}>
                        No lecturers registered yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Main Content Area */}
      <main className="mx-auto mt-6 sm:mt-10 w-full max-w-7xl space-y-4 sm:space-y-6 px-4 sm:px-6 pb-16">
        {/* Quick Action Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setAttendanceModalOpen(true)}
            className={`rounded-xl sm:rounded-2xl border p-4 sm:p-5 text-left transition ${
              isDark
                ? "border-slate-700 bg-slate-900/50 hover:border-slate-500"
                : "border-slate-200 bg-white hover:border-indigo-300"
            }`}
          >
            <ClipboardCheck
              className={`h-5 w-5 sm:h-6 sm:w-6 ${isDark ? "text-slate-300" : "text-indigo-600"}`}
            />
            <h3
              className={`mt-2 sm:mt-3 text-xs sm:text-sm font-semibold ${headingText}`}
            >
              Attendance Logs
            </h3>
            <p className={`mt-1 text-xs ${bodyText}`}>
              {role === "super" ? logs.length : lecturerLogs.length} entries
            </p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setStudentModal("active")}
            className={`rounded-xl sm:rounded-2xl border p-4 sm:p-5 text-left transition ${
              isDark
                ? "border-slate-700 bg-slate-900/50 hover:border-slate-500"
                : "border-slate-200 bg-white hover:border-indigo-300"
            }`}
          >
            <Users
              className={`h-5 w-5 sm:h-6 sm:w-6 ${isDark ? "text-slate-300" : "text-indigo-600"}`}
            />
            <h3
              className={`mt-2 sm:mt-3 text-xs sm:text-sm font-semibold ${headingText}`}
            >
              Student Roster
            </h3>
            <p className={`mt-1 text-xs ${bodyText}`}>
              {students.length} students
            </p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setAnalyticsModalOpen(true)}
            className={`rounded-xl sm:rounded-2xl border p-4 sm:p-5 text-left transition ${
              isDark
                ? "border-slate-700 bg-slate-900/50 hover:border-slate-500"
                : "border-slate-200 bg-white hover:border-indigo-300"
            }`}
          >
            <BarChart3
              className={`h-5 w-5 sm:h-6 sm:w-6 ${isDark ? "text-slate-300" : "text-indigo-600"}`}
            />
            <h3
              className={`mt-2 sm:mt-3 text-xs sm:text-sm font-semibold ${headingText}`}
            >
              Analytics
            </h3>
            <p className={`mt-1 text-xs ${bodyText}`}>View trends & stats</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setRegistrationModalOpen(true)}
            className={`rounded-xl sm:rounded-2xl border p-4 sm:p-5 text-left transition ${
              isDark
                ? "border-slate-700 bg-slate-900/50 hover:border-slate-500"
                : "border-slate-200 bg-white hover:border-indigo-300"
            }`}
          >
            <UserPlus
              className={`h-5 w-5 sm:h-6 sm:w-6 ${isDark ? "text-slate-300" : "text-indigo-600"}`}
            />
            <h3
              className={`mt-2 sm:mt-3 text-xs sm:text-sm font-semibold ${headingText}`}
            >
              Register Student
            </h3>
            <p className={`mt-1 text-xs ${bodyText}`}>Enroll new student</p>
          </motion.button>
        </div>

        {/* Bulk Operations */}
        {role === "super" && (
          <div className="flex gap-3">
            <button
              onClick={() => setImportExportModalOpen(true)}
              className={`flex items-center gap-2 rounded-xl border px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition ${
                isDark
                  ? "border-slate-600 text-slate-300 hover:bg-slate-800"
                  : "border-indigo-200 text-indigo-700 hover:bg-indigo-50"
              }`}
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Import / Export Students</span>
              <span className="sm:hidden">Import/Export</span>
            </button>
          </div>
        )}

        {/* Session Calendar */}
        <div
          className={`rounded-xl sm:rounded-2xl border p-4 sm:p-6 ${
            isDark
              ? "border-slate-700 bg-slate-900/50"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
            <div>
              <h3
                className={`text-base sm:text-lg font-semibold ${headingText}`}
              >
                Session Calendar
              </h3>
              <p className={`text-xs sm:text-sm ${bodyText}`}>
                Click a date to view sessions and exports.
              </p>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold self-start sm:self-auto ${isDark ? "border-slate-600 text-slate-300" : "border-slate-300 text-slate-600"}`}
            >
              {calendarDates.length} active days
            </span>
          </div>
          <div className="mt-4 sm:mt-5 grid gap-3 grid-cols-2 lg:grid-cols-4">
            {calendarDates.slice(0, 8).map((date) => (
              <motion.button
                key={date}
                whileHover={{ scale: 1.02 }}
                onClick={() => {
                  setSelectedCalendarDate(date);
                  setCalendarModalOpen(true);
                }}
                className={`rounded-xl border px-3 sm:px-4 py-3 sm:py-4 text-left text-sm transition ${
                  isDark
                    ? "border-slate-700 bg-slate-900/30 hover:bg-slate-800/50"
                    : "border-slate-200 bg-slate-50 hover:bg-indigo-50"
                }`}
              >
                <p className={`text-xs ${subtleText}`}>Session Date</p>
                <p
                  className={`mt-1 sm:mt-2 text-sm sm:text-base font-semibold ${headingText}`}
                >
                  {date}
                </p>
                <p className={`mt-1 sm:mt-2 text-xs ${bodyText}`}>
                  {
                    calendarLogs.filter((log) => log.sessionDate === date)
                      .length
                  }{" "}
                  records
                </p>
              </motion.button>
            ))}
            {calendarDates.length === 0 && (
              <div
                className={`rounded-xl border p-4 sm:p-6 text-center col-span-full ${isDark ? "border-slate-700" : "border-slate-200"}`}
              >
                <p className={`text-sm ${bodyText}`}>No sessions logged yet.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <footer
        className={`mx-auto w-full max-w-7xl px-4 sm:px-6 pb-10 text-center text-xs ${bodyText}`}
      >
        Designed and Developed by Joshua Joel and Adeyemi Favour
      </footer>

      {/* Modals */}
      {/* Session Start Modal */}
      <AnimatePresence>
        {sessionPromptOpen && role === "lecturer" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg font-semibold text-white">
                  <ClipboardCheck className="h-5 w-5 text-indigo-400" />
                  Start Attendance Session
                </div>
                <button
                  onClick={() => setSessionPromptOpen(false)}
                  className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-300"
                >
                  Close
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                Enter class session and begin attendance.
              </p>
              <div className="mt-4 space-y-3">
                <input
                  value={sessionForm.label}
                  onChange={(event) =>
                    setSessionForm({ label: event.target.value })
                  }
                  placeholder="e.g. 1st Class"
                  className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white"
                />
                <button
                  onClick={beginSession}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white"
                >
                  Start Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Session Close Modal */}
      <AnimatePresence>
        {sessionClosePrompt && role === "lecturer" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md rounded-2xl border border-rose-400/40 bg-slate-900 p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg font-semibold text-white">
                  <Clock className="h-5 w-5 text-rose-300" />
                  Close Attendance
                </div>
                <button
                  onClick={() => setSessionClosePrompt(false)}
                  className="rounded-full border border-slate-600 px-3 py-1 text-xs text-slate-300"
                >
                  Cancel
                </button>
              </div>
              <p className="mt-2 text-sm text-slate-300">
                End this session and finalize attendance logs for{" "}
                {activeSession?.label}.
              </p>
              <button
                onClick={closeSession}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white"
              >
                Close Session
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {confirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md rounded-2xl border border-rose-400/40 bg-slate-900 p-6"
            >
              <p className="text-lg font-semibold text-white">Confirm Delete</p>
              <p className="mt-2 text-sm text-slate-300">
                Are you sure you want to delete {confirmDialog.name}? This
                action cannot be undone.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setConfirmDialog(undefined)}
                  className="flex-1 rounded-xl border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-300"
                >
                  Keep
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attendance Logs Modal */}
      <AnimatePresence>
        {attendanceModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-lg font-semibold text-white">
                    Attendance Logs
                  </p>
                  <p className="text-xs text-slate-300">
                    Session-based attendance records.
                  </p>
                </div>
                <button
                  onClick={() => setAttendanceModalOpen(false)}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-2">
                {(role === "super" ? logs : lecturerLogs).map((log) => (
                  <div key={log.id} className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">{log.studentName}</p>
                      <p className="text-xs text-slate-400">{log.studentMatricNumber} • {log.className}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-300">{log.timestamp}</p>
                      <p className="text-xs text-slate-400">{log.method}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student Registration Modal */}
      <AnimatePresence>
        {registrationModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">
                    Student Registration
                  </p>
                  <p className="text-xs text-slate-300">
                    Capture details and enroll biometrics.
                  </p>
                </div>
                <button
                  onClick={() => setRegistrationModalOpen(false)}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form
                onSubmit={handleRegisterStudent}
                className="mt-6 grid gap-4 md:grid-cols-2"
              >
                <input
                  value={registration.name}
                  onChange={(event) =>
                    setRegistration({
                      ...registration,
                      name: event.target.value,
                    })
                  }
                  placeholder="Full Name *"
                  className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-indigo-300"
                />
                <input
                  value={registration.matric}
                  onChange={(event) =>
                    setRegistration({
                      ...registration,
                      matric: event.target.value,
                    })
                  }
                  placeholder="Matric Number *"
                  className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-indigo-300"
                />
                <input
                  value={registration.program}
                  onChange={(event) =>
                    setRegistration({
                      ...registration,
                      program: event.target.value,
                    })
                  }
                  placeholder="Program *"
                  className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-indigo-300"
                />
                {role === "lecturer" ? (
                  <input
                    value={activeLecturer?.className ?? ""}
                    disabled
                    className="w-full rounded-xl border border-indigo-400/30 bg-slate-900/40 px-4 py-3 text-sm text-white/70 outline-none"
                  />
                ) : (
                  <input
                    value={registration.className}
                    onChange={(event) =>
                      setRegistration({
                        ...registration,
                        className: event.target.value,
                      })
                    }
                    placeholder="Class *"
                    className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-indigo-300"
                  />
                )}
                <input
                  value={registration.email}
                  onChange={(event) =>
                    setRegistration({
                      ...registration,
                      email: event.target.value,
                    })
                  }
                  placeholder="Email (optional)"
                  type="email"
                  className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-indigo-300"
                />
                <input
                  value={registration.phone}
                  onChange={(event) =>
                    setRegistration({
                      ...registration,
                      phone: event.target.value,
                    })
                  }
                  placeholder="Phone (optional)"
                  className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-indigo-300"
                />
                {role === "super" && (
                  <select
                    value={registration.lecturerId}
                    onChange={(event) =>
                      setRegistration({
                        ...registration,
                        lecturerId: event.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white outline-none focus:border-indigo-300 md:col-span-2"
                  >
                    <option value="">Assign Lecturer *</option>
                    {lecturers.map((lecturer) => (
                      <option key={lecturer.id} value={lecturer.id}>
                        {lecturer.name} • {lecturer.className}
                      </option>
                    ))}
                  </select>
                )}
                <div className="rounded-xl border border-slate-600 bg-slate-800/50 p-4 md:col-span-2">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-slate-600 bg-slate-800 text-slate-400">
                        {capturedPhoto ? (
                          <img
                            src={capturedPhoto}
                            alt="Student"
                            className="h-14 w-14 rounded-full"
                          />
                        ) : (
                          <UserPlus className="h-6 w-6" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Facial Capture
                        </p>
                        <p className="text-xs text-slate-300">
                          {capturedPhoto
                            ? "Photo stored for verification."
                            : "Use device camera to capture."}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCapturePhoto}
                      className="rounded-full border border-slate-500 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
                    >
                      Capture Photo
                    </button>
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-14 w-14 items-center justify-center rounded-full border border-slate-600 ${enrolledFingerprint ? "bg-emerald-900/30 text-emerald-400" : "bg-slate-800 text-slate-400"}`}
                      >
                        <Fingerprint className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Fingerprint Enrollment
                        </p>
                        <p className="text-xs text-slate-300">
                          {enrolledFingerprint
                            ? "Fingerprint enrolled."
                            : "Scan fingerprint to enroll."}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleEnrollFingerprint}
                      className="rounded-full border border-slate-500 px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700"
                    >
                      Enroll Fingerprint
                    </button>
                  </div>
                </div>
                <div className="md:col-span-2 flex flex-col gap-3">
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
                  >
                    Register Student Profile
                  </button>
                  {registrationMessage && (
                    <p className="text-xs text-slate-300 text-center">
                      {registrationMessage}
                    </p>
                  )}
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar Session Modal */}
      <AnimatePresence>
        {calendarModalOpen && selectedCalendarDate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-white">
                    Sessions on {selectedCalendarDate}
                  </p>
                  <p className="text-xs text-slate-300">
                    {calendarSessions.length} students present
                  </p>
                </div>
                <button
                  onClick={() => setCalendarModalOpen(false)}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
                {calendarSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {session.studentName}
                      </p>
                      <p className="text-xs text-slate-300">
                        {session.studentMatricNumber ?? "N/A"} •{" "}
                        {session.sessionLabel}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-300">
                        {session.className}
                      </p>
                      <p className="text-xs text-slate-400">
                        {session.sessionStart}
                      </p>
                    </div>
                  </div>
                ))}
                {calendarSessions.length === 0 && (
                  <p className="text-sm text-slate-300 text-center py-4">
                    No sessions available for this date.
                  </p>
                )}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={exportCalendarSessions}
                  className="flex-1 rounded-xl border border-slate-600 px-4 py-2 text-xs font-semibold text-slate-300"
                >
                  Export Session
                </button>
                <button
                  onClick={deleteCalendarSession}
                  className="flex-1 rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white"
                >
                  Delete Session
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student List Modal */}
      <AnimatePresence>
        {studentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-lg font-semibold text-white">
                    {studentModal === "active"
                      ? "Student Roster"
                      : "Manage Students"}
                  </p>
                  <p className="text-xs text-slate-300">
                    {studentModal === "active"
                      ? "Click a student to view their profile."
                      : "Remove or update student access."}
                  </p>
                </div>
                <button
                  onClick={() => setStudentModal(null)}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-2">
                {(role === "lecturer" && activeLecturer
                  ? students.filter((student) =>
                      student.lecturerIds.includes(activeLecturer.id),
                    )
                  : students
                ).map((student) => (
                  <div
                    key={student.id}
                    onClick={() => handleStudentClick(student)}
                    className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-800 transition"
                  >
                    <img
                      src={student.photoUrl}
                      alt={student.name}
                      className="h-10 w-10 rounded-full"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{student.name}</p>
                      <p className="text-xs text-slate-400">{student.matricNumber}</p>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs ${
                      student.status === 'Active' ? 'bg-emerald-900/30 text-emerald-400' : 'bg-amber-900/30 text-amber-400'
                    }`}>
                      {student.status}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Lecturer Modal */}
      <AnimatePresence>
        {addLecturerModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6"
            >
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-white">Add Lecturer</p>
                <button
                  onClick={() => setAddLecturerModalOpen(false)}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleAddLecturer} className="mt-4 space-y-3">
                <input
                  value={lecturerDraft.name}
                  onChange={(event) =>
                    setLecturerDraft({
                      ...lecturerDraft,
                      name: event.target.value,
                    })
                  }
                  placeholder="Lecturer Name"
                  className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white"
                />
                <input
                  value={lecturerDraft.email}
                  onChange={(event) =>
                    setLecturerDraft({
                      ...lecturerDraft,
                      email: event.target.value,
                    })
                  }
                  placeholder="Email"
                  className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white"
                />
                <input
                  value={lecturerDraft.className}
                  onChange={(event) =>
                    setLecturerDraft({
                      ...lecturerDraft,
                      className: event.target.value,
                    })
                  }
                  placeholder="Class"
                  className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white"
                />
                <input
                  value={lecturerDraft.password}
                  onChange={(event) =>
                    setLecturerDraft({
                      ...lecturerDraft,
                      password: event.target.value,
                    })
                  }
                  placeholder="Password"
                  type="password"
                  className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white"
                />
                <button
                  type="submit"
                  className="flex w-full items-center justify-center rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white"
                >
                  Save Lecturer
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assign Lecturer Modal */}
      <AnimatePresence>
        {assignLecturerModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6"
            >
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-white">
                  Assign Students to Lecturers
                </p>
                <button
                  onClick={() => setAssignLecturerModalOpen(false)}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4 grid gap-3">
                <select
                  value={studentAssignment.studentId}
                  onChange={(event) =>
                    setStudentAssignment({
                      ...studentAssignment,
                      studentId: event.target.value,
                    })
                  }
                  className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-sm text-white"
                >
                  <option value="">Select student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} - {student.matricNumber}
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-2">
                  {lecturers.map((lecturer) => {
                    const isSelected = studentAssignment.lecturerIds.includes(
                      lecturer.id,
                    );
                    return (
                      <button
                        key={lecturer.id}
                        type="button"
                        onClick={() =>
                          setStudentAssignment((prev) => ({
                            ...prev,
                            lecturerIds: isSelected
                              ? prev.lecturerIds.filter(
                                  (id) => id !== lecturer.id,
                                )
                              : [...prev.lecturerIds, lecturer.id],
                          }))
                        }
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                          isSelected
                            ? "bg-indigo-500 text-white"
                            : "border border-slate-600 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        {lecturer.name}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={handleAssignLecturers}
                  className="rounded-xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white"
                >
                  Update Assignments
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analytics Modal */}
      <AnimatePresence>
        {analyticsModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-lg font-semibold text-white">
                    Analytics Dashboard
                  </p>
                  <p className="text-xs text-slate-300">
                    Attendance trends and statistics
                  </p>
                </div>
                <button
                  onClick={() => setAnalyticsModalOpen(false)}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                    <p className="text-xs text-slate-400">Total Scans Today</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {(role === "super" ? logs : lecturerLogs).filter(l => l.sessionDate === new Date().toISOString().slice(0, 10)).length}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                    <p className="text-xs text-slate-400">Active Students</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {students.filter(s => s.status === 'Active').length}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                  <p className="text-sm font-semibold text-white mb-3">Scan Methods</p>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <p className="text-xs text-slate-400">Face ID</p>
                      <p className="text-lg font-bold text-indigo-400">
                        {(role === "super" ? logs : lecturerLogs).filter(l => l.method === 'Face').length}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-slate-400">Fingerprint</p>
                      <p className="text-lg font-bold text-sky-400">
                        {(role === "super" ? logs : lecturerLogs).filter(l => l.method === 'Fingerprint').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student Profile Modal */}
      {selectedStudent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-4"
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-lg font-semibold text-white">Student Profile</p>
              <button
                onClick={() => setSelectedStudent(null)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <img
                src={selectedStudent.photoUrl}
                alt={selectedStudent.name}
                className="h-16 w-16 rounded-full"
              />
              <div>
                <p className="text-lg font-semibold text-white">{selectedStudent.name}</p>
                <p className="text-sm text-slate-400">{selectedStudent.matricNumber}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Program:</span>
                <span className="text-white">{selectedStudent.program}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Class:</span>
                <span className="text-white">{selectedStudent.className}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span className={selectedStudent.status === 'Active' ? 'text-emerald-400' : 'text-amber-400'}>
                  {selectedStudent.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Last Seen:</span>
                <span className="text-white">{selectedStudent.lastSeen}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Attendance Rate:</span>
                <span className="text-indigo-400">{getAttendanceRate(selectedStudent.id)}%</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Import/Export Modal */}
      <AnimatePresence>
        {importExportModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 px-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-lg font-semibold text-white">Import/Export Students</p>
                <button
                  onClick={() => setImportExportModalOpen(false)}
                  className="rounded-full p-2 text-slate-400 transition hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
                  <p className="text-sm font-semibold text-white mb-2">Export Students</p>
                  <p className="text-xs text-slate-400 mb-3">Download all student data as CSV</p>
                  <button
                    onClick={() => {
                      const csv = students.map(s => 
                        `${s.name},${s.matricNumber},${s.program},${s.className}`
                      ).join('\n');
                      const blob = new Blob([`Name,Matric,Program,Class\n${csv}`], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.download = 'students.csv';
                      link.click();
                      success('Exported', 'Student data exported to CSV.');
                    }}
                    className="w-full rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Export CSV
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

type LoginView = "select" | "admin" | "lecturer" | "lecturer-signup" | "signup";

const Gateway = ({
  onAuthenticated,
}: {
  onAuthenticated: (role: Role, lecturerId?: string) => void;
}) => {
  const { lecturers, addLecturer } = useMasStore();
  const { success, error: notifyError, info } = useNotification();
  const [theme, setTheme] = useState<ThemeMode>("light");
  const isDark = theme === "dark";
  const [authError, setAuthError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [lecturerForm, setLecturerForm] = useState({
    name: "",
    email: "",
    password: "",
    className: "",
  });
  const [lecturerLogin, setLecturerLogin] = useState({
    email: "",
    password: "",
  });
  const [loginView, setLoginView] = useState<LoginView>("select");

  const handleSuperLogin = (event: React.FormEvent) => {
    event.preventDefault();
    if (credentials.username === "admin" && credentials.password === "admin") {
      onAuthenticated("super");
      setAuthError(null);
      success("Welcome", "Logged in as Super Admin.");
    } else {
      setAuthError("Invalid super admin credentials.");
      notifyError("Login Failed", "Invalid credentials.");
    }
  };

  const handleLecturerSignup = (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !lecturerForm.name ||
      !lecturerForm.email ||
      !lecturerForm.password ||
      !lecturerForm.className
    ) {
      setAuthError("Complete all lecturer sign-up fields.");
      notifyError("Registration Failed", "Please fill all fields.");
      return;
    }
    addLecturer({
      id: `lec-${Date.now()}`,
      name: lecturerForm.name,
      email: lecturerForm.email,
      password: lecturerForm.password,
      classId: `cl-${Math.floor(100 + Math.random() * 900)}`,
      className: lecturerForm.className,
      status: "Pending",
    });
    setAuthError("Lecturer registered. Awaiting admin approval.");
    info("Registration Submitted", "Your account is pending approval.");
    setLecturerForm({ name: "", email: "", password: "", className: "" });
    setLoginView("lecturer");
  };

  const handleLecturerLogin = (event: React.FormEvent) => {
    event.preventDefault();
    const lecturer = lecturers.find(
      (item) =>
        item.email === lecturerLogin.email &&
        item.password === lecturerLogin.password,
    );
    if (!lecturer) {
      setAuthError("Lecturer credentials not found.");
      notifyError("Login Failed", "Invalid credentials.");
      return;
    }
    if (lecturer.status !== "Active") {
      setAuthError("Lecturer account is pending activation.");
      notifyError("Access Denied", "Account pending approval.");
      return;
    }
    onAuthenticated("lecturer", lecturer.id);
    setAuthError(null);
    success("Welcome", `Logged in as ${lecturer.name}.`);
  };

  const goBack = () => {
    setLoginView("select");
    setAuthError(null);
    setCredentials({ username: "", password: "" });
    setLecturerLogin({ email: "", password: "" });
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center ${isDark ? "bg-slate-950" : "bg-slate-50"}`}
    >
      {/* Theme Toggle - Top Right */}
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className={`fixed top-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-lg transition ${
          isDark
            ? "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
            : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
        }`}
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 py-12">

        {authError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl border px-4 py-3 text-sm ${isDark ? "border-slate-700 bg-slate-800/50" : "border-indigo-200 bg-indigo-50"} ${isDark ? "text-slate-300" : "text-slate-600"}`}
          >
            {authError}
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* Role Selection Screen */}
          {loginView === "select" && (
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              {/* Left Side - Hero Content */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-8"
              >
                <div className="space-y-4">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium ${
                      isDark 
                        ? "bg-indigo-900/30 text-indigo-400" 
                        : "bg-indigo-100 text-indigo-700"
                    }`}
                  >
                    <Fingerprint className="h-4 w-4" />
                    <span>Biometric Authentication</span>
                  </motion.div>
                  
                  <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className={`text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight ${isDark ? "text-white" : "text-slate-900"}`}
                  >
                    Multimodal
                    <br />
                    <span className="text-indigo-600 dark:text-indigo-500">
                      Attendance
                    </span>
                    <br />
                    System
                  </motion.h1>
                  
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className={`text-lg ${isDark ? "text-slate-400" : "text-slate-600"} max-w-lg`}
                  >
                    Secure, efficient attendance tracking with facial recognition and fingerprint verification. Built for modern educational institutions.
                  </motion.p>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-3"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${isDark ? "bg-slate-900" : "bg-indigo-50"}`}>
                    <Fingerprint className="h-6 w-6 text-indigo-600" />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Facial and Fingerprint Biometrics</p>
                  </div>
                </motion.div>
              </motion.div>

              {/* Right Side - Role Selection Cards */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="space-y-4"
              >
                <div className="space-y-3">
                  <h2 className={`text-2xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                    Select Your Role
                  </h2>
                  <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                    Choose your access level to continue
                  </p>
                </div>

                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setLoginView("admin")}
                    className={`group w-full rounded-2xl border p-6 text-left transition-all ${
                      isDark
                        ? "border-slate-800 bg-slate-900/50 hover:border-indigo-500/50 hover:bg-slate-900"
                        : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-lg"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-xl transition-colors ${
                          isDark
                            ? "bg-slate-800 text-indigo-400 group-hover:bg-indigo-500/10"
                            : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100"
                        }`}>
                          <ShieldCheck className="h-7 w-7" />
                        </div>
                        <div>
                          <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                            Super Admin
                          </h3>
                          <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                            Full system access and control
                          </p>
                        </div>
                      </div>
                      <div className={`rounded-lg p-2 transition-transform group-hover:translate-x-1 ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                        →
                      </div>
                    </div>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setLoginView("lecturer")}
                    className={`group w-full rounded-2xl border p-6 text-left transition-all ${
                      isDark
                        ? "border-slate-800 bg-slate-900/50 hover:border-indigo-500/50 hover:bg-slate-900"
                        : "border-slate-200 bg-white hover:border-indigo-300 hover:shadow-lg"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`flex h-14 w-14 items-center justify-center rounded-xl transition-colors ${
                          isDark
                            ? "bg-slate-800 text-indigo-400 group-hover:bg-indigo-500/10"
                            : "bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100"
                        }`}>
                          <Users className="h-7 w-7" />
                        </div>
                        <div>
                          <h3 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>
                            Lecturer
                          </h3>
                          <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                            Manage class attendance and reports
                          </p>
                        </div>
                      </div>
                      <div className={`rounded-lg p-2 transition-transform group-hover:translate-x-1 ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                        →
                      </div>
                    </div>
                  </motion.button>

                  <div className={`mt-6 rounded-xl border p-4 ${
                    isDark
                      ? "border-slate-800 bg-slate-900/30"
                      : "border-indigo-100 bg-indigo-50/50"
                  }`}>
                    <p className={`text-xs font-medium ${isDark ? "text-slate-400" : "text-slate-600"}`}>
                      New lecturer? <button onClick={() => setLoginView("lecturer-signup")} className="text-indigo-600 hover:text-indigo-500 font-semibold">Create an account →</button>
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Admin Login Screen */}
          {loginView === "admin" && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-auto w-full max-w-md"
            >
              <form
                onSubmit={handleSuperLogin}
                className={`rounded-2xl border p-8 ${
                  isDark
                    ? "border-slate-700 bg-slate-900/50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={goBack}
                  className={`mb-6 flex items-center gap-2 text-sm font-medium transition ${
                    isDark
                      ? "text-slate-400 hover:text-slate-300"
                      : "text-indigo-600 hover:text-indigo-700"
                  }`}
                >
                  <span>←</span>
                  <span>Back to role selection</span>
                </button>

                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                      isDark
                        ? "bg-slate-800 text-slate-300"
                        : "bg-indigo-50 text-indigo-600"
                    }`}
                  >
                    <ShieldCheck className="h-7 w-7" />
                  </div>
                  <div>
                    <h2
                      className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      Super Admin Login
                    </h2>
                    <p
                      className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      System administration access
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div>
                    <label
                      className={`block text-xs font-medium mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Username
                    </label>
                    <input
                      value={credentials.username}
                      onChange={(event) =>
                        setCredentials({
                          ...credentials,
                          username: event.target.value,
                        })
                      }
                      placeholder="Enter username"
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-indigo-400 ${
                        isDark
                          ? "border-slate-600 bg-slate-800 text-white placeholder-slate-500"
                          : "border-slate-200 bg-white text-slate-900 placeholder-slate-400"
                      }`}
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-medium mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Password
                    </label>
                    <input
                      value={credentials.password}
                      type="password"
                      onChange={(event) =>
                        setCredentials({
                          ...credentials,
                          password: event.target.value,
                        })
                      }
                      placeholder="Enter password"
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-indigo-400 ${
                        isDark
                          ? "border-slate-600 bg-slate-800 text-white placeholder-slate-500"
                          : "border-slate-200 bg-white text-slate-900 placeholder-slate-400"
                      }`}
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Sign In as Admin
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Lecturer Login Screen */}
          {loginView === "lecturer" && (
            <motion.div
              key="lecturer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-auto w-full max-w-md"
            >
              <div
                className={`rounded-2xl border p-8 ${
                  isDark
                    ? "border-slate-700 bg-slate-900/50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={goBack}
                  className={`mb-6 flex items-center gap-2 text-sm font-medium transition ${
                    isDark
                      ? "text-slate-400 hover:text-slate-300"
                      : "text-sky-600 hover:text-sky-700"
                  }`}
                >
                  <span>←</span>
                  <span>Back to role selection</span>
                </button>

                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                      isDark
                        ? "bg-slate-800 text-slate-300"
                        : "bg-sky-50 text-sky-600"
                    }`}
                  >
                    <Users className="h-7 w-7" />
                  </div>
                  <div>
                    <h2
                      className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      Lecturer Login
                    </h2>
                    <p
                      className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Class attendance management
                    </p>
                  </div>
                </div>

                <form onSubmit={handleLecturerLogin} className="mt-6 space-y-4">
                  <div>
                    <label
                      className={`block text-xs font-medium mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Email Address
                    </label>
                    <input
                      value={lecturerLogin.email}
                      onChange={(event) =>
                        setLecturerLogin({
                          ...lecturerLogin,
                          email: event.target.value,
                        })
                      }
                      placeholder="Enter your email"
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-sky-400 ${
                        isDark
                          ? "border-slate-600 bg-slate-800 text-white placeholder-slate-500"
                          : "border-slate-200 bg-white text-slate-900 placeholder-slate-400"
                      }`}
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-medium mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Password
                    </label>
                    <input
                      value={lecturerLogin.password}
                      type="password"
                      onChange={(event) =>
                        setLecturerLogin({
                          ...lecturerLogin,
                          password: event.target.value,
                        })
                      }
                      placeholder="Enter password"
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-sky-400 ${
                        isDark
                          ? "border-slate-600 bg-slate-800 text-white placeholder-slate-500"
                          : "border-slate-200 bg-white text-slate-900 placeholder-slate-400"
                      }`}
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-sky-400"
                  >
                    <Users className="h-4 w-4" />
                    Sign In as Lecturer
                  </button>
                </form>

                <div
                  className={`mt-6 border-t pt-6 ${isDark ? "border-slate-700" : "border-slate-200"}`}
                >
                  <p
                    className={`text-center text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}
                  >
                    Don't have an account?
                  </p>
                  <button
                    onClick={() => setLoginView("lecturer-signup")}
                    className={`mt-3 w-full rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                      isDark
                        ? "border-slate-600 text-slate-300 hover:bg-slate-800"
                        : "border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Create Lecturer Account
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Lecturer Signup Screen */}
          {loginView === "lecturer-signup" && (
            <motion.div
              key="lecturer-signup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-auto w-full max-w-lg"
            >
              <div
                className={`rounded-2xl border p-8 ${
                  isDark
                    ? "border-slate-700 bg-slate-900/50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setLoginView("lecturer")}
                  className={`mb-6 flex items-center gap-2 text-sm font-medium transition ${
                    isDark
                      ? "text-slate-400 hover:text-slate-300"
                      : "text-sky-600 hover:text-sky-700"
                  }`}
                >
                  <span>←</span>
                  <span>Back to login</span>
                </button>

                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                      isDark
                        ? "bg-emerald-900/30 text-emerald-400"
                        : "bg-emerald-50 text-emerald-600"
                    }`}
                  >
                    <UserPlus className="h-7 w-7" />
                  </div>
                  <div>
                    <h2
                      className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      Lecturer Registration
                    </h2>
                    <p
                      className={`text-xs ${isDark ? "text-slate-400" : "text-slate-500"}`}
                    >
                      Create your access account
                    </p>
                  </div>
                </div>

                <div
                  className={`mt-6 rounded-xl border p-3 text-xs ${
                    isDark
                      ? "border-amber-800/30 bg-amber-900/20 text-amber-400"
                      : "border-amber-100 bg-amber-50 text-amber-700"
                  }`}
                >
                  <p>
                    ⚠️ New accounts require admin approval before activation.
                  </p>
                </div>

                <form
                  onSubmit={handleLecturerSignup}
                  className="mt-6 space-y-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        className={`block text-xs font-medium mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                      >
                        Full Name
                      </label>
                      <input
                        value={lecturerForm.name}
                        onChange={(event) =>
                          setLecturerForm({
                            ...lecturerForm,
                            name: event.target.value,
                          })
                        }
                        placeholder="Dr. John Smith"
                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-emerald-400 ${
                          isDark
                            ? "border-slate-600 bg-slate-800 text-white placeholder-slate-500"
                            : "border-slate-200 bg-white text-slate-900 placeholder-slate-400"
                        }`}
                      />
                    </div>
                    <div>
                      <label
                        className={`block text-xs font-medium mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                      >
                        Email Address
                      </label>
                      <input
                        value={lecturerForm.email}
                        onChange={(event) =>
                          setLecturerForm({
                            ...lecturerForm,
                            email: event.target.value,
                          })
                        }
                        placeholder="john@university.edu"
                        className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-emerald-400 ${
                          isDark
                            ? "border-slate-600 bg-slate-800 text-white placeholder-slate-500"
                            : "border-slate-200 bg-white text-slate-900 placeholder-slate-400"
                        }`}
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-medium mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Assigned Class
                    </label>
                    <input
                      value={lecturerForm.className}
                      onChange={(event) =>
                        setLecturerForm({
                          ...lecturerForm,
                          className: event.target.value,
                        })
                      }
                      placeholder="e.g. Database System (CSC 301)"
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-emerald-400 ${
                        isDark
                          ? "border-slate-600 bg-slate-800 text-white placeholder-slate-500"
                          : "border-slate-200 bg-white text-slate-900 placeholder-slate-400"
                        }`}
                    />
                  </div>
                  <div>
                    <label
                      className={`block text-xs font-medium mb-2 ${isDark ? "text-slate-400" : "text-slate-600"}`}
                    >
                      Password
                    </label>
                    <input
                      value={lecturerForm.password}
                      type="password"
                      onChange={(event) =>
                        setLecturerForm({
                          ...lecturerForm,
                          password: event.target.value,
                        })
                      }
                      placeholder="Create a secure password"
                      className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-emerald-400 ${
                        isDark
                          ? "border-slate-600 bg-slate-800 text-white placeholder-slate-500"
                          : "border-slate-200 bg-white text-slate-900 placeholder-slate-400"
                      }`}
                    />
                  </div>
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-400"
                  >
                    <UserPlus className="h-4 w-4" />
                    Register Account
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer
          className={`mt-10 text-center text-xs ${isDark ? "text-slate-500" : "text-slate-500"}`}
        >
          Designed and Developed by Joshua Joel and Adeyemi Favour
        </footer>
      </div>
    </div>
  );
};

function App() {
  const [role, setRole] = useState<Role>(() => {
    const stored = window.localStorage.getItem("mas-role");
    if (stored === "super" || stored === "lecturer") {
      return stored;
    }
    return "none";
  });
  const [activeLecturerId, setActiveLecturerId] = useState<string | null>(() =>
    window.localStorage.getItem("mas-lecturer-id"),
  );
  const [theme, setTheme] = useState<ThemeMode>("light");
  
  // Camera configuration state
  const [cameraConfig, setCameraConfig] = useState<CameraConfig>(() => {
    const stored = window.localStorage.getItem("mas-camera-config");
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return { type: 'webcam' as const };
      }
    }
    return { type: 'webcam' as const };
  });
  
  // Show camera config modal for first-time users
  const [showCameraModal, setShowCameraModal] = useState(() => {
    const hasConfigured = window.localStorage.getItem("mas-camera-configured");
    return !hasConfigured;
  });

  useEffect(() => {
    if (role === "none") {
      window.localStorage.removeItem("mas-role");
      window.localStorage.removeItem("mas-lecturer-id");
    } else {
      window.localStorage.setItem("mas-role", role);
      if (role === "lecturer" && activeLecturerId) {
        window.localStorage.setItem("mas-lecturer-id", activeLecturerId);
      }
    }
  }, [role, activeLecturerId]);

  const handleSaveCameraConfig = (config: CameraConfig) => {
    setCameraConfig(config);
    window.localStorage.setItem("mas-camera-config", JSON.stringify(config));
    window.localStorage.setItem("mas-camera-configured", "true");
    setShowCameraModal(false);
  };

  return (
    <NotificationProvider>
      <BiometricProvider>
        <MasStoreProvider>
          {/* Camera Configuration Modal - Shows for first-time users */}
          <CameraConfigModal
            isOpen={showCameraModal && role !== "none"}
            onClose={() => {
              setShowCameraModal(false);
              window.localStorage.setItem("mas-camera-configured", "true");
            }}
            onSave={handleSaveCameraConfig}
            currentConfig={cameraConfig}
            isFirstTime={!window.localStorage.getItem("mas-camera-configured")}
          />
          
          {role === "none" ? (
            <Gateway
              onAuthenticated={(nextRole, lecturerId) => {
                setRole(nextRole);
                setActiveLecturerId(lecturerId ?? null);
              }}
            />
          ) : (
            <Dashboard
              role={role}
              onLogout={() => {
                setRole("none");
                setActiveLecturerId(null);
              }}
              theme={theme}
              onToggleTheme={() =>
                setTheme(theme === "dark" ? "light" : "dark")
              }
              activeLecturerId={role === "lecturer" ? activeLecturerId : null}
              cameraConfig={cameraConfig}
              onOpenCameraSettings={() => setShowCameraModal(true)}
            />
          )}
        </MasStoreProvider>
      </BiometricProvider>
    </NotificationProvider>
  );
}

export default App;
