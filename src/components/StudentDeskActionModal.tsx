import React, { useState, useRef, useEffect } from 'react';
import { Student, ScoreColumn, StudentGrade, Gender } from '../types';
import { calculateSemesterAverage, getGradeClassification } from '../utils/gradeCalculations';
import { 
  Star, 
  BookOpen, 
  User, 
  Move, 
  X, 
  Check, 
  Camera, 
  Trash2, 
  RotateCcw, 
  Award, 
  Sparkles,
  Save,
  Phone,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface StudentDeskActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  seatKey: string | null; // e.g. "2-3" or null
  isTeacher: boolean;
  onStartMoveSeat: (keyOrId: string) => void;
  onEvictSeat?: (seatKey: string) => void;
  onUpdateStudent: (id: string, data: Partial<Student>, silent?: boolean) => void;
  // Grade props
  columnsHK1?: ScoreColumn[];
  columnsHK2?: ScoreColumn[];
  gradesHK1?: Record<string, StudentGrade>;
  gradesHK2?: Record<string, StudentGrade>;
  onUpdateScore?: (semester: 'HK1' | 'HK2', studentId: string, columnId: string, score: number | null) => void;
  onUpdateStudentFinalNote?: (semester: 'HK1' | 'HK2', studentId: string, note: string) => void;
}

