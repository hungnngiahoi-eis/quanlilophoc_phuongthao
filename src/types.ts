export type Gender = 'Nam' | 'Nữ';

export interface Student {
  id: string;
  stt: number;
  studentCode: string;
  fullName: string;
  gender: Gender;
  dateOfBirth: string;
  phoneNumber?: string; // Số điện thoại
  password?: string;    // Mật khẩu học sinh (mặc định: 123)
  avatar?: string;
  note?: string; // Đặc điểm, nhận dạng
  goodPoints?: number; // Điểm tốt (mặc định 0, có thể âm hoặc dương)
}

export type ScoreWeight = 1 | 2 | 3; // HS1, HS2, HS3

export interface ScoreColumn {
  id: string;
  name: string;
  weight: ScoreWeight;
  semester: 'HK1' | 'HK2';
}

export interface StudentGrade {
  scores: Record<string, number | null>; // columnId -> score (0 to 10)
  finalNote: string; // Cột ghi chú cuối cho mỗi học sinh
}

export interface SeatingConfig {
  rows: number; // Mặc định 6 hàng
  cols: number; // Mặc định 4 dãy
  seats: Record<string, string | null>; // key: `${row}-${col}` -> studentId
}

export interface ClassData {
  id: string;
  name: string;
  gradeLevel: number;
  schoolYear: string;
  roomName?: string;
  students: Student[];
  scoreColumnsHK1: ScoreColumn[];
  scoreColumnsHK2: ScoreColumn[];
  gradesHK1: Record<string, StudentGrade>;
  gradesHK2: Record<string, StudentGrade>;
  seating: SeatingConfig;
}

export interface ScriptUpdateLog {
  id: string;
  timestamp: string;
  note: string; // Ghi chú cập nhật đầu mã
  url: string;
}

export interface ScriptConfig {
  url: string;
  lastUpdated?: string;
  notesHistory: ScriptUpdateLog[];
}

export interface GuestPermissions {
  allowViewStudents: boolean; // Cho phép khách xem danh sách học sinh
  allowViewSeating: boolean;  // Cho phép khách xem sơ đồ lớp
  allowViewGradebook: boolean; // Cho phép khách xem sổ điểm
}

export interface StudentUserSession {
  studentId: string;
  studentCode: string;
  fullName: string;
  classId: string;
}

export interface AppData {
  classes: ClassData[];
  activeClassId: string;
  scriptConfig: ScriptConfig;
  teacherPin: string;
  lastSyncedAt: string | null;
  guestPermissions?: GuestPermissions;
}

export interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  confirmVariant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
}
