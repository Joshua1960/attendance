import { createContext, useContext, useMemo, useReducer } from "react";
import type { BiometricMethod } from "./BiometricContext";

export type Student = {
  id: string;
  name: string;
  matricNumber: string;
  program: string;
  classId: string;
  className: string;
  photoUrl: string;
  lecturerIds: string[];
  status: "Active" | "Inactive";
  lastSeen: string;
};

export type Admin = {
  id: string;
  name: string;
  role: string;
  clearance: "Standard" | "Elevated" | "Super";
};

export type Lecturer = {
  id: string;
  name: string;
  email: string;
  password: string;
  classId: string;
  className: string;
  status: "Active" | "Pending";
};

export type AttendanceLog = {
  id: string;
  studentId: string;
  studentName: string;
  studentMatricNumber?: string;
  classId: string;
  className: string;
  sessionLabel: string;
  sessionDate: string;
  sessionStart: string;
  method: BiometricMethod;
  timestamp: string;
  signal: string;
};

type StoreState = {
  students: Student[];
  admins: Admin[];
  lecturers: Lecturer[];
  logs: AttendanceLog[];
};

type StoreAction =
  | { type: "ADD_LOG"; payload: AttendanceLog }
  | { type: "ADD_STUDENT"; payload: Student }
  | { type: "DELETE_STUDENT"; payload: { studentId: string } }
  | { type: "ADD_LECTURER"; payload: Lecturer }
  | { type: "DELETE_LECTURER"; payload: { lecturerId: string } }
  | {
      type: "UPDATE_STUDENT_LECTURERS";
      payload: { studentId: string; lecturerIds: string[] };
    }
  | {
      type: "UPDATE_LECTURER_STATUS";
      payload: { lecturerId: string; status: Lecturer["status"] };
    }
  | {
      type: "UPDATE_STUDENT_LAST_SEEN";
      payload: { studentId: string; timestamp: string };
    }
  | { type: "DELETE_LOGS_BY_DATE"; payload: { date: string } };

const initialState: StoreState = {
  students: [
    {
      id: "st-101",
      name: "Alyssa Morgan",
      matricNumber: "MAS-2025-014",
      program: "Computer Engineering",
      classId: "cl-01",
      className: "Database System (CSC 301)",
      photoUrl:
        "https://api.dicebear.com/9.x/initials/svg?seed=Alyssa%20Morgan",
      lecturerIds: ["lec-01"],
      status: "Active",
      lastSeen: "08:13 AM",
    },
    {
      id: "st-102",
      name: "Miguel Santos",
      matricNumber: "MAS-2025-109",
      program: "Information Systems",
      classId: "cl-02",
      className: "Intelligent Systems (CSC 475)",
      photoUrl:
        "https://api.dicebear.com/9.x/initials/svg?seed=Miguel%20Santos",
      lecturerIds: ["lec-02"],
      status: "Active",
      lastSeen: "08:20 AM",
    },
    {
      id: "st-103",
      name: "Priya Nair",
      matricNumber: "MAS-2025-088",
      program: "Data Science",
      classId: "cl-03",
      className: "Human Computer Interaction (CSC 582)",
      photoUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Priya%20Nair",
      lecturerIds: ["lec-03"],
      status: "Inactive",
      lastSeen: "Yesterday",
    },
    {
      id: "st-104",
      name: "Noah Delgado",
      matricNumber: "MAS-2025-052",
      program: "Cybersecurity",
      classId: "cl-01",
      className: "Database System (CSC 301)",
      photoUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Noah%20Delgado",
      lecturerIds: ["lec-01"],
      status: "Active",
      lastSeen: "08:05 AM",
    },
    {
      id: "st-105",
      name: "Zara Bennett",
      matricNumber: "MAS-2025-121",
      program: "AI & Robotics",
      classId: "cl-03",
      className: "Human Computer Interaction (CSC 582)",
      photoUrl: "https://api.dicebear.com/9.x/initials/svg?seed=Zara%20Bennett",
      lecturerIds: ["lec-03"],
      status: "Active",
      lastSeen: "08:17 AM",
    },
  ],
  admins: [
    {
      id: "ad-01",
      name: "Dr. Karen Li",
      role: "System Director",
      clearance: "Super",
    },
  ],
  lecturers: [
    // LECTURERS DATA ARE SUPPOSED TO BE HERE
  ],
  logs: [
    {
      id: "log-1",
      studentId: "st-104",
      studentName: "Noah Delgado",
      classId: "cl-01",
      className: "Database System (CSC 301)",
      sessionLabel: "1st Class",
      sessionDate: "2025-01-18",
      sessionStart: "08:00 AM",
      method: "Fingerprint",
      timestamp: "08:05 AM",
      signal: "fp-1123 • 96% match",
    },
    {
      id: "log-2",
      studentId: "st-101",
      studentName: "Alyssa Morgan",
      classId: "cl-01",
      className: "Database System (CSC 301)",
      sessionLabel: "1st Class",
      sessionDate: "2025-01-18",
      sessionStart: "08:00 AM",
      method: "Face",
      timestamp: "08:13 AM",
      signal: "face-2043 • 94% liveness",
    },
    {
      id: "log-3",
      studentId: "st-102",
      studentName: "Miguel Santos",
      classId: "cl-02",
      className: "Intelligent Systems (CSC 475)",
      sessionLabel: "2nd Class",
      sessionDate: "2025-01-18",
      sessionStart: "09:30 AM",
      method: "Fingerprint",
      timestamp: "08:20 AM",
      signal: "fp-4588 • 98% match",
    },
  ],
};

