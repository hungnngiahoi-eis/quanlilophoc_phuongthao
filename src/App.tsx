import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  AppData, 
  ClassData, 
  Student, 
  ScoreColumn, 
  ScoreWeight, 
  ConfirmModalState,
  ScriptConfig,
  SeatingConfig,
  GuestPermissions
} from './types';
import { 
  DEFAULT_SCORE_COLUMNS_HK1, 
  DEFAULT_SCORE_COLUMNS_HK2 
} from './data/initialData';
import { DEFAULT_ADMIN_PIN } from './config/appConfig';
import { 
  loadLocalData, 
  saveLocalData, 
  fetchFromGoogleSheet, 
  saveToGoogleSheet,
  exportAppDataToFile
} from './services/storageService';
import { StudentList } from './components/StudentList';
import { GradeBook } from './components/GradeBook';
import { SeatingChart } from './components/SeatingChart';
import { GSManagerModal } from './components/GSManagerModal';
import { LoginModal } from './components/LoginModal';
import { ClassModal } from './components/ClassModal';
import { ConfirmModal } from './components/ConfirmModal';
import { StudentProfileModal } from './components/StudentProfileModal';
import { StudentScoreView } from './components/StudentScoreView';
import { 
  GraduationCap, 
  Cloud, 
  Lock, 
  LogOut, 
  Settings, 
  Plus, 
  ChevronDown, 
  RefreshCw, 
  Trash2, 
  Users, 
  Calculator, 
  LayoutGrid, 
  CheckCircle2, 
  AlertCircle,
  ShieldAlert,
  UserCheck,
  Key,
  Shield
} from 'lucide-react';

