import React, { useState, useEffect } from 'react';
import { Student, SeatingConfig, ScoreColumn, StudentGrade } from '../types';
import { StudentDeskActionModal } from './StudentDeskActionModal';
import { 
  LayoutGrid, 
  RotateCcw, 
  Wand2, 
  Plus, 
  Minus, 
  Printer, 
  User, 
  Move, 
  Check, 
  X, 
  Info,
  Layers,
  Sparkles,
  Star
} from 'lucide-react';

interface SeatingChartProps {
  students: Student[];
  seating: SeatingConfig;
  onUpdateSeating: (newSeating: SeatingConfig) => void;
  onRequestConfirmReset: () => void;
  onRequestConfirmAutoGenerate?: () => void;
  onRequestConfirmRemoveRow: () => void;
  onRequestConfirmRemoveCol: () => void;
  isTeacher: boolean;
  onRequestLogin: () => void;
  onUpdateStudent?: (id: string, data: Partial<Student>, silent?: boolean) => void;
  columnsHK1?: ScoreColumn[];
  columnsHK2?: ScoreColumn[];
  gradesHK1?: Record<string, StudentGrade>;
  gradesHK2?: Record<string, StudentGrade>;
  onUpdateScore?: (semester: 'HK1' | 'HK2', studentId: string, columnId: string, score: number | null) => void;
  onUpdateStudentFinalNote?: (semester: 'HK1' | 'HK2', studentId: string, note: string) => void;
}