const reducer = (state: StoreState, action: StoreAction): StoreState => {
  switch (action.type) {
    case "ADD_LOG":
      return { ...state, logs: [action.payload, ...state.logs].slice(0, 12) };
    case "ADD_STUDENT":
      return { ...state, students: [action.payload, ...state.students] };
    case "DELETE_STUDENT":
      return {
        ...state,
        students: state.students.filter(
          (student) => student.id !== action.payload.studentId,
        ),
      };
    case "ADD_LECTURER":
      return { ...state, lecturers: [action.payload, ...state.lecturers] };
    case "DELETE_LECTURER":
      return {
        ...state,
        lecturers: state.lecturers.filter(
          (lecturer) => lecturer.id !== action.payload.lecturerId,
        ),
        students: state.students.map((student) => ({
          ...student,
          lecturerIds: student.lecturerIds.filter(
            (id) => id !== action.payload.lecturerId,
          ),
        })),
      };
    case "UPDATE_STUDENT_LECTURERS":
      return {
        ...state,
        students: state.students.map((student) =>
          student.id === action.payload.studentId
            ? { ...student, lecturerIds: action.payload.lecturerIds }
            : student,
        ),
      };
    case "UPDATE_LECTURER_STATUS":
      return {
        ...state,
        lecturers: state.lecturers.map((lecturer) =>
          lecturer.id === action.payload.lecturerId
            ? { ...lecturer, status: action.payload.status }
            : lecturer,
        ),
      };
    case "UPDATE_STUDENT_LAST_SEEN":
      return {
        ...state,
        students: state.students.map((student) =>
          student.id === action.payload.studentId
            ? {
                ...student,
                lastSeen: action.payload.timestamp,
                status: "Active",
              }
            : student,
        ),
      };
    case "DELETE_LOGS_BY_DATE":
      return {
        ...state,
        logs: state.logs.filter(
          (log) => log.sessionDate !== action.payload.date,
        ),
      };
    default:
      return state;
  }
};

const MasStoreContext = createContext<
  | (StoreState & {
      addLog: (log: AttendanceLog) => void;
      addStudent: (student: Student) => void;
      deleteStudent: (studentId: string) => void;
      addLecturer: (lecturer: Lecturer) => void;
      deleteLecturer: (lecturerId: string) => void;
      updateStudentLecturers: (
        studentId: string,
        lecturerIds: string[],
      ) => void;
      updateLecturerStatus: (
        lecturerId: string,
        status: Lecturer["status"],
      ) => void;
      updateStudentLastSeen: (studentId: string, timestamp: string) => void;
      deleteLogsByDate: (date: string) => void;
    })
  | undefined
>(undefined);

export const MasStoreProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const addLog = (log: AttendanceLog) =>
    dispatch({ type: "ADD_LOG", payload: log });
  const addStudent = (student: Student) =>
    dispatch({ type: "ADD_STUDENT", payload: student });
  const deleteStudent = (studentId: string) =>
    dispatch({ type: "DELETE_STUDENT", payload: { studentId } });
  const addLecturer = (lecturer: Lecturer) =>
    dispatch({ type: "ADD_LECTURER", payload: lecturer });
  const deleteLecturer = (lecturerId: string) =>
    dispatch({ type: "DELETE_LECTURER", payload: { lecturerId } });
  const updateStudentLecturers = (studentId: string, lecturerIds: string[]) =>
    dispatch({
      type: "UPDATE_STUDENT_LECTURERS",
      payload: { studentId, lecturerIds },
    });
  const updateLecturerStatus = (
    lecturerId: string,
    status: Lecturer["status"],
  ) =>
    dispatch({
      type: "UPDATE_LECTURER_STATUS",
      payload: { lecturerId, status },
    });
  const updateStudentLastSeen = (studentId: string, timestamp: string) =>
    dispatch({
      type: "UPDATE_STUDENT_LAST_SEEN",
      payload: { studentId, timestamp },
    });
  const deleteLogsByDate = (date: string) =>
    dispatch({ type: "DELETE_LOGS_BY_DATE", payload: { date } });

  const value = useMemo(
    () => ({
      ...state,
      addLog,
      addStudent,
      deleteStudent,
      addLecturer,
      deleteLecturer,
      updateStudentLecturers,
      updateLecturerStatus,
      updateStudentLastSeen,
      deleteLogsByDate,
    }),
    [state],
  );

  return (
    <MasStoreContext.Provider value={value}>
      {children}
    </MasStoreContext.Provider>
  );
};

export const useMasStore = () => {
  const context = useContext(MasStoreContext);
  if (!context) {
    throw new Error("useMasStore must be used within MasStoreProvider");
  }
  return context;
};
