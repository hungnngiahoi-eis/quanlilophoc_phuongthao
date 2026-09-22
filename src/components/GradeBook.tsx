import React, { useState, useEffect } from 'react';
import { Student, ScoreColumn, StudentGrade, ScoreWeight } from '../types';
import { calculateSemesterAverage, calculateYearlyAverage, getGradeClassification } from '../utils/gradeCalculations';

interface ScoreInputCellProps {
  studentId: string;
  columnId: string;
  score: number | null | undefined;
  isTeacher: boolean;
  rowIndex: number;
  colIndex: number;
  totalRows: number;
  onUpdateScore: (studentId: string, columnId: string, score: number | null) => void;
  onRequestLogin: () => void;
}

const ScoreInputCell: React.FC<ScoreInputCellProps> = ({
  studentId,
  columnId,
  score,
  isTeacher,
  rowIndex,
  colIndex,
  totalRows,
  onUpdateScore,
  onRequestLogin,
}) => {
  const [localVal, setLocalVal] = useState<string>(
    score !== undefined && score !== null ? String(score) : ''
  );
  const [isFocused, setIsFocused] = useState<boolean>(false);

  useEffect(() => {
    if (!isFocused) {
      setLocalVal(score !== undefined && score !== null ? String(score) : '');
    }
  }, [score, isFocused]);

  const commitScore = (rawText: string) => {
    const clean = rawText.replace(',', '.').trim();
    if (clean === '' || clean === '-') {
      if (score !== null && score !== undefined) {
        onUpdateScore(studentId, columnId, null);
      }
      setLocalVal('');
      return;
    }

    const num = parseFloat(clean);
    if (!isNaN(num) && num >= 0 && num <= 10) {
      const rounded = Math.round(num * 10) / 10;
      if (score !== rounded) {
        onUpdateScore(studentId, columnId, rounded);
      }
      setLocalVal(String(rounded));
    } else {
      setLocalVal(score !== undefined && score !== null ? String(score) : '');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isTeacher) {
      onRequestLogin();
      return;
    }

    const inputVal = e.target.value;

    if (inputVal === '') {
      setLocalVal('');
      return;
    }

    // Allow typing numbers with up to 1 decimal place, accepting either '.' or ','
    // Matches: "7", "7.", "7,", "7.5", "7,5", "10", "10.", "0", "0.", "0.5"
    if (!/^[0-9]{0,2}([.,][0-9]{0,1})?$/.test(inputVal)) {
      return;
    }

    const clean = inputVal.replace(',', '.');
    const num = parseFloat(clean);
    if (!isNaN(num) && num > 10) {
      return;
    }

    setLocalVal(inputVal);
  };

  const handleBlur = () => {
    setIsFocused(false);
    commitScore(localVal);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitScore(localVal);
      if (rowIndex + 1 < totalRows) {
        const nextCell = document.getElementById(`score-cell-${rowIndex + 1}-${colIndex}`);
        nextCell?.focus();
      } else {
        e.currentTarget.blur();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      commitScore(localVal);
      const nextCell = document.getElementById(`score-cell-${rowIndex + 1}-${colIndex}`);
      nextCell?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      commitScore(localVal);
      const prevCell = document.getElementById(`score-cell-${rowIndex - 1}-${colIndex}`);
      prevCell?.focus();
    } else if (e.key === 'Escape') {
      setLocalVal(score !== undefined && score !== null ? String(score) : '');
      e.currentTarget.blur();
    }
  };

  const isScoreLow = score !== null && score !== undefined && score < 5.0;
  const isScoreHigh = score !== null && score !== undefined && score >= 8.5;

  return (
    <input
      id={`score-cell-${rowIndex}-${colIndex}`}
      type="text"
      inputMode="decimal"
      value={localVal}
      onFocus={() => setIsFocused(true)}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder="-"
      disabled={!isTeacher}
      title={
        isTeacher 
          ? 'Nhập điểm (0 - 10, chấp nhận 1 số thập phân, VD: 7.5 hoặc 7,5). Enter để chấm học sinh tiếp theo.' 
          : 'Chỉ giáo viên mới có quyền sửa điểm'
      }
      className={`w-12 py-1 text-center font-mono font-semibold rounded-md border text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
        !isTeacher 
          ? 'bg-transparent border-transparent cursor-default' 
          : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-indigo-400'
      } ${
        isScoreLow ? 'text-rose-600 font-bold bg-rose-50/40 border-rose-200' : ''
      } ${
        isScoreHigh ? 'text-emerald-700 font-bold' : 'text-slate-800'
      }`}
    />
  );
};
import { 
  Calculator, 
  PlusCircle, 
  Trash2, 
  Award, 
  TrendingUp, 
  AlertCircle, 
  Printer, 
  X, 
  Check, 
  BarChart2, 
  Info,
  BookOpen,
  Download,
  Cloud,
  CheckCircle2,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react';

interface GradeBookProps {
  students: Student[];
  columnsHK1: ScoreColumn[];
  columnsHK2: ScoreColumn[];
  gradesHK1: Record<string, StudentGrade>;
  gradesHK2: Record<string, StudentGrade>;
  onUpdateScore: (semester: 'HK1' | 'HK2', studentId: string, columnId: string, score: number | null) => void;
  onUpdateStudentFinalNote: (semester: 'HK1' | 'HK2', studentId: string, note: string) => void;
  onAddScoreColumn: (semester: 'HK1' | 'HK2', name: string, weight: ScoreWeight) => void;
  onRequestDeleteColumn: (semester: 'HK1' | 'HK2', column: ScoreColumn) => void;
  onReorderColumns?: (semester: 'HK1' | 'HK2', newColumns: ScoreColumn[]) => void;
  isTeacher: boolean;
  onRequestLogin: () => void;
  classNameTitle?: string;
  syncStatus?: 'synced' | 'saving' | 'error' | 'pending';
}

export const GradeBook: React.FC<GradeBookProps> = ({
  students,
  columnsHK1,
  columnsHK2,
  gradesHK1,
  gradesHK2,
  onUpdateScore,
  onUpdateStudentFinalNote,
  onAddScoreColumn,
  onRequestDeleteColumn,
  onReorderColumns,
  isTeacher,
  onRequestLogin,
  classNameTitle = '',
  syncStatus = 'synced',
}) => {
  const [activeTab, setActiveTab] = useState<'HK1' | 'HK2' | 'SUMMARY'>('HK1');
  const [isAddColumnModalOpen, setIsAddColumnModalOpen] = useState(false);
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [tempReorderCols, setTempReorderCols] = useState<ScoreColumn[]>([]);
  const [newColName, setNewColName] = useState('');
  const [newColWeight, setNewColWeight] = useState<ScoreWeight>(1);
  const [showStats, setShowStats] = useState(false);

  const currentColumns = activeTab === 'HK1' ? columnsHK1 : columnsHK2;
  const currentGrades = activeTab === 'HK1' ? gradesHK1 : gradesHK2;

  // Sắp xếp học sinh chuẩn theo STT
  const sortedStudents = [...students].sort((a, b) => {
    const numA = parseInt(String(a.stt), 10);
    const numB = parseInt(String(b.stt), 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return (a.fullName || '').localeCompare(b.fullName || '');
  });

  // Score editing handler
  const handleScoreChange = (
    studentId: string,
    columnId: string,
    rawVal: string
  ) => {
    if (!isTeacher) {
      onRequestLogin();
      return;
    }

    const clean = rawVal.replace(',', '.').trim();
    if (clean === '') {
      onUpdateScore(activeTab as 'HK1' | 'HK2', studentId, columnId, null);
      return;
    }

    const num = parseFloat(clean);
    if (!isNaN(num) && num >= 0 && num <= 10) {
      onUpdateScore(activeTab as 'HK1' | 'HK2', studentId, columnId, Math.round(num * 10) / 10);
    }
  };

  const handleCreateColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    onAddScoreColumn(activeTab as 'HK1' | 'HK2', newColName.trim(), newColWeight);
    setNewColName('');
    setNewColWeight(1);
    setIsAddColumnModalOpen(false);
  };

  // Move column left or right directly from table header
  const handleMoveColumn = (colIndex: number, direction: 'left' | 'right') => {
    if (!onReorderColumns || !isTeacher || activeTab === 'SUMMARY') return;
    const newCols = [...currentColumns];
    const targetIndex = direction === 'left' ? colIndex - 1 : colIndex + 1;
    if (targetIndex < 0 || targetIndex >= newCols.length) return;
    const [movedCol] = newCols.splice(colIndex, 1);
    newCols.splice(targetIndex, 0, movedCol);
    onReorderColumns(activeTab, newCols);
  };

  // Reorder modal helpers
  const handleOpenReorderModal = () => {
    if (!isTeacher) {
      onRequestLogin();
      return;
    }
    setTempReorderCols([...currentColumns]);
    setIsReorderModalOpen(true);
  };

  const handleMoveTempCol = (index: number, direction: 'up' | 'down') => {
    const newCols = [...tempReorderCols];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newCols.length) return;
    const [moved] = newCols.splice(index, 1);
    newCols.splice(target, 0, moved);
    setTempReorderCols(newCols);
  };

  const handleMoveTempColToEdge = (index: number, toEdge: 'top' | 'bottom') => {
    const newCols = [...tempReorderCols];
    const [moved] = newCols.splice(index, 1);
    if (toEdge === 'top') {
      newCols.unshift(moved);
    } else {
      newCols.push(moved);
    }
    setTempReorderCols(newCols);
  };

  const handleSaveReorder = () => {
    if (onReorderColumns && activeTab !== 'SUMMARY') {
      onReorderColumns(activeTab, tempReorderCols);
    }
    setIsReorderModalOpen(false);
  };

  // Export Gradebook to CSV with UTF-8 BOM
  const handleExportCSV = () => {
    let csv = '\uFEFF';
    csv += `"DANH SÁCH & BẢNG ĐIỂM MÔN TOÁN - LỚP ${classNameTitle || ''}"\n`;
    csv += `"Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}"\n\n`;

    const headers = ['STT', 'Mã HS', 'Họ và tên'];
    columnsHK1.forEach((c) => headers.push(`HK1: ${c.name} (HS${c.weight})`));
    headers.push('ĐTB HK1', 'Xếp loại HK1');
    columnsHK2.forEach((c) => headers.push(`HK2: ${c.name} (HS${c.weight})`));
    headers.push('ĐTB HK2', 'Xếp loại HK2', 'ĐTB CẢ NĂM', 'Xếp loại Cả Năm', 'Ghi chú');

    csv += headers.map((h) => `"${h}"`).join(',') + '\n';

    sortedStudents.forEach((st, idx) => {
      const row: (string | number)[] = [idx + 1, st.studentCode || '', st.fullName];

      // HK1
      const g1 = gradesHK1[st.id]?.scores || {};
      columnsHK1.forEach((c) => {
        row.push(g1[c.id] !== undefined && g1[c.id] !== null ? g1[c.id] : '');
      });
      const avg1 = calculateSemesterAverage(g1, columnsHK1);
      row.push(avg1 !== null ? avg1 : '');
      row.push(avg1 !== null ? getGradeClassification(avg1).label : '');

      // HK2
      const g2 = gradesHK2[st.id]?.scores || {};
      columnsHK2.forEach((c) => {
        row.push(g2[c.id] !== undefined && g2[c.id] !== null ? g2[c.id] : '');
      });
      const avg2 = calculateSemesterAverage(g2, columnsHK2);
      row.push(avg2 !== null ? avg2 : '');
      row.push(avg2 !== null ? getGradeClassification(avg2).label : '');

      // Year
      const yearAvg = calculateYearlyAverage(avg1, avg2);
      row.push(yearAvg !== null ? yearAvg : '');
      row.push(yearAvg !== null ? getGradeClassification(yearAvg).label : '');

      // Note
      const note = gradesHK2[st.id]?.finalNote || gradesHK1[st.id]?.finalNote || '';
      row.push(note);

      csv += row.map((val) => `"${val}"`).join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Bang_Diem_Toan_${classNameTitle || 'Lop'}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Class statistics computation
  const studentAverages = students.map((s) => {
    const avgHK1 = calculateSemesterAverage(gradesHK1[s.id]?.scores, columnsHK1);
    const avgHK2 = calculateSemesterAverage(gradesHK2[s.id]?.scores, columnsHK2);
    const avgYear = calculateYearlyAverage(avgHK1, avgHK2);
    return {
      student: s,
      avgHK1,
      avgHK2,
      avgYear,
      currentAvg: activeTab === 'HK1' ? avgHK1 : activeTab === 'HK2' ? avgHK2 : avgYear,
    };
  });

  const validCurrentAverages = studentAverages
    .map((s) => s.currentAvg)
    .filter((a): a is number => a !== null && !isNaN(a));

  const classAvg = validCurrentAverages.length > 0
    ? Math.round((validCurrentAverages.reduce((a, b) => a + b, 0) / validCurrentAverages.length) * 10) / 10
    : 0;

  const maxScore = validCurrentAverages.length > 0 ? Math.max(...validCurrentAverages) : 0;
  const minScore = validCurrentAverages.length > 0 ? Math.min(...validCurrentAverages) : 0;

  const countGioi = validCurrentAverages.filter((a) => a >= 8.0).length;
  const countKha = validCurrentAverages.filter((a) => a >= 6.5 && a < 8.0).length;
  const countTB = validCurrentAverages.filter((a) => a >= 5.0 && a < 6.5).length;
  const countYeu = validCurrentAverages.filter((a) => a < 5.0).length;

  return (
    <div className="space-y-4">
      {/* Top Controls & Navigation */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              Sổ Điểm Cá Nhân Môn Toán
              <span className="text-xs font-normal text-slate-500">
                (Chuẩn hệ số HS1, HS2, HS3)
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tự động tính điểm trung bình học kì & cả năm theo quy định
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            id="tab-grade-hk1"
            type="button"
            onClick={() => setActiveTab('HK1')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'HK1'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Học Kì 1
          </button>
          <button
            id="tab-grade-hk2"
            type="button"
            onClick={() => setActiveTab('HK2')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'HK2'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Học Kì 2
          </button>
          <button
            id="tab-grade-summary"
            type="button"
            onClick={() => setActiveTab('SUMMARY')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'SUMMARY'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tổng Kết Cả Năm
          </button>
        </div>

        {/* Action buttons & Sync Status */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Live Sync Status Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium">
            {syncStatus === 'saving' ? (
              <span className="flex items-center gap-1 text-amber-600">
                <Cloud className="w-3.5 h-3.5 animate-pulse" />
                <span>Đang lưu...</span>
              </span>
            ) : syncStatus === 'error' ? (
              <span className="flex items-center gap-1 text-rose-600">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Chưa đồng bộ Sheet</span>
              </span>
            ) : syncStatus === 'pending' ? (
              <span className="flex items-center gap-1 text-amber-600">
                <Cloud className="w-3.5 h-3.5" />
                <span>Sắp lưu...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Đã đồng bộ Google Sheets</span>
              </span>
            )}
          </div>

          <button
            id="export-csv-gradebook-btn"
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Tải bảng điểm lớp về máy tính dưới định dạng Excel/CSV tiếng Việt"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">Xuất Excel / CSV</span>
            <span className="sm:hidden">Xuất</span>
          </button>

          <button
            id="toggle-stats-btn"
            type="button"
            onClick={() => setShowStats(!showStats)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border flex items-center gap-1.5 transition-colors ${
              showStats 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>{showStats ? 'Ẩn thống kê' : 'Phổ điểm lớp'}</span>
          </button>

          {activeTab !== 'SUMMARY' && currentColumns.length > 1 && (
            <button
              id="open-reorder-columns-btn"
              type="button"
              onClick={handleOpenReorderModal}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Đổi thứ tự hiển thị các cột điểm"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
              <span>Sắp xếp cột</span>
            </button>
          )}

          {activeTab !== 'SUMMARY' && (
            <button
              id="open-add-column-modal"
              type="button"
              onClick={() => {
                if (!isTeacher) {
                  onRequestLogin();
                  return;
                }
                setIsAddColumnModalOpen(true);
              }}
              className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Thêm cột điểm</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="In bảng điểm"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Class Statistics Overview Panel */}
      {showStats && (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-in fade-in duration-150 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-slate-500 block text-[11px]">ĐTB chung cả lớp</span>
            <span className="text-lg font-bold text-indigo-700 mt-0.5 block">{classAvg}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <span className="text-slate-500 block text-[11px]">Điểm cao nhất</span>
            <span className="text-lg font-bold text-emerald-600 mt-0.5 block">{maxScore}</span>
          </div>
          <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200">
            <span className="text-emerald-700 block text-[11px]">Giỏi (&ge; 8.0)</span>
            <span className="text-lg font-bold text-emerald-800 mt-0.5 block">{countGioi} ({validCurrentAverages.length ? Math.round((countGioi / validCurrentAverages.length) * 100) : 0}%)</span>
          </div>
          <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-200">
            <span className="text-blue-700 block text-[11px]">Khá (6.5 - 7.9)</span>
            <span className="text-lg font-bold text-blue-800 mt-0.5 block">{countKha} ({validCurrentAverages.length ? Math.round((countKha / validCurrentAverages.length) * 100) : 0}%)</span>
          </div>
          <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200">
            <span className="text-amber-700 block text-[11px]">Đạt (5.0 - 6.4)</span>
            <span className="text-lg font-bold text-amber-800 mt-0.5 block">{countTB} ({validCurrentAverages.length ? Math.round((countTB / validCurrentAverages.length) * 100) : 0}%)</span>
          </div>
          <div className="p-3 bg-rose-50/60 rounded-lg border border-rose-200">
            <span className="text-rose-700 block text-[11px]">Chưa đạt (&lt; 5.0)</span>
            <span className="text-lg font-bold text-rose-800 mt-0.5 block">{countYeu} ({validCurrentAverages.length ? Math.round((countYeu / validCurrentAverages.length) * 100) : 0}%)</span>
          </div>
        </div>
      )}

      {/* Gradebook Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab !== 'SUMMARY' ? (
            /* HK1 / HK2 View */
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                  <th className="py-3 px-3 w-10 text-center border-r border-slate-200">STT</th>
                  <th className="py-3 px-3 w-20 border-r border-slate-200">Mã HS</th>
                  <th className="py-3 px-3 w-44 border-r border-slate-200">Họ và tên</th>

                  {/* Dynamic Score Columns */}
                  {currentColumns.map((col, colIdx) => {
                    const weightBadge = col.weight === 1 
                      ? 'bg-blue-50 text-blue-700 border-blue-200' 
                      : col.weight === 2 
                        ? 'bg-purple-50 text-purple-700 border-purple-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200';
                    return (
                      <th
                        key={col.id}
                        className="py-2 px-1 text-center min-w-[85px] max-w-[125px] border-r border-slate-200 group relative select-none"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <span className="truncate max-w-[95px] font-semibold text-slate-800 text-[11px]" title={col.name}>
                            {col.name}
                          </span>
                          <span className={`mt-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold border ${weightBadge}`}>
                            HS{col.weight}
                          </span>
                        </div>

                        {/* Quick Reorder & Delete Column Controls */}
                        {isTeacher && (
                          <div className="flex items-center justify-center gap-0.5 mt-1 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              disabled={colIdx === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveColumn(colIdx, 'left');
                              }}
                              className={`p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors ${
                                colIdx === 0 ? 'invisible pointer-events-none' : 'cursor-pointer'
                              }`}
                              title={`Chuyển cột "${col.name}" sang trái`}
                            >
                              <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onRequestDeleteColumn(activeTab, col);
                              }}
                              className="p-1 rounded text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title={`Xóa cột "${col.name}" (có xác nhận)`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={colIdx === currentColumns.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveColumn(colIdx, 'right');
                              }}
                              className={`p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors ${
                                colIdx === currentColumns.length - 1 ? 'invisible pointer-events-none' : 'cursor-pointer'
                              }`}
                              title={`Chuyển cột "${col.name}" sang phải`}
                            >
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </th>
                    );
                  })}

                  {/* Computed Average Column */}
                  <th className="py-3 px-3 w-20 text-center font-bold text-indigo-900 bg-indigo-50/60 border-r border-slate-200">
                    ĐTB môn
                  </th>
                  <th className="py-3 px-3 w-24 text-center font-bold text-slate-700 border-r border-slate-200">
                    Xếp loại
                  </th>
                  {/* Final Note Column */}
                  <th className="py-3 px-4 min-w-[180px]">
                    Cột ghi chú nhận xét học sinh
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedStudents.map((st, idx) => {
                  const sGrade = currentGrades[st.id] || { scores: {}, finalNote: '' };
                  const avg = calculateSemesterAverage(sGrade.scores, currentColumns);
                  const classification = getGradeClassification(avg);

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2 px-3 text-center text-slate-500 font-medium border-r border-slate-100">
                        {st.stt || idx + 1}
                      </td>
                      <td className="py-2 px-3 font-mono text-slate-600 text-[11px] border-r border-slate-100">
                        {st.studentCode}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-800 border-r border-slate-100">
                        <div className="flex items-center gap-2">
                          {st.avatar ? (
                            <img src={st.avatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {st.fullName.charAt(0)}
                            </div>
                          )}
                          <span className="truncate">{st.fullName}</span>
                        </div>
                      </td>

                      {/* Score Input Cells */}
                      {currentColumns.map((col, colIdx) => {
                        const scoreVal = sGrade.scores[col.id];

                        return (
                          <td
                            key={col.id}
                            className="py-1.5 px-1.5 text-center border-r border-slate-100"
                          >
                            <ScoreInputCell
                              studentId={st.id}
                              columnId={col.id}
                              score={scoreVal}
                              isTeacher={isTeacher}
                              rowIndex={idx}
                              colIndex={colIdx}
                              totalRows={sortedStudents.length}
                              onUpdateScore={(studentId, columnId, score) => {
                                onUpdateScore(activeTab as 'HK1' | 'HK2', studentId, columnId, score);
                              }}
                              onRequestLogin={onRequestLogin}
                            />
                          </td>
                        );
                      })}

                      {/* Average Column */}
                      <td className="py-2 px-3 text-center border-r border-slate-100 bg-indigo-50/30 font-mono font-bold text-xs">
                        <span className={classification.color}>
                          {avg !== null ? avg.toFixed(1) : '—'}
                        </span>
                      </td>

                      {/* Classification Badge */}
                      <td className="py-2 px-3 text-center border-r border-slate-100">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${classification.badgeBg} ${classification.badgeBorder}`}>
                          {classification.label}
                        </span>
                      </td>

                      {/* Final Note Input */}
                      <td className="py-1.5 px-3">
                        <input
                          type="text"
                          value={sGrade.finalNote || ''}
                          onChange={(e) => {
                            if (!isTeacher) {
                              onRequestLogin();
                              return;
                            }
                            onUpdateStudentFinalNote(activeTab, st.id, e.target.value);
                          }}
                          placeholder={isTeacher ? "Thêm nhận xét học tập..." : "Chưa có nhận xét"}
                          disabled={!isTeacher}
                          className="w-full px-2.5 py-1 text-[11px] text-slate-700 bg-transparent hover:bg-slate-50 focus:bg-white rounded border border-transparent focus:border-slate-300 focus:outline-none"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            /* Summary (Cả Năm) View */
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
                  <th className="py-3 px-3 w-10 text-center border-r border-slate-200">STT</th>
                  <th className="py-3 px-3 w-24 border-r border-slate-200">Mã HS</th>
                  <th className="py-3 px-4 border-r border-slate-200">Họ và tên</th>
                  <th className="py-3 px-4 text-center border-r border-slate-200">ĐTB Học kì 1</th>
                  <th className="py-3 px-4 text-center border-r border-slate-200">ĐTB Học kì 2 (x2)</th>
                  <th className="py-3 px-4 text-center font-bold text-indigo-950 bg-indigo-50/80 border-r border-slate-200">
                    ĐTB CẢ NĂM MÔN TOÁN
                  </th>
                  <th className="py-3 px-4 text-center border-r border-slate-200">Xếp loại cả năm</th>
                  <th className="py-3 px-4">Đánh giá chung</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedStudents.map((st, idx) => {
                  const avg1 = calculateSemesterAverage(gradesHK1[st.id]?.scores, columnsHK1);
                  const avg2 = calculateSemesterAverage(gradesHK2[st.id]?.scores, columnsHK2);
                  const yearAvg = calculateYearlyAverage(avg1, avg2);
                  const classification = getGradeClassification(yearAvg);

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-center text-slate-500 font-medium border-r border-slate-100">
                        {st.stt || idx + 1}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 text-[11px] border-r border-slate-100">
                        {st.studentCode}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800 border-r border-slate-100">
                        <div className="flex items-center gap-2">
                          {st.avatar && (
                            <img src={st.avatar} alt="" className="w-6 h-6 rounded-full object-cover shrink-0" />
                          )}
                          <span>{st.fullName}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-semibold text-slate-700 border-r border-slate-100">
                        {avg1 !== null ? avg1.toFixed(1) : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-center font-mono font-semibold text-slate-700 border-r border-slate-100">
                        {avg2 !== null ? avg2.toFixed(1) : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-center bg-indigo-50/40 font-mono font-bold text-sm border-r border-slate-100">
                        <span className={classification.color}>
                          {yearAvg !== null ? yearAvg.toFixed(1) : '—'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-center border-r border-slate-100">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${classification.badgeBg} ${classification.badgeBorder}`}>
                          {classification.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 text-[11px]">
                        {st.note || (yearAvg && yearAvg >= 8.0 ? 'Hoàn thành xuất sắc bộ môn Toán' : 'Đạt yêu cầu')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Column Modal */}
      {isAddColumnModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            id="add-column-modal"
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200"
            role="dialog"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Thêm Cột Điểm Mới</h3>
                  <p className="text-xs text-slate-500">Thêm cho {activeTab === 'HK1' ? 'Học kì 1' : 'Học kì 2'}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddColumnModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateColumn} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên cột điểm <span className="text-rose-500">*</span>
                </label>
                <input
                  id="col-name-input"
                  type="text"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  placeholder="Ví dụ: Kiểm tra 15p số 3, Chuyên cần, ĐG Dự án..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Hệ số điểm (Trọng số)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewColWeight(1)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      newColWeight === 1
                        ? 'border-indigo-600 bg-indigo-50/80 text-indigo-800 font-bold ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-sm font-bold">HS1</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Miệng, 15p, TX</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewColWeight(2)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      newColWeight === 2
                        ? 'border-purple-600 bg-purple-50/80 text-purple-800 font-bold ring-1 ring-purple-600'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-sm font-bold">HS2</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Giữa kì (1 tiết)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewColWeight(3)}
                    className={`p-3 rounded-lg border text-center transition-all ${
                      newColWeight === 3
                        ? 'border-amber-600 bg-amber-50/80 text-amber-800 font-bold ring-1 ring-amber-600'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="text-sm font-bold">HS3</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Cuối học kì</div>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddColumnModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  id="confirm-add-col-btn"
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Thêm cột vào bảng
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Đổi thứ tự sắp xếp cột điểm */}
      {isReorderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                  <ArrowUpDown className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    Sắp xếp thứ tự cột điểm ({activeTab})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Thứ tự từ trên xuống dưới tương ứng từ trái sang phải trên bảng điểm
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsReorderModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2">
              {tempReorderCols.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  Chưa có cột điểm nào để sắp xếp.
                </div>
              ) : (
                tempReorderCols.map((col, idx) => {
                  const weightBadge = col.weight === 1 
                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                    : col.weight === 2 
                      ? 'bg-purple-50 text-purple-700 border-purple-200' 
                      : 'bg-amber-50 text-amber-700 border-amber-200';

                  return (
                    <div
                      key={col.id}
                      className="flex items-center justify-between p-2.5 bg-slate-50 hover:bg-indigo-50/40 rounded-xl border border-slate-200 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-800 truncate" title={col.name}>
                            {col.name}
                          </p>
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold border ${weightBadge}`}>
                            Hệ số {col.weight}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveTempCol(idx, 'up')}
                          className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-0.5 transition-colors ${
                            idx === 0
                              ? 'opacity-30 border-slate-200 text-slate-400 cursor-not-allowed'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 cursor-pointer shadow-2xs'
                          }`}
                          title="Di chuyển lên trên (sang trái)"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={idx === tempReorderCols.length - 1}
                          onClick={() => handleMoveTempCol(idx, 'down')}
                          className={`p-1.5 rounded-lg border text-xs font-medium flex items-center gap-0.5 transition-colors ${
                            idx === tempReorderCols.length - 1
                              ? 'opacity-30 border-slate-200 text-slate-400 cursor-not-allowed'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 cursor-pointer shadow-2xs'
                          }`}
                          title="Di chuyển xuống dưới (sang phải)"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsReorderModalOpen(false)}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                id="save-reorder-cols-btn"
                type="button"
                onClick={handleSaveReorder}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Lưu thứ tự cột
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