export const SeatingChart: React.FC<SeatingChartProps> = ({
  students,
  seating,
  onUpdateSeating,
  onRequestConfirmReset,
  onRequestConfirmAutoGenerate,
  onRequestConfirmRemoveRow,
  onRequestConfirmRemoveCol,
  isTeacher,
  onRequestLogin,
  onUpdateStudent,
  columnsHK1,
  columnsHK2,
  gradesHK1,
  gradesHK2,
  onUpdateScore,
  onUpdateStudentFinalNote,
}) => {
  // Selected seat for click-to-swap
  const [selectedSeatKey, setSelectedSeatKey] = useState<string | null>(null);
  const [selectedUnseatedId, setSelectedUnseatedId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<{ source: 'seat' | 'unseated'; keyOrId: string } | null>(null);
  const [hoveredSeatKey, setHoveredSeatKey] = useState<string | null>(null);
  const [deskActionStudent, setDeskActionStudent] = useState<{ student: Student; seatKey: string | null } | null>(null);

  // Student dictionary for fast lookup
  const studentMap = new Map<string, Student>();
  students.forEach((s) => studentMap.set(s.id, s));

  // Auto-clear invalid selection keys if grid resized
  useEffect(() => {
    if (selectedSeatKey) {
      const [r, c] = selectedSeatKey.split('-').map(Number);
      if (r > seating.rows || c > seating.cols || r < 1 || c < 1) {
        setSelectedSeatKey(null);
      }
    }
  }, [seating.rows, seating.cols, selectedSeatKey]);

  // Find unseated students - CRITICAL FIX: Only count seats that are within the current visible rows and cols!
  const seatedStudentIds = new Set<string>();
  for (let r = 1; r <= seating.rows; r++) {
    for (let c = 1; c <= seating.cols; c++) {
      const id = seating.seats[`${r}-${c}`];
      if (typeof id === 'string' && id && studentMap.has(id)) {
        seatedStudentIds.add(id);
      }
    }
  }
  const unseatedStudents = students.filter((s) => !seatedStudentIds.has(s.id));

  // Auto layout generator: map students 1..N to grid sequentially
  const handleAutoGenerate = () => {
    if (!isTeacher) {
      onRequestLogin();
      return;
    }
    if (onRequestConfirmAutoGenerate) {
      onRequestConfirmAutoGenerate();
      return;
    }
    const newSeats: Record<string, string | null> = {};
    let idx = 0;
    for (let r = 1; r <= seating.rows; r++) {
      for (let c = 1; c <= seating.cols; c++) {
        const key = `${r}-${c}`;
        if (idx < students.length) {
          newSeats[key] = students[idx].id;
          idx++;
        } else {
          newSeats[key] = null;
        }
      }
    }
    onUpdateSeating({
      ...seating,
      seats: newSeats,
    });
    setSelectedSeatKey(null);
    setSelectedUnseatedId(null);
  };

  // Add row
  const handleAddRow = () => {
    if (!isTeacher) {
      onRequestLogin();
      return;
    }
    onUpdateSeating({
      ...seating,
      rows: seating.rows + 1,
    });
  };

  // Remove row (if row has seated students, ask confirmation)
  const handleRemoveRow = () => {
    if (!isTeacher) {
      onRequestLogin();
      return;
    }
    if (seating.rows <= 2) return;
    const targetRow = seating.rows;
    let hasStudents = false;
    for (let c = 1; c <= seating.cols; c++) {
      if (seating.seats[`${targetRow}-${c}`]) {
        hasStudents = true;
        break;
      }
    }
    if (hasStudents) {
      onRequestConfirmRemoveRow();
    } else {
      // Safe remove - clear all keys for row >= targetRow to prevent phantom seats
      const newSeats = { ...seating.seats };
      Object.keys(newSeats).forEach((k) => {
        const [r] = k.split('-').map(Number);
        if (r >= targetRow) {
          delete newSeats[k];
        }
      });
      onUpdateSeating({
        ...seating,
        rows: seating.rows - 1,
        seats: newSeats,
      });
    }
  };

  // Add column (aisle)
  const handleAddCol = () => {
    if (!isTeacher) {
      onRequestLogin();
      return;
    }
    onUpdateSeating({
      ...seating,
      cols: seating.cols + 1,
    });
  };

  // Remove column
  const handleRemoveCol = () => {
    if (!isTeacher) {
      onRequestLogin();
      return;
    }
    if (seating.cols <= 2) return;
    const targetCol = seating.cols;
    let hasStudents = false;
    for (let r = 1; r <= seating.rows; r++) {
      if (seating.seats[`${r}-${targetCol}`]) {
        hasStudents = true;
        break;
      }
    }
    if (hasStudents) {
      onRequestConfirmRemoveCol();
    } else {
      // Safe remove - clear all keys for col >= targetCol to prevent phantom seats
      const newSeats = { ...seating.seats };
      Object.keys(newSeats).forEach((k) => {
        const [, c] = k.split('-').map(Number);
        if (c >= targetCol) {
          delete newSeats[k];
        }
      });
      onUpdateSeating({
        ...seating,
        cols: seating.cols - 1,
        seats: newSeats,
      });
    }
  };

  // Swap / Place logic for Click-to-swap
  const handleSeatClick = (key: string) => {
    // If not teacher, open student inspection / detail modal
    if (!isTeacher) {
      const currentId = seating.seats[key];
      if (currentId && studentMap.has(currentId)) {
        setDeskActionStudent({ student: studentMap.get(currentId)!, seatKey: key });
      }
      return;
    }

    // 1. If an unseated student is currently selected to place
    if (selectedUnseatedId) {
      const newSeats = { ...seating.seats, [key]: selectedUnseatedId };
      onUpdateSeating({ ...seating, seats: newSeats });
      setSelectedUnseatedId(null);
      return;
    }

    // 2. If a seated student was selected to move / swap
    const hasMoveStudent = selectedSeatKey && seating.seats[selectedSeatKey];
    if (hasMoveStudent) {
      if (selectedSeatKey === key) {
        // Deselect
        setSelectedSeatKey(null);
        return;
      }
      const studentA = seating.seats[selectedSeatKey] || null;
      const studentB = seating.seats[key] || null;
      const newSeats = {
        ...seating.seats,
        [selectedSeatKey]: studentB,
        [key]: studentA,
      };
      onUpdateSeating({ ...seating, seats: newSeats });
      setSelectedSeatKey(null);
      return;
    }

    // 3. If clicking a seat that HAS A STUDENT:
    // ALWAYS open the comprehensive action & details modal!
    // Never accidentally displace or swap them!
    const studentId = seating.seats[key];
    if (studentId && studentMap.has(studentId)) {
      setSelectedSeatKey(null); // Clear any stale empty seat selection
      setDeskActionStudent({ student: studentMap.get(studentId)!, seatKey: key });
      return;
    }

    // 4. If clicking an empty seat when nothing was selected:
    // Toggle selection on this empty seat so user can pick an unseated student from below
    if (selectedSeatKey === key) {
      setSelectedSeatKey(null);
    } else {
      setSelectedSeatKey(key);
    }
  };

  const handleUnseatedClick = (studentId: string) => {
    if (!isTeacher) {
      if (studentMap.has(studentId)) {
        setDeskActionStudent({ student: studentMap.get(studentId)!, seatKey: null });
      }
      return;
    }

    // If a seat was selected and user clicks an unseated student, place them there
    if (selectedSeatKey) {
      const newSeats = { ...seating.seats, [selectedSeatKey]: studentId };
      onUpdateSeating({ ...seating, seats: newSeats });
      setSelectedSeatKey(null);
      return;
    }

    // Open student action modal for unseated student
    if (studentMap.has(studentId)) {
      setDeskActionStudent({ student: studentMap.get(studentId)!, seatKey: null });
    }
  };

  // Remove student from seat to unseated pool
  const handleEvictSeatByKey = (seatKey: string) => {
    if (!isTeacher) return;
    const newSeats = { ...seating.seats, [seatKey]: null };
    onUpdateSeating({ ...seating, seats: newSeats });
    if (selectedSeatKey === seatKey) setSelectedSeatKey(null);
  };

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, source: 'seat' | 'unseated', keyOrId: string) => {
    if (!isTeacher) return;
    setDraggedItem({ source, keyOrId });
    e.dataTransfer.setData('text/plain', JSON.stringify({ source, keyOrId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, seatKey: string) => {
    if (!isTeacher) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (hoveredSeatKey !== seatKey) {
      setHoveredSeatKey(seatKey);
    }
  };

  const handleDragLeave = () => {
    setHoveredSeatKey(null);
  };

  const handleDrop = (e: React.DragEvent, targetSeatKey: string) => {
    if (!isTeacher) return;
    e.preventDefault();
    setHoveredSeatKey(null);

    let dragData = draggedItem;
    if (!dragData) {
      try {
        const raw = e.dataTransfer.getData('text/plain');
        dragData = JSON.parse(raw);
      } catch {}
    }

    if (!dragData) return;

    if (dragData.source === 'seat') {
      const sourceSeatKey = dragData.keyOrId;
      if (sourceSeatKey === targetSeatKey) return;
      const studentA = seating.seats[sourceSeatKey] || null;
      const studentB = seating.seats[targetSeatKey] || null;
      const newSeats = {
        ...seating.seats,
        [sourceSeatKey]: studentB,
        [targetSeatKey]: studentA,
      };
      onUpdateSeating({ ...seating, seats: newSeats });
    } else if (dragData.source === 'unseated') {
      const studentId = dragData.keyOrId;
      const newSeats = {
        ...seating.seats,
        [targetSeatKey]: studentId,
      };
      onUpdateSeating({ ...seating, seats: newSeats });
    }

    setDraggedItem(null);
    setSelectedSeatKey(null);
    setSelectedUnseatedId(null);
  };

  // Remove student from seat to unseated pool
  const handleEvictSeat = (e: React.MouseEvent, seatKey: string) => {
    e.stopPropagation();
    if (!isTeacher) return;
    const newSeats = { ...seating.seats, [seatKey]: null };
    onUpdateSeating({ ...seating, seats: newSeats });
    if (selectedSeatKey === seatKey) setSelectedSeatKey(null);
  };

  const selectedStudentObj = selectedSeatKey
    ? (seating.seats[selectedSeatKey] ? studentMap.get(seating.seats[selectedSeatKey]!) : null)
    : selectedUnseatedId
    ? studentMap.get(selectedUnseatedId)
    : null;
  const isSelectedEmptySeat = !!(selectedSeatKey && !seating.seats[selectedSeatKey]);

  return (
    <div className="space-y-4">
      {/* Top Header & Grid Settings */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
            <LayoutGrid className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              Sơ Đồ Lớp Học Thông Minh
              <span className="text-xs font-normal text-slate-500">
                (Nhìn từ bàn Giáo viên nhìn xuống)
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Quy mô: <strong>{seating.cols} dãy bàn</strong> &times; <strong>{seating.rows} hàng ghế</strong> ({seating.cols * seating.rows} chỗ ngồi)
            </p>
          </div>
        </div>

        {/* Action buttons & Row/Col adjustment (Chỉ dành riêng cho Admin/Giáo viên) */}
        {isTeacher && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Row and Col adjustments */}
            <div className="flex items-center gap-1 bg-slate-50 p-1 border border-slate-200 rounded-lg text-xs">
              <span className="text-[11px] font-semibold text-slate-600 px-1">Dãy ({seating.cols}):</span>
              <button
                id="btn-remove-col"
                type="button"
                onClick={handleRemoveCol}
                disabled={seating.cols <= 2 || !isTeacher}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded disabled:opacity-40"
                title="Bớt 1 dãy bàn (có xác nhận nếu có học sinh)"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-add-col"
                type="button"
                onClick={handleAddCol}
                disabled={!isTeacher}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded disabled:opacity-40"
                title="Thêm 1 dãy bàn"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              <span className="text-slate-300 mx-1">|</span>

              <span className="text-[11px] font-semibold text-slate-600 px-1">Hàng ({seating.rows}):</span>
              <button
                id="btn-remove-row"
                type="button"
                onClick={handleRemoveRow}
                disabled={seating.rows <= 2 || !isTeacher}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded disabled:opacity-40"
                title="Bớt 1 hàng (có xác nhận nếu có học sinh)"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                id="btn-add-row"
                type="button"
                onClick={handleAddRow}
                disabled={!isTeacher}
                className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded disabled:opacity-40"
                title="Thêm 1 hàng ghế"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Auto Arrange & Reset */}
            <button
              id="auto-generate-seating-btn"
              type="button"
              onClick={handleAutoGenerate}
              className="px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Tự động xếp học sinh theo thứ tự danh sách lớp (có hộp thoại xác nhận)"
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Tạo theo danh sách</span>
            </button>

            <button
              id="reset-seating-btn"
              type="button"
              onClick={() => {
                if (!isTeacher) {
                  onRequestLogin();
                  return;
                }
                onRequestConfirmReset();
              }}
              className="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Đặt lại toàn bộ sơ đồ (có xác nhận)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đặt lại sơ đồ</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
              title="In sơ đồ lớp"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Helper Banner for Drag & Drop / Click to Swap (Chỉ hiển thị cho Giáo viên/Admin) */}
      {isTeacher && (
        <div className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
          selectedStudentObj || isSelectedEmptySeat
            ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-400/40'
            : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
          <div className="flex items-center gap-2">
            {selectedStudentObj || isSelectedEmptySeat ? (
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
            )}
            <span>
              {selectedStudentObj ? (
                <span>
                  Đang chọn di chuyển: <strong>{selectedStudentObj.fullName}</strong>. Nhấn vào <strong>ghế khác</strong> để đổi chỗ hoặc chọn chỗ trống để chuyển vào!
                </span>
              ) : isSelectedEmptySeat && selectedSeatKey ? (
                <span>
                  Đang chọn <strong>Bàn trống (Hàng {selectedSeatKey.split('-')[0]} - Dãy {selectedSeatKey.split('-')[1]})</strong>. Nhấp vào học sinh trong danh sách chưa xếp chỗ bên dưới để xếp vào bàn này!
                </span>
              ) : (
                <span>
                  💡 <strong>Kéo thả</strong> học sinh vào ghế bất kì, hoặc <strong>nhấp chuột vào học sinh</strong> để mở bảng tác vụ (Điểm tốt, Nhập điểm, Đổi chỗ).
                </span>
              )}
            </span>
          </div>

          {(selectedStudentObj || isSelectedEmptySeat) && (
            <button
              type="button"
              onClick={() => {
                setSelectedSeatKey(null);
                setSelectedUnseatedId(null);
              }}
              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-md border border-slate-300 text-[11px] flex items-center gap-1 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              Hủy chọn
            </button>
          )}
        </div>
      )}

      {/* Main Classroom Perspective View: Nhìn từ Bàn Giáo Viên ở DƯỚI MÀN HÌNH nhìn lên */}
      <div className="bg-slate-100/80 p-6 rounded-2xl border border-slate-200 shadow-inner space-y-6">
        {/* Hướng nhìn từ bàn Thầy Huy lên các dãy bàn */}
        <div className="text-center text-[11px] text-slate-500 font-semibold tracking-wide flex items-center justify-center gap-2">
          <span className="h-px bg-slate-300 w-12" />
          <span>▲ Hướng nhìn từ bàn Thầy Huy lên các dãy bàn học sinh ▲</span>
          <span className="h-px bg-slate-300 w-12" />
        </div>

        {/* Seating Grid */}
        <div className="overflow-x-auto pb-4 pt-1 scroll-smooth">
          <div className="inline-flex min-w-full justify-start p-1">
            <div 
              className="grid gap-4 w-max mx-auto"
              style={{
                gridTemplateColumns: `repeat(${seating.cols}, minmax(140px, 190px))`,
              }}
            >
            {/* Column Header labels (Dãy 1, Dãy 2, Dãy 3, Dãy 4...) */}
            {Array.from({ length: seating.cols }, (_, cIdx) => (
              <div
                key={`col-header-${cIdx + 1}`}
                className="text-center py-1.5 px-3 bg-white/90 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 shadow-2xs"
              >
                Dãy {cIdx + 1}
              </div>
            ))}

            {/* Matrix of Seats: Hiển thị từ Hàng xa (seating.rows) xuống đến Hàng 1 (sát bàn GV) */}
            {Array.from({ length: seating.rows }, (_, rIdx) => {
              const rowNum = seating.rows - rIdx; // Hàng trên cùng là hàng xa nhất, Hàng 1 ở sát bàn GV phía dưới
              return Array.from({ length: seating.cols }, (_, cIdx) => {
                const colNum = cIdx + 1;
                const seatKey = `${rowNum}-${colNum}`;
                const studentId = seating.seats[seatKey];
                const student = studentId ? studentMap.get(studentId) : null;
                const isSelected = selectedSeatKey === seatKey;
                const isHovered = hoveredSeatKey === seatKey;

                return (
                  <div
                    key={seatKey}
                    id={`seat-${seatKey}`}
                    onClick={() => handleSeatClick(seatKey)}
                    onDragOver={(e) => handleDragOver(e, seatKey)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, seatKey)}
                    draggable={!!student && isTeacher}
                    onDragStart={(e) => {
                      if (student) handleDragStart(e, 'seat', seatKey);
                    }}
                    className={`relative p-3 rounded-xl border-2 transition-all cursor-pointer select-none flex flex-col justify-between min-h-[110px] ${
                      student
                        ? isSelected
                          ? 'bg-amber-50 border-amber-500 shadow-md ring-2 ring-amber-400'
                          : isHovered
                          ? 'bg-indigo-50/80 border-indigo-400 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xs'
                        : isSelected
                        ? 'bg-amber-50/50 border-dashed border-amber-400'
                        : isHovered
                        ? 'bg-emerald-50 border-dashed border-emerald-400'
                        : 'bg-slate-50/70 border-dashed border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {/* Row - Col badge and Quick Points Badge */}
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="font-mono font-medium">
                        H{rowNum}-D{colNum}
                      </span>
                      {student ? (
                        <div className="flex items-center gap-1">
                          <span
                            className={`px-1.5 py-0.5 rounded-md font-bold text-[9px] border flex items-center gap-0.5 shadow-2xs ${
                              (student.goodPoints || 0) > 0
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : (student.goodPoints || 0) < 0
                                ? 'bg-rose-50 text-rose-700 border-rose-300'
                                : 'bg-slate-50 text-slate-500 border-slate-200'
                            }`}
                            title={`Điểm tốt: ${(student.goodPoints || 0) > 0 ? `+${student.goodPoints}` : (student.goodPoints || 0)}`}
                          >
                            <Star className={`w-2.5 h-2.5 ${(student.goodPoints || 0) > 0 ? 'text-amber-500 fill-amber-400' : 'text-slate-400'}`} />
                            {(student.goodPoints || 0) > 0 ? `+${student.goodPoints}` : (student.goodPoints || 0)}
                          </span>

                          {isTeacher && onUpdateStudent && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateStudent(student.id, { goodPoints: (student.goodPoints || 0) + 1 }, true);
                              }}
                              className="w-4 h-4 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold flex items-center justify-center text-[10px] shadow-2xs active:scale-90 transition-all"
                              title="Tặng nhanh 1 điểm tốt (+1)"
                            >
                              +
                            </button>
                          )}

                          {isTeacher && (
                            <button
                              type="button"
                              onClick={(e) => handleEvictSeat(e, seatKey)}
                              className="text-slate-300 hover:text-rose-600 p-0.5 rounded transition-colors ml-0.5"
                              title="Rời khỏi chỗ ngồi"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ) : null}
                    </div>

                    {/* Student Info or Empty State */}
                    {student ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-center">
                        <div className="relative mb-1">
                          {student.avatar ? (
                            <img
                              src={student.avatar}
                              alt={student.fullName}
                              className="w-8 h-8 rounded-full object-cover border border-slate-300 shadow-2xs"
                            />
                          ) : (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              student.gender === 'Nữ'
                                ? 'bg-pink-100 text-pink-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {student.fullName.charAt(0)}
                            </div>
                          )}
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                            student.gender === 'Nữ' ? 'bg-pink-500' : 'bg-blue-500'
                          }`} />
                        </div>

                        <span className="font-bold text-slate-800 text-xs truncate max-w-[130px]" title={student.fullName}>
                          {student.fullName}
                        </span>

                        <span className="text-[10px] font-mono text-slate-500">
                          {student.studentCode}
                        </span>

                        {/* Special Note Badge (e.g. Cận thị, Cán sự) */}
                        {student.note && (
                          <div className="mt-1 px-1.5 py-0.5 bg-amber-50 text-amber-900 border border-amber-200/80 rounded text-[9px] truncate max-w-[125px]" title={student.note}>
                            {student.note}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-center py-2">
                        <User className="w-5 h-5 stroke-[1.5] mb-1 opacity-50" />
                        <span className="text-[10px]">Chỗ trống</span>
                      </div>
                    )}
                  </div>
                );
              });
            })}
            </div>
          </div>
        </div>

        {/* TEACHER'S DESK & BOARD */}
        <div className="max-w-xl mx-auto pt-1">
          <div className="bg-gradient-to-b from-amber-700 to-amber-800 text-amber-50 py-2.5 px-6 rounded-xl shadow-md border-t-4 border-amber-500 text-center flex items-center justify-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm" />
            <span className="font-bold tracking-wider text-xs uppercase">
              BÀN GIÁO VIÊN
            </span>
          </div>

          {/* Blackboard / Bục giảng phía sau bàn GV */}
          <div className="h-2.5 bg-emerald-800 rounded-full mx-auto w-3/4 shadow-sm mt-2" title="Bảng từ chống lóa" />
        </div>
      </div>

      {/* Bottom Drawer: Unseated Students Pool */}
      {unseatedStudents.length > 0 && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-800">
                Học Sinh Chưa Có Chỗ Ngồi ({unseatedStudents.length} em)
              </h3>
            </div>
            {isTeacher && (
              <span className="text-[11px] text-slate-500">
                Kéo thả hoặc nhấp vào học sinh rồi nhấp vào ghế trống ở trên
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
            {unseatedStudents.map((st) => {
              const isSelected = selectedUnseatedId === st.id;
              return (
                <div
                  key={st.id}
                  id={`unseated-${st.id}`}
                  onClick={() => handleUnseatedClick(st.id)}
                  draggable={isTeacher}
                  onDragStart={(e) => handleDragStart(e, 'unseated', st.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-100 border-amber-500 text-amber-900 font-bold ring-2 ring-amber-400'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                  title={st.note ? `${st.fullName} (${st.note})` : st.fullName}
                >
                  {st.avatar ? (
                    <img src={st.avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                      {st.fullName.charAt(0)}
                    </div>
                  )}
                  <span>{st.fullName}</span>
                  {(st.goodPoints !== undefined && st.goodPoints !== 0) && (
                    <span className={`px-1 rounded text-[9px] font-bold border flex items-center gap-0.5 ${
                      st.goodPoints > 0 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                        : 'bg-rose-50 text-rose-700 border-rose-300'
                    }`}>
                      ★ {st.goodPoints > 0 ? `+${st.goodPoints}` : st.goodPoints}
                    </span>
                  )}
                  {st.note && (
                    <span className="w-2 h-2 rounded-full bg-amber-400" title={st.note} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Comprehensive Student Desk Action & Info Modal */}
      {deskActionStudent && (
        <StudentDeskActionModal
          isOpen={!!deskActionStudent}
          onClose={() => setDeskActionStudent(null)}
          student={studentMap.get(deskActionStudent.student.id) || deskActionStudent.student}
          seatKey={deskActionStudent.seatKey}
          isTeacher={isTeacher}
          onStartMoveSeat={(keyOrId) => {
            if (keyOrId.includes('-')) {
              setSelectedSeatKey(keyOrId);
              setSelectedUnseatedId(null);
            } else {
              setSelectedUnseatedId(keyOrId);
              setSelectedSeatKey(null);
            }
          }}
          onEvictSeat={handleEvictSeatByKey}
          onUpdateStudent={onUpdateStudent || (() => {})}
          columnsHK1={columnsHK1}
          columnsHK2={columnsHK2}
          gradesHK1={gradesHK1}
          gradesHK2={gradesHK2}
          onUpdateScore={onUpdateScore}
          onUpdateStudentFinalNote={onUpdateStudentFinalNote}
        />
      )}
    </div>
  );
};