export default function App() {
  // App Data state
  const [appData, setAppData] = useState<AppData>(loadLocalData);
  const [activeTab, setActiveTab] = useState<'STUDENTS' | 'GRADEBOOK' | 'SEATING' | 'STUDENT_SCORE'>('STUDENTS');
  
  // Teacher Authentication state (Requirement 1)
  const [isTeacher, setIsTeacher] = useState<boolean>(() => {
    return localStorage.getItem('is_math_teacher_logged_in') === 'true';
  });

  // Student Authentication state
  const [currentStudent, setCurrentStudent] = useState<{
    student: Student;
    classId: string;
    className: string;
  } | null>(() => {
    try {
      const raw = localStorage.getItem('logged_in_student_info');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const initialAppData = loadLocalData();
      const cls = initialAppData.classes.find((c) => c.id === parsed.classId);
      if (!cls) return null;
      const st = cls.students.find((s) => s.studentCode === parsed.studentCode);
      if (!st) return null;
      return { student: st, classId: cls.id, className: cls.name };
    } catch {
      return null;
    }
  });

  // Modal visibility states
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isStudentProfileOpen, setIsStudentProfileOpen] = useState(false);
  const [isGSModalOpen, setIsGSModalOpen] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);

  // Sync state (Requirement 2 & Multi-device persistence)
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(() => {
    return localStorage.getItem('auto_sync_enabled') !== 'false';
  });
  const [syncStatus, setSyncStatus] = useState<'synced' | 'saving' | 'error' | 'pending'>('synced');
  const isInitialLoadedRef = useRef(false);
  const userModifiedRef = useRef(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  // Safe Confirmation Modal state (Requirement 5 / 3)
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Xác nhận xóa',
    confirmVariant: 'danger',
    onConfirm: () => {},
  });

  const showNotification = (type: 'success' | 'info' | 'error', message: string, duration = 4000) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification((prev) => (prev?.message === message ? null : prev));
    }, duration);
  };

  // Save to local storage whenever appData changes
  useEffect(() => {
    saveLocalData(appData);
  }, [appData]);

  // Requirement 2: Auto-load latest data from Google Sheets when opening web app
  useEffect(() => {
    let isMounted = true;
    async function initAutoLoad() {
      if (!appData.scriptConfig.url) {
        isInitialLoadedRef.current = true;
        return;
      }
      setIsSyncing(true);
      try {
        const res = await fetchFromGoogleSheet(appData.scriptConfig.url);
        if (isMounted) {
          if (res.success && res.data) {
            setAppData((prev) => {
              const incomingPin = res.data?.teacherPin;
              const resolvedPin = (!incomingPin || incomingPin === 'toan123')
                ? (prev.teacherPin && prev.teacherPin !== 'toan123' ? prev.teacherPin : DEFAULT_ADMIN_PIN)
                : incomingPin;
              return {
                ...prev,
                ...res.data,
                teacherPin: resolvedPin,
                lastSyncedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
              };
            });
            setSyncStatus('synced');
            showNotification('success', 'Đã tự động tải dữ liệu mới nhất từ Google Sheets thành công!');
          } else {
            console.log('Using local fallback data.');
          }
        }
      } catch (err) {
        console.warn('Auto fetch error:', err);
      } finally {
        if (isMounted) {
          setIsSyncing(false);
          isInitialLoadedRef.current = true;
        }
      }
    }

    initAutoLoad();
    return () => {
      isMounted = false;
    };
  }, []); // Run once on initial load

  // Debounced Auto-Sync to Google Sheets after any modifications
  useEffect(() => {
    if (!isInitialLoadedRef.current || !userModifiedRef.current || !autoSyncEnabled) {
      return;
    }
    if (!appData.scriptConfig.url) return;

    setSyncStatus('pending');
    const timer = setTimeout(async () => {
      try {
        setSyncStatus('saving');
        const res = await saveToGoogleSheet(appData.scriptConfig.url, appData);
        if (res.success) {
          const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
          setAppData((prev) => ({ ...prev, lastSyncedAt: timeStr }));
          setSyncStatus('synced');
          userModifiedRef.current = false;
        } else {
          setSyncStatus('error');
        }
      } catch (err) {
        console.warn('Auto sync error:', err);
        setSyncStatus('error');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [appData, autoSyncEnabled]);

  // Active class lookup
  const activeClass = appData.classes.find((c) => c.id === appData.activeClassId) || appData.classes[0];

  // Helper to update active class
  const updateActiveClass = useCallback((updater: (prevClass: ClassData) => ClassData) => {
    userModifiedRef.current = true;
    setSyncStatus('pending');
    setAppData((prev) => ({
      ...prev,
      classes: prev.classes.map((c) => (c.id === prev.activeClassId ? updater(c) : c)),
    }));
  }, []);

  // Handler: Manual save to Google Sheets
  const handleSaveToGoogleSheets = async () => {
    setIsSaving(true);
    setSyncStatus('saving');
    try {
      const res = await saveToGoogleSheet(appData.scriptConfig.url, appData);
      if (res.success) {
        const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
        setAppData((prev) => ({ ...prev, lastSyncedAt: timeStr }));
        setSyncStatus('synced');
        userModifiedRef.current = false;
        showNotification('success', 'Đã lưu toàn bộ dữ liệu lên Google Sheets và Google Drive!');
      } else {
        setSyncStatus('error');
        showNotification('error', res.message);
      }
    } catch (err: any) {
      setSyncStatus('error');
      showNotification('error', err.message || 'Lỗi khi lưu lên Google Sheets');
    } finally {
      setIsSaving(false);
    }
  };

  // Handler: Manual sync/fetch from Google Sheets
  const handleSyncFromGoogleSheets = async () => {
    setIsSyncing(true);
    try {
      const res = await fetchFromGoogleSheet(appData.scriptConfig.url);
      if (res.success && res.data) {
        setAppData((prev) => {
          const incomingPin = res.data?.teacherPin;
          const resolvedPin = (!incomingPin || incomingPin === 'toan123')
            ? (prev.teacherPin && prev.teacherPin !== 'toan123' ? prev.teacherPin : DEFAULT_ADMIN_PIN)
            : incomingPin;
          return {
            ...prev,
            ...res.data,
            teacherPin: resolvedPin,
            lastSyncedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' }),
          };
        });
        setSyncStatus('synced');
        userModifiedRef.current = false;
        showNotification('success', 'Đã tải dữ liệu mới nhất từ Google Sheets thành công!');
      } else {
        showNotification('info', res.message || 'Dữ liệu trang tính chưa thay đổi.');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Lỗi khi tải từ Google Sheets');
    } finally {
      setIsSyncing(false);
    }
  };

  // Handler: Update GS Configuration & notes history
  const handleSaveScriptConfig = (newUrl: string, note: string) => {
    const timestamp = new Date().toLocaleString('vi-VN');
    const newLog = {
      id: `log-${Date.now()}`,
      timestamp,
      note,
      url: newUrl,
    };
    setAppData((prev) => ({
      ...prev,
      scriptConfig: {
        url: newUrl,
        lastUpdated: timestamp,
        notesHistory: [newLog, ...(prev.scriptConfig.notesHistory || [])],
      },
    }));
    showNotification('success', 'Đã lưu cấu hình URL Google Apps Script và ghi chú thành công!');
  };

  // Sync current logged in student if class data changes
  useEffect(() => {
    if (currentStudent) {
      const cls = appData.classes.find((c) => c.id === currentStudent.classId);
      if (cls) {
        const found = cls.students.find((s) => s.id === currentStudent.student.id);
        if (found) {
          setCurrentStudent((prev) => (prev ? { ...prev, student: found } : null));
        }
      }
    }
  }, [appData.classes]);

  // Handler: Teacher & Student Login / Logout
  const handleLoginSuccess = () => {
    setIsTeacher(true);
    setCurrentStudent(null);
    localStorage.removeItem('logged_in_student_info');
    localStorage.setItem('is_math_teacher_logged_in', 'true');
    showNotification('success', 'Đăng nhập Quản trị viên (Cô Thảo) thành công! Có đầy đủ quyền sửa, xóa và nhập điểm.');
  };

  const handleStudentLoginSuccess = (student: Student, classId: string, className: string) => {
    setIsTeacher(false);
    localStorage.removeItem('is_math_teacher_logged_in');
    setCurrentStudent({ student, classId, className });
    localStorage.setItem('logged_in_student_info', JSON.stringify({ studentCode: student.studentCode, classId }));
    setAppData((prev) => ({ ...prev, activeClassId: classId }));
    setActiveTab('STUDENT_SCORE');
    showNotification('success', `Đăng nhập thành công! Chào em ${student.fullName} (${student.studentCode}).`);
  };

  const handleLogout = () => {
    setIsTeacher(false);
    setCurrentStudent(null);
    localStorage.removeItem('is_math_teacher_logged_in');
    localStorage.removeItem('logged_in_student_info');
    setActiveTab('STUDENTS');
    showNotification('info', 'Đã đăng xuất. Trang web chuyển về chế độ khách.');
  };

  const handleStudentSaveSelf = (updated: {
    avatar?: string;
    dateOfBirth?: string;
    phoneNumber?: string;
    password?: string;
  }) => {
    if (!currentStudent) return;
    updateActiveClass((cls) => ({
      ...cls,
      students: cls.students.map((st) => (st.id === currentStudent.student.id ? { ...st, ...updated } : st)),
    }));
    setCurrentStudent((prev) => (prev ? { ...prev, student: { ...prev.student, ...updated } } : null));
    showNotification('success', 'Đã cập nhật thông tin cá nhân thành công! Sẵn sàng đồng bộ lên Google Sheets.');
  };

  const handleUpdateGuestPermissions = (perms: GuestPermissions) => {
    userModifiedRef.current = true;
    setSyncStatus('pending');
    setAppData((prev) => ({
      ...prev,
      guestPermissions: perms,
    }));
    showNotification('success', 'Đã cập nhật cấu hình phân quyền xem cho khách.');
  };

  const handleUpdatePin = (newPin: string) => {
    setAppData((prev) => ({ ...prev, teacherPin: newPin }));
  };

  // Handler: Create new Class
  const handleCreateClass = (data: { name: string; gradeLevel: number; schoolYear: string; roomName: string }) => {
    const newClassId = `class-${Date.now()}`;
    const newClass: ClassData = {
      id: newClassId,
      name: data.name,
      gradeLevel: data.gradeLevel,
      schoolYear: data.schoolYear,
      roomName: data.roomName,
      students: [],
      scoreColumnsHK1: [...DEFAULT_SCORE_COLUMNS_HK1],
      scoreColumnsHK2: [...DEFAULT_SCORE_COLUMNS_HK2],
      gradesHK1: {},
      gradesHK2: {},
      seating: {
        rows: 6,
        cols: 4,
        seats: {},
      },
    };

    userModifiedRef.current = true;
    setSyncStatus('pending');
    setAppData((prev) => ({
      ...prev,
      classes: [...prev.classes, newClass],
      activeClassId: newClassId,
    }));
    showNotification('success', `Đã tạo ${data.name} thành công!`);
  };

  // Safe delete class (Requirement 5)
  const handleRequestDeleteClass = () => {
    if (!isTeacher) {
      setIsLoginModalOpen(true);
      return;
    }
    if (appData.classes.length <= 1) {
      showNotification('error', 'Cần giữ lại ít nhất 1 lớp học trong hệ thống.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: `Xác nhận xóa ${activeClass.name}`,
      message: `Bạn có chắc chắn muốn xóa toàn bộ lớp "${activeClass.name}"? Toàn bộ danh sách ${activeClass.students.length} học sinh, sổ điểm cá nhân và sơ đồ lớp sẽ bị xóa vĩnh viễn.`,
      confirmLabel: 'Xác nhận xóa lớp',
      confirmVariant: 'danger',
      onConfirm: () => {
        const remaining = appData.classes.filter((c) => c.id !== activeClass.id);
        userModifiedRef.current = true;
        setSyncStatus('pending');
        setAppData((prev) => ({
          ...prev,
          classes: remaining,
          activeClassId: remaining[0].id,
        }));
        showNotification('success', `Đã xóa lớp ${activeClass.name}.`);
      },
    });
  };

  // Student Operations (Requirement 3 & 5)
  const handleAddStudent = (studentData: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...studentData,
      id: `hs-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    updateActiveClass((cls) => ({
      ...cls,
      students: [...cls.students, newStudent],
    }));
    showNotification('success', `Đã thêm học sinh ${studentData.fullName} vào lớp.`);
  };

  const handleUpdateStudent = (id: string, data: Partial<Student>, silent?: boolean) => {
    updateActiveClass((cls) => ({
      ...cls,
      students: cls.students.map((st) => (st.id === id ? { ...st, ...data } : st)),
    }));
    if (!silent) {
      showNotification('success', 'Đã cập nhật thông tin học sinh.');
    }
  };

  const handleImportStudents = (newStudentsData: Omit<Student, 'id'>[]) => {
    const formatted: Student[] = newStudentsData.map((st, i) => ({
      ...st,
      id: `hs-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
    }));

    updateActiveClass((cls) => ({
      ...cls,
      students: [...cls.students, ...formatted],
    }));
    showNotification('success', `Đã nhập thành công ${formatted.length} học sinh từ Excel vào lớp!`);
  };

  const handleRequestDeleteStudent = (student: Student) => {
    setConfirmModal({
      isOpen: true,
      title: `Xác nhận xóa học sinh`,
      message: `Bạn có chắc chắn muốn xóa học sinh "${student.fullName}" (${student.studentCode}) khỏi danh sách? Điểm số môn Toán và vị trí bàn học của học sinh này cũng sẽ bị xóa.`,
      confirmLabel: 'Xóa học sinh',
      confirmVariant: 'danger',
      onConfirm: () => {
        updateActiveClass((cls) => {
          // Remove from seats if seated
          const newSeats = { ...cls.seating.seats };
          Object.keys(newSeats).forEach((key) => {
            if (newSeats[key] === student.id) newSeats[key] = null;
          });

          return {
            ...cls,
            students: cls.students.filter((s) => s.id !== student.id),
            seating: { ...cls.seating, seats: newSeats },
          };
        });
        showNotification('success', `Đã xóa học sinh ${student.fullName}.`);
      },
    });
  };

  // Grade Operations (Requirement 4 & 5)
  const handleUpdateScore = (
    semester: 'HK1' | 'HK2',
    studentId: string,
    columnId: string,
    score: number | null
  ) => {
    updateActiveClass((cls) => {
      const gradesProp = semester === 'HK1' ? 'gradesHK1' : 'gradesHK2';
      const prevGrade = cls[gradesProp][studentId] || { scores: {}, finalNote: '' };
      return {
        ...cls,
        [gradesProp]: {
          ...cls[gradesProp],
          [studentId]: {
            ...prevGrade,
            scores: {
              ...prevGrade.scores,
              [columnId]: score,
            },
          },
        },
      };
    });
  };

  const handleUpdateStudentFinalNote = (
    semester: 'HK1' | 'HK2',
    studentId: string,
    note: string
  ) => {
    updateActiveClass((cls) => {
      const gradesProp = semester === 'HK1' ? 'gradesHK1' : 'gradesHK2';
      const prevGrade = cls[gradesProp][studentId] || { scores: {}, finalNote: '' };
      return {
        ...cls,
        [gradesProp]: {
          ...cls[gradesProp],
          [studentId]: {
            ...prevGrade,
            finalNote: note,
          },
        },
      };
    });
  };

  const handleAddScoreColumn = (
    semester: 'HK1' | 'HK2',
    name: string,
    weight: ScoreWeight
  ) => {
    const colId = `col-${Date.now()}`;
    const newCol: ScoreColumn = { id: colId, name, weight, semester };

    updateActiveClass((cls) => {
      const colProp = semester === 'HK1' ? 'scoreColumnsHK1' : 'scoreColumnsHK2';
      return {
        ...cls,
        [colProp]: [...cls[colProp], newCol],
      };
    });
    showNotification('success', `Đã thêm cột điểm "${name}" (Hệ số ${weight}) vào ${semester}.`);
  };

  const handleRequestDeleteColumn = (semester: 'HK1' | 'HK2', column: ScoreColumn) => {
    setConfirmModal({
      isOpen: true,
      title: `Xác nhận xóa cột điểm`,
      message: `Bạn có chắc chắn muốn xóa cột điểm "${column.name}" (Hệ số ${column.weight}) của ${semester}? Toàn bộ điểm số học sinh đã nhập trong cột này sẽ bị xóa.`,
      confirmLabel: 'Xóa cột điểm',
      confirmVariant: 'danger',
      onConfirm: () => {
        updateActiveClass((cls) => {
          const colProp = semester === 'HK1' ? 'scoreColumnsHK1' : 'scoreColumnsHK2';
          const gradesProp = semester === 'HK1' ? 'gradesHK1' : 'gradesHK2';

          const newGrades = { ...cls[gradesProp] };
          Object.keys(newGrades).forEach((stId) => {
            if (newGrades[stId]?.scores) {
              const newScores = { ...newGrades[stId].scores };
              delete newScores[column.id];
              newGrades[stId] = { ...newGrades[stId], scores: newScores };
            }
          });

          return {
            ...cls,
            [colProp]: cls[colProp].filter((c) => c.id !== column.id),
            [gradesProp]: newGrades,
          };
        });
        showNotification('success', `Đã xóa cột điểm ${column.name}.`);
      },
    });
  };

  const handleReorderScoreColumns = (
    semester: 'HK1' | 'HK2',
    newColumns: ScoreColumn[]
  ) => {
    updateActiveClass((cls) => {
      const colProp = semester === 'HK1' ? 'scoreColumnsHK1' : 'scoreColumnsHK2';
      return {
        ...cls,
        [colProp]: newColumns,
      };
    });
    showNotification('success', `Đã cập nhật thứ tự các cột điểm ${semester}.`);
  };

  // Seating Operations (Requirement 6 & 5)
  const handleUpdateSeating = (newSeating: SeatingConfig) => {
    updateActiveClass((cls) => ({
      ...cls,
      seating: newSeating,
    }));
  };

  const handleRequestConfirmResetSeating = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận đặt lại sơ đồ lớp',
      message: 'Bạn có chắc chắn muốn đặt lại sơ đồ lớp? Toàn bộ chỗ ngồi của học sinh sẽ được dọn trống để sắp xếp lại.',
      confirmLabel: 'Đặt lại sơ đồ',
      confirmVariant: 'danger',
      onConfirm: () => {
        updateActiveClass((cls) => ({
          ...cls,
          seating: { ...cls.seating, seats: {} },
        }));
        showNotification('success', 'Đã đặt lại sơ đồ lớp.');
      },
    });
  };

  const handleRequestConfirmAutoGenerateSeating = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Xác nhận tạo sơ đồ theo danh sách',
      message: 'Bạn có chắc chắn muốn sắp xếp lại sơ đồ theo thứ tự danh sách học sinh? Toàn bộ vị trí chỗ ngồi hiện tại của lớp sẽ được thay thế theo danh sách mới.',
      confirmLabel: 'Tạo theo danh sách',
      confirmVariant: 'primary',
      onConfirm: () => {
        updateActiveClass((cls) => {
          const newSeats: Record<string, string | null> = {};
          let idx = 0;
          for (let r = 1; r <= cls.seating.rows; r++) {
            for (let c = 1; c <= cls.seating.cols; c++) {
              const key = `${r}-${c}`;
              if (idx < cls.students.length) {
                newSeats[key] = cls.students[idx].id;
                idx++;
              } else {
                newSeats[key] = null;
              }
            }
          }
          return {
            ...cls,
            seating: {
              ...cls.seating,
              seats: newSeats,
            },
          };
        });
        showNotification('success', 'Đã tạo sơ đồ lớp theo thứ tự danh sách học sinh.');
      },
    });
  };

  const handleRequestConfirmRemoveRow = () => {
    const targetRow = activeClass.seating.rows;
    setConfirmModal({
      isOpen: true,
      title: `Xác nhận bớt Hàng ${targetRow}`,
      message: `Hàng ${targetRow} hiện đang có học sinh ngồi. Bạn có chắc chắn muốn bớt hàng này? Các học sinh ngồi ở hàng này sẽ được chuyển về danh sách chưa xếp chỗ.`,
      confirmLabel: 'Bớt hàng ghế',
      confirmVariant: 'warning',
      onConfirm: () => {
        updateActiveClass((cls) => {
          const newSeats = { ...cls.seating.seats };
          Object.keys(newSeats).forEach((k) => {
            const [r] = k.split('-').map(Number);
            if (r >= targetRow) {
              delete newSeats[k];
            }
          });
          return {
            ...cls,
            seating: {
              ...cls.seating,
              rows: cls.seating.rows - 1,
              seats: newSeats,
            },
          };
        });
        showNotification('success', `Đã bớt hàng ${targetRow}.`);
      },
    });
  };

  const handleRequestConfirmRemoveCol = () => {
    const targetCol = activeClass.seating.cols;
    setConfirmModal({
      isOpen: true,
      title: `Xác nhận bớt Dãy ${targetCol}`,
      message: `Dãy ${targetCol} hiện đang có học sinh ngồi. Bạn có chắc chắn muốn bớt dãy này? Các học sinh ngồi ở dãy này sẽ được chuyển về danh sách chưa xếp chỗ.`,
      confirmLabel: 'Bớt dãy bàn',
      confirmVariant: 'warning',
      onConfirm: () => {
        updateActiveClass((cls) => {
          const newSeats = { ...cls.seating.seats };
          Object.keys(newSeats).forEach((k) => {
            const [, c] = k.split('-').map(Number);
            if (c >= targetCol) {
              delete newSeats[k];
            }
          });
          return {
            ...cls,
            seating: {
              ...cls.seating,
              cols: cls.seating.cols - 1,
              seats: newSeats,
            },
          };
        });
        showNotification('success', `Đã bớt dãy ${targetCol}.`);
      },
    });
  };

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-800 flex flex-col font-sans">
      {/* Top Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-top-3 duration-200">
          <div className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2.5 ${
            notification.type === 'success'
              ? 'bg-emerald-900 text-white border-emerald-700'
              : notification.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : 'bg-indigo-900 text-white border-indigo-700'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : notification.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : (
              <Cloud className="w-4 h-4 text-indigo-300 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Prominent Colored Banner: Khối màu nổi bật, tiêu đề trang web chính giữa */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 text-white py-3 sm:py-4 px-4 shadow-md border-b border-indigo-950/20">
        <div className="max-w-7xl mx-auto flex items-center justify-center text-center">
          <div className="inline-flex items-center justify-center gap-2.5 sm:gap-3 px-4 sm:px-6 py-1.5 sm:py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner">
            <div className="p-1.5 sm:p-2 bg-amber-400 text-slate-900 rounded-xl shadow-xs font-bold shrink-0">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h1 className="text-base sm:text-xl md:text-2xl font-black tracking-tight text-white drop-shadow-sm text-center">
              Thầy Nguyễn Nhật Huy <br /> Trang quản lí lớp học
            </h1>
          </div>
        </div>
      </div>

      {/* Main Top Header (Hàng 2): Nút đăng nhập -> Chọn lớp -> Các nút khác */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-3">
            {/* Nhóm bên trái: [1. Nút Đăng nhập] -> [2. Chọn lớp] (Không để trong container overflow-x-auto để tránh bị che/cắt menu đổ xuống) */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              {/* 1. NÚT ĐĂNG NHẬP (hoặc trạng thái đăng nhập) */}
              {isTeacher ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-2.5 py-1 text-[11px] sm:text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg shadow-2xs">
                    Admin (Cô Thảo)
                  </span>
                  <button
                    id="header-logout-btn"
                    type="button"
                    onClick={handleLogout}
                    className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1 transition-colors"
                    title="Thoát quyền quản trị về chế độ khách"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Thoát</span>
                  </button>
                </div>
              ) : currentStudent ? (
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="px-2.5 py-1 text-[11px] sm:text-xs font-bold bg-indigo-50 text-indigo-800 border border-indigo-200 rounded-lg flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="max-w-[90px] sm:max-w-[150px] truncate">{currentStudent.student.fullName}</span>
                  </span>
                  <button
                    id="header-student-logout-btn"
                    type="button"
                    onClick={handleLogout}
                    className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1 transition-colors"
                    title="Đăng xuất tài khoản học sinh"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Thoát</span>
                  </button>
                </div>
              ) : (
                <button
                  id="header-login-btn"
                  type="button"
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold text-slate-900 bg-amber-400 hover:bg-amber-300 rounded-xl flex items-center gap-1.5 shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] shrink-0"
                  title="Đăng nhập Quản trị viên hoặc Học sinh"
                >
                  <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-900" />
                  <span>Đăng nhập</span>
                </button>
              )}

              {/* 2. CHỌN LỚP (Thiết kế nổi bật, rõ ràng, menu đổ xuống không bị che khuất) */}
              {currentStudent ? (
                <div className="flex items-center gap-1.5 bg-indigo-50/90 px-3 py-1.5 rounded-xl border border-indigo-200 shrink-0">
                  <span className="text-xs font-bold text-indigo-900">Lớp: {currentStudent.className}</span>
                  <span className="text-[10px] bg-indigo-200/80 text-indigo-800 px-1.5 py-0.5 rounded-full font-semibold hidden sm:inline">
                    {activeClass?.students.length || 0} HS
                  </span>
                </div>
              ) : (
                <div className="relative shrink-0">
                  <div className={`flex items-center gap-1 p-1 rounded-xl border-2 transition-all shadow-xs ${
                    isClassDropdownOpen 
                      ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-200' 
                      : 'bg-indigo-50/80 hover:bg-indigo-100/90 border-indigo-300 hover:border-indigo-400'
                  }`}>
                    <button
                      id="class-selector-dropdown-btn"
                      type="button"
                      onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                      className="px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-black text-indigo-950 flex items-center gap-2"
                      title="Bấm vào đây để chọn lớp học"
                    >
                      <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wide hidden md:inline">
                        Lớp:
                      </span>
                      <span className="text-xs sm:text-sm font-black text-indigo-900 bg-white px-2 py-0.5 rounded-lg border border-indigo-200 shadow-2xs">
                        {activeClass?.name || 'Chọn lớp'}
                      </span>
                      <span className="text-[10px] sm:text-[11px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                        {activeClass?.students.length || 0} HS
                      </span>
                      <ChevronDown className={`w-4 h-4 text-indigo-700 transition-transform duration-200 ${isClassDropdownOpen ? 'rotate-180 text-indigo-900' : ''}`} />
                    </button>

                    {isTeacher && (
                      <button
                        id="open-create-class-modal-btn"
                        type="button"
                        onClick={() => setIsClassModalOpen(true)}
                        className="p-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors shadow-2xs"
                        title="Tạo thêm lớp mới"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Class Dropdown Menu & Backdrop */}
                  {isClassDropdownOpen && (
                    <>
                      {/* Lớp phủ click ra ngoài để đóng menu */}
                      <div
                        className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-[0.5px]"
                        onClick={() => setIsClassDropdownOpen(false)}
                      />

                      {/* Hộp menu đổ xuống nổi bật, bóng đổ rõ nét */}
                      <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border-2 border-indigo-500/30 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                        {/* Tiêu đề Menu */}
                        <div className="px-4 py-3 bg-gradient-to-r from-indigo-700 to-blue-700 text-white flex items-center justify-between shadow-xs">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-4 h-4 text-amber-300" />
                            <span className="text-xs font-black tracking-wide uppercase">
                              Danh sách lớp ({appData.classes.length})
                            </span>
                          </div>
                          <span className="text-[10px] text-indigo-100 bg-white/20 px-2 py-0.5 rounded-full font-medium">
                            Chọn để xem
                          </span>
                        </div>

                        {/* Danh sách các lớp */}
                        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
                          {appData.classes.map((cls) => {
                            const isSelected = cls.id === activeClass.id;
                            return (
                              <button
                                key={cls.id}
                                type="button"
                                onClick={() => {
                                  setAppData((prev) => ({ ...prev, activeClassId: cls.id }));
                                  setIsClassDropdownOpen(false);
                                }}
                                className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center justify-between transition-all ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/20 ring-1 ring-indigo-400'
                                    : 'hover:bg-indigo-50 text-slate-800 hover:text-indigo-950 font-medium'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                    isSelected ? 'bg-white text-indigo-700 shadow-xs' : 'bg-indigo-100 text-indigo-700'
                                  }`}>
                                    {cls.name.replace(/[^0-9a-zA-Z]/g, '').slice(0, 3) || 'LP'}
                                  </div>
                                  <div>
                                    <div className={`text-sm ${isSelected ? 'font-black text-white' : 'font-bold text-slate-800'}`}>
                                      {cls.name}
                                    </div>
                                    <div className={`text-[10px] ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                                      {cls.roomName ? `Phòng: ${cls.roomName}` : `Khối ${cls.gradeLevel}`}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                                    isSelected
                                      ? 'bg-white/20 text-white'
                                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                                  }`}>
                                    {cls.students.length} HS
                                  </span>
                                  {isSelected && (
                                    <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Các hành động cho Giáo viên */}
                        {isTeacher && (
                          <div className="p-2 bg-slate-50 border-t border-slate-100 space-y-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setIsClassDropdownOpen(false);
                                setIsClassModalOpen(true);
                              }}
                              className="w-full text-left px-3 py-2 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl flex items-center gap-2 transition-colors shadow-2xs"
                            >
                              <Plus className="w-4 h-4 text-indigo-600" />
                              <span>Thêm lớp giảng dạy mới...</span>
                            </button>
                            {appData.classes.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsClassDropdownOpen(false);
                                  handleRequestDeleteClass();
                                }}
                                className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition-colors"
                              >
                                <Trash2 className="w-4 h-4 text-rose-500" />
                                <span>Xóa lớp "{activeClass.name}"</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Nhóm bên phải: [3. Các nút đồng bộ (khi là giáo viên)] + [Trạng thái đồng bộ] */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1 ml-auto">
              {/* 3. CÁC NÚT KHÁC (Chỉ hiển thị cho Giáo viên - Cô Thảo; Ẩn ở chế độ Khách và Học sinh) */}
              {isTeacher && (
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  <button
                    id="header-fetch-sheet-btn"
                    type="button"
                    onClick={handleSyncFromGoogleSheets}
                    disabled={isSyncing}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 border border-slate-200 transition-colors disabled:opacity-50"
                    title="Tải lại dữ liệu mới nhất từ Google Sheets"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-indigo-600' : 'text-slate-600'}`} />
                    <span className="hidden md:inline">{isSyncing ? 'Đang tải...' : 'Tải dữ liệu mới về'}</span>
                  </button>

                  <button
                    id="header-save-sheet-btn"
                    type="button"
                    onClick={handleSaveToGoogleSheets}
                    disabled={isSaving || syncStatus === 'saving'}
                    className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50"
                    title="Lưu toàn bộ danh sách, điểm và sơ đồ lên Google Sheets"
                  >
                    <Cloud className={`w-3.5 h-3.5 ${isSaving || syncStatus === 'saving' ? 'animate-pulse' : ''}`} />
                    <span className="hidden sm:inline">{isSaving || syncStatus === 'saving' ? 'Đang lưu...' : 'Lưu dữ liệu mới'}</span>
                  </button>

                  <button
                    id="header-gs-manager-btn"
                    type="button"
                    onClick={() => setIsGSModalOpen(true)}
                    className="p-2 text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors"
                    title="Quản lý mã GS & Cấu hình"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
              )}

            {/* DÒNG TRẠNG THÁI ĐỒNG BỘ DUY NHẤT TRÊN MÀN HÌNH (Góc phải Hàng 2) */}
            <div className="ml-auto flex items-center gap-2 text-[11px] text-slate-500 shrink-0">
              {isSyncing ? (
                <span className="flex items-center gap-1 text-indigo-600 font-medium">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span className="hidden sm:inline">Đang đồng bộ...</span>
                  <span className="sm:hidden">Đang đồng bộ...</span>
                </span>
              ) : appData.lastSyncedAt ? (
                <span className="text-emerald-700 font-medium hidden sm:flex items-center gap-1">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Đã đồng bộ lúc: {appData.lastSyncedAt}</span>
                </span>
              ) : (
                <span className="text-slate-400 hidden sm:inline">Sẵn sàng lưu Sheet</span>
              )}
            </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1 border-t border-slate-100 pt-1 pb-1 overflow-x-auto">
            {/* Khi đăng nhập vào học sinh: ĐỔI LẠI CHỈ CÒN TAB "Điểm số của em"! */}
            {currentStudent ? (
              <button
                id="main-tab-student-score"
                type="button"
                onClick={() => setActiveTab('STUDENT_SCORE')}
                className="px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 bg-indigo-600 text-white shadow-2xs shrink-0"
              >
                <Calculator className="w-4 h-4" />
                <span>Điểm Số Của Em</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-900 font-bold">
                  {currentStudent.student.studentCode}
                </span>
              </button>
            ) : (
              <>
                {/* Tab: Danh Sách Học Sinh (hiển thị cho giáo viên hoặc khách nếu được cho phép) */}
                {(isTeacher || appData.guestPermissions?.allowViewStudents !== false) && (
                  <button
                    id="main-tab-students"
                    type="button"
                    onClick={() => setActiveTab('STUDENTS')}
                    className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all shrink-0 ${
                      activeTab === 'STUDENTS'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-4 h-4" />
                    <span>Danh Sách Học Sinh</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      activeTab === 'STUDENTS' ? 'bg-indigo-700 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {activeClass.students.length}
                    </span>
                  </button>
                )}

                {/* Tab: Sơ Đồ Lớp Học (hiển thị cho giáo viên hoặc khách nếu được cho phép) */}
                {(isTeacher || appData.guestPermissions?.allowViewSeating !== false) && (
                  <button
                    id="main-tab-seating"
                    type="button"
                    onClick={() => setActiveTab('SEATING')}
                    className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all shrink-0 ${
                      activeTab === 'SEATING'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span>Sơ Đồ Lớp Học</span>
                    <span className="text-[10px] font-normal opacity-80">({activeClass.seating.cols} dãy &times; {activeClass.seating.rows} hàng)</span>
                  </button>
                )}

                {/* Tab: Sổ Điểm Cá Nhân (Chỉ hiển thị cho Giáo viên hoặc khi được cho phép; Ẩn hoàn toàn ở chế độ khách thay vì hiện nút khóa) */}
                {(isTeacher || appData.guestPermissions?.allowViewGradebook) && (
                  <button
                    id="main-tab-gradebook"
                    type="button"
                    onClick={() => setActiveTab('GRADEBOOK')}
                    className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all shrink-0 ${
                      activeTab === 'GRADEBOOK'
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Calculator className="w-4 h-4" />
                    <span>Sổ Điểm Cá Nhân</span>
                    {isTeacher && <span className="text-[10px] font-normal opacity-80">(Toàn Lớp)</span>}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </header>

      {/* Student Welcome Banner */}
      {currentStudent && (
        <div className="bg-indigo-50/80 border-b border-indigo-200 px-4 py-2.5 text-xs text-indigo-900 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              Xin chào <strong>{currentStudent.student.fullName}</strong> ({currentStudent.student.studentCode})! <strong>{currentStudent.className}</strong>.
            </span>
          </div>
        </div>
      )}

      {/* Main App Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Student Score Tab */}
        {activeTab === 'STUDENT_SCORE' && currentStudent && (
          <StudentScoreView
            student={currentStudent.student}
            cls={activeClass}
            onOpenEditProfile={() => setIsStudentProfileOpen(true)}
          />
        )}

        {/* Student List Tab */}
        {activeTab === 'STUDENTS' && (
          <StudentList
            students={activeClass.students}
            onAddStudent={handleAddStudent}
            onUpdateStudent={handleUpdateStudent}
            onRequestDeleteStudent={handleRequestDeleteStudent}
            onImportStudents={handleImportStudents}
            isTeacher={isTeacher}
            onRequestLogin={() => setIsLoginModalOpen(true)}
          />
        )}

        {/* GradeBook Tab */}
        {activeTab === 'GRADEBOOK' && (
          isTeacher || appData.guestPermissions?.allowViewGradebook ? (
            <GradeBook
              students={activeClass.students}
              columnsHK1={activeClass.scoreColumnsHK1}
              columnsHK2={activeClass.scoreColumnsHK2}
              gradesHK1={activeClass.gradesHK1}
              gradesHK2={activeClass.gradesHK2}
              onUpdateScore={handleUpdateScore}
              onUpdateStudentFinalNote={handleUpdateStudentFinalNote}
              onAddScoreColumn={handleAddScoreColumn}
              onRequestDeleteColumn={handleRequestDeleteColumn}
              onReorderColumns={handleReorderScoreColumns}
              isTeacher={isTeacher}
              onRequestLogin={() => setIsLoginModalOpen(true)}
              classNameTitle={activeClass.name}
              syncStatus={syncStatus}
            />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs max-w-xl mx-auto my-8">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-amber-200">
                <Lock className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Sổ Điểm Đang Được Bảo Mật</h2>
              <p className="text-sm text-slate-600 mb-6">
                Chế độ khách chưa được cấp quyền xem toàn bộ sổ điểm của lớp. Quý phụ huynh hoặc học sinh vui lòng đăng nhập tài khoản để xem điểm số cá nhân, hoặc giáo viên đăng nhập để quản lý điểm.
              </p>
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-xs transition-colors"
              >
                Đăng nhập tài khoản
              </button>
            </div>
          )
        )}

        {/* Seating Chart Tab */}
        {activeTab === 'SEATING' && (
          <SeatingChart
            key={activeClass.id}
            students={activeClass.students}
            seating={activeClass.seating}
            onUpdateSeating={handleUpdateSeating}
            onRequestConfirmReset={handleRequestConfirmResetSeating}
            onRequestConfirmAutoGenerate={handleRequestConfirmAutoGenerateSeating}
            onRequestConfirmRemoveRow={handleRequestConfirmRemoveRow}
            onRequestConfirmRemoveCol={handleRequestConfirmRemoveCol}
            isTeacher={isTeacher}
            onRequestLogin={() => setIsLoginModalOpen(true)}
            onUpdateStudent={handleUpdateStudent}
            columnsHK1={activeClass.scoreColumnsHK1}
            columnsHK2={activeClass.scoreColumnsHK2}
            gradesHK1={activeClass.gradesHK1}
            gradesHK2={activeClass.gradesHK2}
            onUpdateScore={handleUpdateScore}
            onUpdateStudentFinalNote={handleUpdateStudentFinalNote}
          />
        )}
      </main>

      {/* Footer: Sửa theo đúng yêu cầu: @huyquochoc@gmail.com-0914282232, bỏ dòng bên phải */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto">
          <p className="font-semibold text-slate-700 tracking-wide">
            @huyquochoc@gmail.com-0914282232
          </p>
        </div>
      </footer>

      {/* Global Modals */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginAdminSuccess={handleLoginSuccess}
        onLoginStudentSuccess={handleStudentLoginSuccess}
        expectedAdminPin={appData.teacherPin}
        classes={appData.classes}
        onUpdateAdminPin={handleUpdatePin}
      />

      {/* Student Self-Service Profile Modal */}
      {currentStudent && (
        <StudentProfileModal
          isOpen={isStudentProfileOpen}
          onClose={() => setIsStudentProfileOpen(false)}
          student={currentStudent.student}
          classNameStr={currentStudent.className}
          onSaveProfile={async (data) => {
            handleStudentSaveSelf(data);
          }}
        />
      )}

      <GSManagerModal
        isOpen={isGSModalOpen}
        onClose={() => setIsGSModalOpen(false)}
        config={appData.scriptConfig}
        onSaveConfig={handleSaveScriptConfig}
        onTestConnection={async (url) => {
          return await fetchFromGoogleSheet(url);
        }}
        onSyncNow={handleSyncFromGoogleSheets}
        onSaveToSheetNow={handleSaveToGoogleSheets}
        isSyncing={isSyncing}
        isSaving={isSaving}
        autoSyncEnabled={autoSyncEnabled}
        onToggleAutoSync={(val) => {
          setAutoSyncEnabled(val);
          localStorage.setItem('auto_sync_enabled', String(val));
        }}
        guestPermissions={appData.guestPermissions}
        onUpdateGuestPermissions={handleUpdateGuestPermissions}
        onExportBackup={() => exportAppDataToFile(appData, `so_quan_ly_toan_${new Date().toISOString().slice(0, 10)}.json`)}
      />

      <ClassModal
        isOpen={isClassModalOpen}
        onClose={() => setIsClassModalOpen(false)}
        onCreateClass={handleCreateClass}
      />

      {/* Safe confirmation dialog for all deletes (Requirement 5) */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        confirmVariant={confirmModal.confirmVariant}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