export const StudentDeskActionModal: React.FC<StudentDeskActionModalProps> = ({
  isOpen,
  onClose,
  student,
  seatKey,
  isTeacher,
  onStartMoveSeat,
  onEvictSeat,
  onUpdateStudent,
  columnsHK1 = [],
  columnsHK2 = [],
  gradesHK1 = {},
  gradesHK2 = {},
  onUpdateScore,
  onUpdateStudentFinalNote,
}) => {
  const [activeTab, setActiveTab] = useState<'POINTS' | 'GRADES' | 'INFO'>('POINTS');
  const [selectedSemester, setSelectedSemester] = useState<'HK1' | 'HK2'>('HK1');

  // Form states for info editing
  const [fullName, setFullName] = useState(student.fullName);
  const [studentCode, setStudentCode] = useState(student.studentCode || '');
  const [gender, setGender] = useState<Gender>(student.gender);
  const [dateOfBirth, setDateOfBirth] = useState(student.dateOfBirth || '');
  const [phoneNumber, setPhoneNumber] = useState(student.phoneNumber || '');
  const [note, setNote] = useState(student.note || '');
  const [avatar, setAvatar] = useState(student.avatar || '');
  const [goodPoints, setGoodPoints] = useState<number>(student.goodPoints || 0);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Notification / visual feedback
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFullName(student.fullName);
    setStudentCode(student.studentCode || '');
    setGender(student.gender);
    setDateOfBirth(student.dateOfBirth || '');
    setPhoneNumber(student.phoneNumber || '');
    setNote(student.note || '');
    setAvatar(student.avatar || '');
    setGoodPoints(student.goodPoints || 0);
    setShowResetConfirm(false);
  }, [student.id, student.fullName, student.goodPoints, student.note, student.avatar]);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 2500);
  };

  // Good Points Quick Actions
  const handleAdjustPoints = (delta: number) => {
    if (!isTeacher) return;
    setGoodPoints((prevPoints) => {
      const current = typeof prevPoints === 'number' && !isNaN(prevPoints) ? prevPoints : (student.goodPoints || 0);
      const nextPoints = current + delta;
      onUpdateStudent(student.id, { goodPoints: nextPoints }, true);
      showFeedback(delta > 0 ? `+${delta} Điểm tốt!` : `${delta} Điểm tốt!`);
      return nextPoints;
    });
  };

  const handleSetPoints = (pts: number) => {
    if (!isTeacher) return;
    const finalPts = isNaN(pts) ? 0 : pts;
    setGoodPoints(finalPts);
    onUpdateStudent(student.id, { goodPoints: finalPts }, true);
    showFeedback(`Đã đổi điểm tốt thành ${finalPts}`);
  };

  // Grade Book calculations
  const activeCols = selectedSemester === 'HK1' ? columnsHK1 : columnsHK2;
  const activeGrades = selectedSemester === 'HK1' ? gradesHK1 : gradesHK2;
  const studentGradeObj = activeGrades[student.id] || { scores: {}, finalNote: '' };
  const studentScores = studentGradeObj.scores || {};
  const semesterAverage = calculateSemesterAverage(studentScores, activeCols);
  const classification = getGradeClassification(semesterAverage);

  const handleScoreInput = (columnId: string, rawVal: string) => {
    if (!isTeacher || !onUpdateScore) return;
    const clean = rawVal.replace(',', '.').trim();
    if (clean === '') {
      onUpdateScore(selectedSemester, student.id, columnId, null);
      return;
    }
    const num = parseFloat(clean);
    if (!isNaN(num) && num >= 0 && num <= 10) {
      onUpdateScore(selectedSemester, student.id, columnId, Math.round(num * 10) / 10);
    }
  };

  // Photo upload handler with image resize/compress
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 300;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > MAX_DIM) {
            h = Math.round((h * MAX_DIM) / w);
            w = MAX_DIM;
          }
        } else {
          if (h > MAX_DIM) {
            w = Math.round((w * MAX_DIM) / h);
            h = MAX_DIM;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
          setAvatar(compressedDataUrl);
          onUpdateStudent(student.id, { avatar: compressedDataUrl }, true);
          showFeedback('Đã cập nhật ảnh thẻ!');
        }
      };
      img.src = loadEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    onUpdateStudent(student.id, {
      fullName: fullName.trim(),
      studentCode: studentCode.trim(),
      gender,
      dateOfBirth: dateOfBirth.trim(),
      phoneNumber: phoneNumber.trim(),
      note: note.trim(),
      avatar: avatar || undefined,
      goodPoints,
    });
    showFeedback('Đã lưu thông tin học sinh!');
  };

  const deskPositionLabel = seatKey
    ? `Hàng ${seatKey.split('-')[0]} - Dãy ${seatKey.split('-')[1]}`
    : 'Chưa xếp chỗ';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white relative flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative group">
              {avatar ? (
                <img 
                  src={avatar} 
                  alt={fullName} 
                  className="w-13 h-13 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-indigo-400/80 shadow-md"
                />
              ) : (
                <div className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-bold text-lg border-2 border-white/20 shadow-md ${
                  gender === 'Nữ' ? 'bg-pink-600 text-white' : 'bg-blue-600 text-white'
                }`}>
                  {fullName.split(' ').slice(-1)[0]?.charAt(0) || 'H'}
                </div>
              )}
              {isTeacher && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-md border border-white text-xs"
                  title="Thay đổi ảnh thẻ"
                >
                  <Camera className="w-3 h-3" />
                </button>
              )}
              <input 
                ref={fileInputRef} 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handlePhotoUpload} 
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  {fullName}
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  gender === 'Nữ' ? 'bg-pink-500/20 border-pink-400 text-pink-200' : 'bg-blue-500/20 border-blue-400 text-blue-200'
                }`}>
                  {gender}
                </span>
              </div>
              <p className="text-xs text-indigo-200/80 mt-0.5 font-mono">
                {studentCode} • {dateOfBirth || 'Chưa có ngày sinh'}
              </p>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-300 font-medium">
                <span className="bg-white/10 px-2 py-0.5 rounded-md border border-white/10">
                  📍 {deskPositionLabel}
                </span>
                <span className={`px-2 py-0.5 rounded-md border font-bold flex items-center gap-1 ${
                  goodPoints > 0 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40' 
                    : goodPoints < 0 
                    ? 'bg-rose-500/20 text-rose-300 border-rose-400/40' 
                    : 'bg-slate-700/50 text-slate-300 border-slate-600'
                }`}>
                  <Star className="w-3 h-3 fill-current" />
                  {goodPoints > 0 ? `+${goodPoints}` : goodPoints} Điểm tốt
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>

          {feedbackMessage && (
            <div className="absolute top-2 right-12 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 animate-in fade-in duration-150">
              <Check className="w-3.5 h-3.5" />
              {feedbackMessage}
            </div>
          )}
        </div>

        {/* QUICK SEAT ACTIONS BAR */}
        {isTeacher && (
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onStartMoveSeat(seatKey || student.id);
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
                title="Bắt đầu chọn vị trí mới để chuyển học sinh đến"
              >
                <Move className="w-3.5 h-3.5" />
                <span>Di chuyển / Đổi chỗ</span>
              </button>

              {seatKey && onEvictSeat && (
                <button
                  type="button"
                  onClick={() => {
                    onEvictSeat(seatKey);
                    onClose();
                  }}
                  className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-600 border border-slate-200 hover:border-rose-300 text-xs font-medium rounded-lg transition-all"
                  title="Cho học sinh rời bàn ra danh sách chưa xếp chỗ"
                >
                  Rời khỏi chỗ
                </button>
              )}
            </div>

            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Nhấp "Di chuyển" rồi nhấp bàn khác để hoán đổi
            </span>
          </div>
        )}

        {/* TABS NAVIGATION */}
        <div className="flex border-b border-slate-200 bg-white px-4">
          <button
            type="button"
            onClick={() => setActiveTab('POINTS')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'POINTS'
                ? 'border-amber-500 text-amber-600 bg-amber-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Star className={`w-4 h-4 ${activeTab === 'POINTS' ? 'fill-amber-500 text-amber-500' : ''}`} />
            <span>Điểm tốt & Khen thưởng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('GRADES')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'GRADES'
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Nhập điểm môn học</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('INFO')}
            className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'INFO'
                ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Thông tin & Ghi chú</span>
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 text-xs space-y-4">
          {/* TAB 1: GOOD POINTS */}
          {activeTab === 'POINTS' && (
            <div className="space-y-4">
              {/* Big points showcase card */}
              <div className="bg-gradient-to-br from-amber-50/60 to-orange-50/60 border border-amber-200 rounded-xl p-4 text-center">
                <span className="text-xs font-semibold text-amber-900 block mb-1">
                  Điểm Tốt Hiện Tại
                </span>
                <div className="flex items-center justify-center gap-2 my-2">
                  <div className={`text-4xl sm:text-5xl font-black px-6 py-2 rounded-2xl border shadow-xs inline-flex items-center gap-2 ${
                    goodPoints > 0
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : goodPoints < 0
                      ? 'bg-rose-50 text-rose-700 border-rose-300'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}>
                    <Star className={`w-8 h-8 ${goodPoints > 0 ? 'text-amber-500 fill-amber-400' : 'text-slate-400'}`} />
                    <span>{goodPoints > 0 ? `+${goodPoints}` : goodPoints}</span>
                  </div>
                </div>
                <p className="text-[11px] text-amber-800/80">
                  {goodPoints > 0 
                    ? 'Học sinh có tinh thần học tập tích cực, nhiều thành tích tốt!' 
                    : goodPoints < 0 
                    ? 'Cần nhắc nhở và đôn đốc học sinh cố gắng hơn.' 
                    : 'Mặc định ban đầu (0 điểm). Nhấp nút bên dưới để cộng hoặc trừ.'}
                </p>
              </div>

              {/* Quick action buttons */}
              {isTeacher ? (
                <div className="space-y-3">
                  <span className="font-bold text-slate-700 block">
                    Thao tác nhanh cho giáo viên:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleAdjustPoints(1)}
                      className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold flex flex-col items-center justify-center gap-1 shadow-2xs transition-all active:scale-95"
                    >
                      <span className="text-base font-black">+1 Điểm tốt</span>
                      <span className="text-[10px] text-emerald-600 font-normal">Phát biểu, tương tác</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAdjustPoints(2)}
                      className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold flex flex-col items-center justify-center gap-1 shadow-2xs transition-all active:scale-95"
                    >
                      <span className="text-base font-black">+2 Xuất sắc</span>
                      <span className="text-[10px] text-emerald-600 font-normal">Làm bài tốt, lên bảng</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAdjustPoints(5)}
                      className="p-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold flex flex-col items-center justify-center gap-1 shadow-2xs transition-all active:scale-95"
                    >
                      <span className="text-base font-black">+5 Thành tích</span>
                      <span className="text-[10px] text-amber-700 font-normal">Đặc biệt xuất sắc</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAdjustPoints(-1)}
                      className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl font-bold flex flex-col items-center justify-center gap-1 shadow-2xs transition-all active:scale-95"
                    >
                      <span className="text-base font-black">-1 Nhắc nhở</span>
                      <span className="text-[10px] text-rose-600 font-normal">Nói chuyện, mất tập trung</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAdjustPoints(-2)}
                      className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl font-bold flex flex-col items-center justify-center gap-1 shadow-2xs transition-all active:scale-95"
                    >
                      <span className="text-base font-black">-2 Vi phạm</span>
                      <span className="text-[10px] text-rose-600 font-normal">Không làm bài tập</span>
                    </button>

                    {showResetConfirm ? (
                      <div className="col-span-2 sm:col-span-3 p-3 bg-amber-50 border-2 border-amber-300 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-2.5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-center gap-2 text-amber-950 text-xs font-semibold">
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Xác nhận xóa toàn bộ điểm của <strong>{student.fullName}</strong> và đặt lại về <strong>0</strong>?</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            id="btn-confirm-reset-good-points"
                            type="button"
                            onClick={() => {
                              handleSetPoints(0);
                              setShowResetConfirm(false);
                            }}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center gap-1 active:scale-95 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Xác nhận về 0
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowResetConfirm(false)}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            Hủy
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        id="btn-reset-good-points"
                        type="button"
                        onClick={() => {
                          if (goodPoints === 0) {
                            showFeedback('Điểm hiện tại đã là 0');
                          } else {
                            setShowResetConfirm(true);
                          }
                        }}
                        className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold flex flex-col items-center justify-center gap-1 shadow-2xs transition-all active:scale-95 cursor-pointer"
                      >
                        <span className="text-base font-black flex items-center gap-1">
                          <RotateCcw className="w-4 h-4 text-slate-400" />
                          Đặt lại về 0
                        </span>
                        <span className="text-[10px] text-slate-500 font-normal">Xác nhận trước khi xóa</span>
                      </button>
                    )}
                  </div>

                  {/* Manual Stepper */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Nhập số điểm tùy ý:</span>
                    <div className="flex items-center gap-2">
                      <button
                        id="btn-decrease-good-points"
                        type="button"
                        onClick={() => handleAdjustPoints(-1)}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 border border-slate-300 font-black text-sm flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                        title="Giảm 1 điểm (-1)"
                      >
                        -
                      </button>
                      <input
                        id="input-custom-good-points"
                        type="number"
                        value={goodPoints}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '') {
                            setGoodPoints(0);
                            return;
                          }
                          const num = parseInt(val, 10);
                          if (!isNaN(num)) {
                            handleSetPoints(num);
                          }
                        }}
                        className="w-16 text-center py-1 bg-white border border-slate-300 rounded-lg font-bold text-xs focus:ring-2 focus:ring-amber-400 focus:border-amber-400 outline-hidden"
                      />
                      <button
                        id="btn-increase-good-points"
                        type="button"
                        onClick={() => handleAdjustPoints(1)}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 border border-slate-300 font-black text-sm flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                        title="Tăng 1 điểm (+1)"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 text-slate-600 rounded-xl text-center">
                  Đăng nhập quyền Giáo viên để có thể cộng hoặc trừ điểm tốt cho học sinh.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GRADES */}
          {activeTab === 'GRADES' && (
            <div className="space-y-4">
              {/* Semester toggle */}
              <div className="flex items-center justify-between">
                <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSelectedSemester('HK1')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                      selectedSemester === 'HK1'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Học Kỳ 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSemester('HK2')}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                      selectedSemester === 'HK2'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Học Kỳ 2
                  </button>
                </div>

                {/* Live Average calculation */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">ĐTB {selectedSemester}:</span>
                  <span className="font-mono font-black text-sm px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {semesterAverage !== null ? semesterAverage.toFixed(1) : '—'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${classification.badgeBg}`}>
                    {classification.label}
                  </span>
                </div>
              </div>

              {/* Score columns grid */}
              {activeCols.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeCols.map((col) => {
                    const currentScore = studentScores[col.id];
                    return (
                      <div
                        key={col.id}
                        className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="font-bold text-slate-800">{col.name}</div>
                          <span className="text-[10px] text-slate-500 font-medium">
                            Hệ số {col.weight} (HS{col.weight})
                          </span>
                        </div>

                        {isTeacher ? (
                          <input
                            type="text"
                            defaultValue={currentScore !== undefined && currentScore !== null ? currentScore : ''}
                            key={`${selectedSemester}-${student.id}-${col.id}-${currentScore}`}
                            onBlur={(e) => handleScoreInput(col.id, e.target.value)}
                            placeholder="0 - 10"
                            className="w-16 px-2 py-1.5 text-center font-mono font-bold text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        ) : (
                          <span className="font-mono font-bold text-xs px-2 py-1 bg-white border border-slate-200 rounded-lg">
                            {currentScore !== undefined && currentScore !== null ? currentScore : '—'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 bg-slate-50 rounded-xl">
                  Chưa có cột điểm nào được tạo trong {selectedSemester}. Vào tab Sổ Điểm để thêm cột.
                </div>
              )}

              {/* Final Note for Semester */}
              {isTeacher && onUpdateStudentFinalNote && (
                <div className="pt-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nhận xét / Đánh giá học tập {selectedSemester}
                  </label>
                  <input
                    type="text"
                    defaultValue={studentGradeObj.finalNote || ''}
                    key={`${selectedSemester}-${student.id}-note-${studentGradeObj.finalNote}`}
                    onBlur={(e) => onUpdateStudentFinalNote(selectedSemester, student.id, e.target.value.trim())}
                    placeholder="Ví dụ: Nắm chắc kiến thức, cần rèn thêm kỹ năng tính toán..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INFO & NOTES */}
          {activeTab === 'INFO' && (
            <form onSubmit={handleSaveInfo} className="space-y-3">
              {/* Note / Characteristic */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Đặc điểm nhận dạng, học lực & ghi chú chỗ ngồi
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={!isTeacher}
                  rows={2}
                  placeholder="Ví dụ: Cận thị nặng cần ngồi bàn đầu; Học rất tốt môn Toán; Hay mất tập trung..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-xs leading-relaxed disabled:opacity-70"
                />
                {isTeacher && (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <span className="text-[10px] text-slate-500 self-center">Gợi ý nhanh:</span>
                    {[
                      '👁️ Cận thị (ngồi đầu)',
                      '⭐ Cán sự lớp',
                      '✨ Học tốt môn Toán',
                      '⚠️ Cần chú ý trật tự',
                      '👂 Khó nghe',
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => {
                          const newNote = note ? `${note}; ${tag}` : tag;
                          setNote(newNote);
                        }}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200 rounded-md text-[10px] text-slate-600 transition-colors"
                      >
                        + {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Student personal details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Họ và tên</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={!isTeacher}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs disabled:opacity-70"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã học sinh</label>
                  <input
                    type="text"
                    value={studentCode}
                    onChange={(e) => setStudentCode(e.target.value)}
                    disabled={!isTeacher}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono disabled:opacity-70"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giới tính</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                    disabled={!isTeacher}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs disabled:opacity-70"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày sinh</label>
                  <input
                    type="text"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    disabled={!isTeacher}
                    placeholder="DD/MM/YYYY"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono disabled:opacity-70"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Số điện thoại liên hệ</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    disabled={!isTeacher}
                    placeholder="0914xxxxxx"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono disabled:opacity-70"
                  />
                </div>
              </div>

              {isTeacher && (
                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu thông tin học sinh</span>
                  </button>
                </div>
              )}
            </form>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            Học sinh #{student.stt || '—'} trong danh sách lớp
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
