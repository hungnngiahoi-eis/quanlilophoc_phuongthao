import React, { useState, useId } from 'react';
import { Student, Gender } from '../types';
import { 
  UserPlus, 
  FileSpreadsheet, 
  Search, 
  Trash2, 
  Edit3, 
  Camera, 
  Upload, 
  UserCheck, 
  Users, 
  X, 
  Check, 
  Filter,
  Star
} from 'lucide-react';

interface StudentListProps {
  students: Student[];
  onAddStudent: (student: Omit<Student, 'id'>) => void;
  onUpdateStudent: (id: string, data: Partial<Student>, silent?: boolean) => void;
  onRequestDeleteStudent: (student: Student) => void;
  onImportStudents: (newStudents: Omit<Student, 'id'>[]) => void;
  isTeacher: boolean;
  onRequestLogin: () => void;
}

export const StudentList: React.FC<StudentListProps> = ({
  students,
  onAddStudent,
  onUpdateStudent,
  onRequestDeleteStudent,
  onImportStudents,
  isTeacher,
  onRequestLogin,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [genderFilter, setGenderFilter] = useState<'All' | 'Nam' | 'Nữ'>('All');
  
  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [viewingPhotoStudent, setViewingPhotoStudent] = useState<Student | null>(null);

  // Excel paste state
  const [excelRawText, setExcelRawText] = useState('');
  const [parsedExcelRows, setParsedExcelRows] = useState<Array<Omit<Student, 'id'>>>([]);
  const [excelError, setExcelError] = useState('');

  // Add / Edit form state
  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formGender, setFormGender] = useState<Gender>('Nam');
  const [formDob, setFormDob] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formAvatar, setFormAvatar] = useState('');
  const [formGoodPoints, setFormGoodPoints] = useState(0);

  const photoInputId = useId();
  const editPhotoInputId = useId();

  // Filter students (sorted by STT)
  const sortedStudents = [...students].sort((a, b) => {
    const numA = parseInt(String(a.stt), 10);
    const numB = parseInt(String(b.stt), 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return (a.fullName || '').localeCompare(b.fullName || '');
  });

  const filteredStudents = sortedStudents.filter((s) => {
    const matchSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.studentCode && s.studentCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.note && s.note.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchGender = genderFilter === 'All' || s.gender === genderFilter;
    return matchSearch && matchGender;
  });

  const countMale = students.filter(s => s.gender === 'Nam').length;
  const countFemale = students.filter(s => s.gender === 'Nữ').length;

  const openAddModal = () => {
    if (!isTeacher) {
      onRequestLogin();
      return;
    }
    const nextStt = students.length + 1;
    setFormName('');
    setFormCode(`HS-${String(nextStt).padStart(2, '0')}`);
    setFormGender('Nam');
    setFormDob('');
    setFormNote('');
    setFormAvatar('');
    setFormGoodPoints(0);
    setIsAddModalOpen(true);
  };

  const openEditModal = (st: Student) => {
    if (!isTeacher) {
      onRequestLogin();
      return;
    }
    setEditingStudent(st);
    setFormName(st.fullName);
    setFormCode(st.studentCode || '');
    setFormGender(st.gender);
    setFormDob(st.dateOfBirth);
    setFormNote(st.note || '');
    setFormAvatar(st.avatar || '');
    setFormGoodPoints(st.goodPoints || 0);
  };

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingStudent) {
      onUpdateStudent(editingStudent.id, {
        fullName: formName.trim(),
        studentCode: formCode.trim(),
        gender: formGender,
        dateOfBirth: formDob.trim(),
        note: formNote.trim(),
        goodPoints: formGoodPoints,
        avatar: formAvatar || undefined,
      });
      setEditingStudent(null);
    } else {
      const nextStt = students.length + 1;
      onAddStudent({
        stt: nextStt,
        studentCode: formCode.trim() || `HS-${String(nextStt).padStart(2, '0')}`,
        fullName: formName.trim(),
        gender: formGender,
        dateOfBirth: formDob.trim() || '01/01/2009',
        note: formNote.trim(),
        goodPoints: formGoodPoints,
        avatar: formAvatar || undefined,
      });
      setIsAddModalOpen(false);
    }
  };

  // Image Upload handler (compress to lightweight Base64 JPEG ~15KB)
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước ảnh quá lớn (tối đa 5MB). Vui lòng chọn ảnh nhẹ hơn.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        if (!dataUrl) return;

        // Resize image to max 200x200 for fast syncing across devices
        const img = new Image();
        img.onload = () => {
          const maxDim = 200;
          let w = img.width;
          let h = img.height;
          if (w > h && w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const compressed = canvas.toDataURL('image/jpeg', 0.8);
            setFormAvatar(compressed);
          } else {
            setFormAvatar(dataUrl);
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  // Smart Excel parser
  const handleParseExcelText = (text: string) => {
    setExcelRawText(text);
    setExcelError('');
    if (!text.trim()) {
      setParsedExcelRows([]);
      return;
    }

    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    const parsed: Array<Omit<Student, 'id'>> = [];
    let startStt = students.length + 1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Split by tab (standard copy from Excel/Sheets) or comma/semicolon
      let parts = line.split('\t');
      if (parts.length === 1) {
        parts = line.split(',');
      }
      if (parts.length === 1) {
        parts = line.split(';');
      }

      const cleanParts = parts.map(p => p.trim());
      // Check if header row
      const firstCellLower = cleanParts[0].toLowerCase();
      if (
        firstCellLower.includes('stt') || 
        firstCellLower.includes('họ') || 
        firstCellLower.includes('tên') || 
        firstCellLower.includes('mã')
      ) {
        continue;
      }

      let name = '';
      let gender: Gender = 'Nam';
      let dob = '';
      let note = '';
      let code = '';

      if (cleanParts.length === 1) {
        name = cleanParts[0];
      } else if (cleanParts.length === 2) {
        // [STT or Code, Name] OR [Name, Gender]
        if (!isNaN(Number(cleanParts[0]))) {
          name = cleanParts[1];
        } else {
          name = cleanParts[0];
          gender = cleanParts[1].toLowerCase().includes('nữ') || cleanParts[1].toLowerCase() === 'f' ? 'Nữ' : 'Nam';
        }
      } else if (cleanParts.length >= 3) {
        // Typical: [STT, Name, Gender, DOB, Note] OR [Name, Gender, DOB, Note]
        if (!isNaN(Number(cleanParts[0]))) {
          // Has STT at index 0
          name = cleanParts[1];
          const gStr = (cleanParts[2] || '').toLowerCase();
          gender = gStr.includes('nữ') || gStr === 'f' || gStr === 'nu' ? 'Nữ' : 'Nam';
          dob = cleanParts[3] || '';
          note = cleanParts.slice(4).join(' ');
        } else {
          name = cleanParts[0];
          const gStr = (cleanParts[1] || '').toLowerCase();
          gender = gStr.includes('nữ') || gStr === 'f' || gStr === 'nu' ? 'Nữ' : 'Nam';
          dob = cleanParts[2] || '';
          note = cleanParts.slice(3).join(' ');
        }
      }

      if (name) {
        code = `HS-${String(startStt).padStart(2, '0')}`;
        parsed.push({
          stt: startStt,
          studentCode: code,
          fullName: name,
          gender,
          dateOfBirth: dob || 'Chưa có',
          note: note || '',
        });
        startStt++;
      }
    }

    if (parsed.length === 0) {
      setExcelError('Không tìm thấy dữ liệu hợp lệ. Vui lòng copy các cột Họ tên từ Excel và dán lại.');
    }
    setParsedExcelRows(parsed);
  };

  const handleConfirmImport = () => {
    if (parsedExcelRows.length === 0) return;
    onImportStudents(parsedExcelRows);
    setExcelRawText('');
    setParsedExcelRows([]);
    setIsExcelModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Stats */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              Danh Sách Học Sinh Lớp
              <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-full">
                {students.length} học sinh
              </span>
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              <span>Nam: <strong className="text-slate-700">{countMale}</strong></span>
              <span>•</span>
              <span>Nữ: <strong className="text-slate-700">{countFemale}</strong></span>
              <span>•</span>
              <span>Đặc điểm: <strong className="text-indigo-600">{students.filter(s => !!s.note).length} có ghi chú</strong></span>
            </div>
          </div>
        </div>

        {/* Action buttons (chỉ giáo viên mới thấy các nút thêm / dán) */}
        {isTeacher && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="open-excel-import-btn"
              type="button"
              onClick={() => setIsExcelModalOpen(true)}
              className="px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Dán từ Excel / Sheets</span>
            </button>

            <button
              id="open-add-student-btn"
              type="button"
              onClick={openAddModal}
              className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Thêm học sinh</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            id="student-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên học sinh, mã số hoặc ghi chú nhận dạng..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white p-1 border border-slate-200 rounded-lg text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <button
              id="filter-gender-all"
              type="button"
              onClick={() => setGenderFilter('All')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                genderFilter === 'All' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Tất cả
            </button>
            <button
              id="filter-gender-nam"
              type="button"
              onClick={() => setGenderFilter('Nam')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                genderFilter === 'Nam' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Nam
            </button>
            <button
              id="filter-gender-nu"
              type="button"
              onClick={() => setGenderFilter('Nữ')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                genderFilter === 'Nữ' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Nữ
            </button>
          </div>
        </div>
      </div>

      {/* Main Student Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 w-12 text-center">STT</th>
                <th className="py-3 px-3 w-16 text-center">Ảnh thẻ</th>
                <th className="py-3 px-3 w-24">Mã HS</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-3 w-20 text-center">Giới tính</th>
                <th className="py-3 px-3 w-28">Ngày sinh</th>
                <th className="py-3 px-3 w-32 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                    <span>Điểm tốt</span>
                  </div>
                </th>
                <th className="py-3 px-4">Đặc điểm, nhận dạng & ghi chú</th>
                {isTeacher && <th className="py-3 px-3 w-24 text-center">Thao tác</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((st, idx) => (
                  <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-2.5 px-3 text-center font-medium text-slate-500">
                      {st.stt || idx + 1}
                    </td>

                    {/* Avatar Cell */}
                    <td className="py-2.5 px-3 text-center">
                      <div className="relative inline-block group">
                        {st.avatar ? (
                          <img
                            src={st.avatar}
                            alt={st.fullName}
                            onClick={() => setViewingPhotoStudent(st)}
                            className="w-9 h-9 rounded-full object-cover border border-slate-300 cursor-pointer shadow-2xs group-hover:ring-2 group-hover:ring-indigo-400 transition-all"
                          />
                        ) : (
                          <div 
                            onClick={() => {
                              if (isTeacher) openEditModal(st);
                            }}
                            className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-2xs border ${
                              isTeacher ? 'cursor-pointer' : ''
                            } ${
                              st.gender === 'Nữ'
                                ? 'bg-pink-100 text-pink-700 border-pink-200'
                                : 'bg-blue-100 text-blue-700 border-blue-200'
                            }`}
                            title={isTeacher ? "Nhấn để thêm ảnh thẻ" : st.fullName}
                          >
                            {st.fullName.split(' ').slice(-1)[0]?.charAt(0) || 'H'}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-mono text-slate-600 font-medium">
                      {st.studentCode}
                    </td>

                    <td className="py-2.5 px-4 font-semibold text-slate-800">
                      {st.fullName}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        st.gender === 'Nữ' 
                          ? 'bg-pink-50 text-pink-700 border border-pink-200' 
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        {st.gender}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                      {st.dateOfBirth}
                    </td>

                    {/* Điểm tốt (+ / -) */}
                    <td className="py-2.5 px-3 text-center">
                      {isTeacher ? (
                        <div className="inline-flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200 shadow-2xs">
                          <button
                            id={`decrease-points-${st.id}`}
                            type="button"
                            onClick={() => onUpdateStudent(st.id, { goodPoints: (st.goodPoints || 0) - 1 }, true)}
                            className="w-6 h-6 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-300 font-bold transition-all shadow-2xs active:scale-90 text-xs"
                            title="Giảm 1 điểm (-1)"
                          >
                            -
                          </button>
                          <span
                            className={`min-w-[32px] text-center font-black text-xs px-1.5 py-0.5 rounded-md border ${
                              (st.goodPoints || 0) > 0
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-300'
                                : (st.goodPoints || 0) < 0
                                ? 'text-rose-700 bg-rose-50 border-rose-300'
                                : 'text-slate-600 bg-white border-slate-200'
                            }`}
                            title={`Điểm tốt hiện tại: ${(st.goodPoints || 0) > 0 ? `+${st.goodPoints}` : (st.goodPoints || 0)}`}
                          >
                            {(st.goodPoints || 0) > 0 ? `+${st.goodPoints}` : (st.goodPoints || 0)}
                          </span>
                          <button
                            id={`increase-points-${st.id}`}
                            type="button"
                            onClick={() => onUpdateStudent(st.id, { goodPoints: (st.goodPoints || 0) + 1 }, true)}
                            className="w-6 h-6 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-300 font-bold transition-all shadow-2xs active:scale-90 text-xs"
                            title="Tăng 1 điểm (+1)"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <span
                          className={`inline-block min-w-[30px] text-center font-bold text-xs px-2 py-0.5 rounded-full border ${
                            (st.goodPoints || 0) > 0
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-300'
                              : (st.goodPoints || 0) < 0
                              ? 'text-rose-700 bg-rose-50 border-rose-300'
                              : 'text-slate-500 bg-slate-50 border-slate-200'
                          }`}
                        >
                          {(st.goodPoints || 0) > 0 ? `+${st.goodPoints}` : (st.goodPoints || 0)}
                        </span>
                      )}
                    </td>

                    {/* Characteristic / Note */}
                    <td className="py-2.5 px-4">
                      {st.note ? (
                        <div className="flex items-center gap-1.5 text-slate-700 bg-amber-50/70 text-amber-900 border border-amber-200/80 px-2.5 py-1 rounded-md text-[11px]">
                          <span>{st.note}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">— Chưa có ghi chú —</span>
                      )}
                    </td>

                    {/* Action buttons (chỉ giáo viên mới có thể sửa / xóa) */}
                    {isTeacher && (
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            id={`edit-student-${st.id}`}
                            type="button"
                            onClick={() => openEditModal(st)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="Sửa thông tin học sinh"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`delete-student-${st.id}`}
                            type="button"
                            onClick={() => onRequestDeleteStudent(st)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Xóa học sinh (có xác nhận)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isTeacher ? 9 : 8} className="py-8 text-center text-slate-400">
                    {searchTerm ? 'Không tìm thấy học sinh phù hợp với từ khóa.' : 'Chưa có học sinh nào trong lớp.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {(isAddModalOpen || editingStudent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            id="student-form-modal"
            className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200"
            role="dialog"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    {editingStudent ? 'Chỉnh Sửa Thông Tin Học Sinh' : 'Thêm Học Sinh Mới'}
                  </h3>
                  <p className="text-xs text-slate-500">Cập nhật họ tên, ảnh thẻ và ghi chú nhận dạng</p>
                </div>
              </div>
              <button
                id="close-student-form-btn"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingStudent(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="mt-4 space-y-3.5 text-xs">
              <div className="flex gap-4 items-start">
                {/* Photo upload avatar preview */}
                <div className="flex flex-col items-center gap-1.5">
                  <label className="font-semibold text-slate-700">Ảnh thẻ</label>
                  <div className="relative group w-20 h-24 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center overflow-hidden">
                    {formAvatar ? (
                      <img src={formAvatar} alt="Ảnh thẻ" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-2 text-slate-400 flex flex-col items-center">
                        <Camera className="w-5 h-5 mb-1" />
                        <span className="text-[10px]">Tải ảnh</span>
                      </div>
                    )}
                    <label 
                      htmlFor={photoInputId} 
                      className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity"
                    >
                      <Upload className="w-4 h-4" />
                    </label>
                  </div>
                  <input
                    id={photoInputId}
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  {formAvatar && (
                    <button
                      type="button"
                      onClick={() => setFormAvatar('')}
                      className="text-[10px] text-rose-600 hover:underline"
                    >
                      Xóa ảnh
                    </button>
                  )}
                </div>

                {/* Main fields */}
                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Họ và tên học sinh <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="student-name-input"
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="Ví dụ: Nguyễn Hoàng An"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs"
                      required
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Mã học sinh</label>
                      <input
                        type="text"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value)}
                        placeholder="Ví dụ: HS-01"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Giới tính</label>
                      <select
                        value={formGender}
                        onChange={(e) => setFormGender(e.target.value as Gender)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                      >
                        <option value="Nam">Nam</option>
                        <option value="Nữ">Nữ</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Ngày sinh</label>
                      <input
                        type="text"
                        value={formDob}
                        onChange={(e) => setFormDob(e.target.value)}
                        placeholder="DD/MM/YYYY (Ví dụ: 15/03/2009)"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                        <span>Điểm tốt</span>
                      </label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setFormGoodPoints((prev) => prev - 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-slate-300 font-bold text-sm transition-colors active:scale-95"
                          title="Giảm 1 điểm"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={formGoodPoints}
                          onChange={(e) => setFormGoodPoints(parseInt(e.target.value, 10) || 0)}
                          className={`w-16 text-center py-1.5 bg-slate-50 border rounded-lg font-black text-xs ${
                            formGoodPoints > 0 
                              ? 'text-emerald-700 border-emerald-300 bg-emerald-50' 
                              : formGoodPoints < 0 
                              ? 'text-rose-700 border-rose-300 bg-rose-50' 
                              : 'text-slate-700 border-slate-300'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setFormGoodPoints((prev) => prev + 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 border border-slate-300 font-bold text-sm transition-colors active:scale-95"
                          title="Tăng 1 điểm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Characteristic / Identification notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Đặc điểm nhận dạng, học lực & ghi chú giáo viên
                </label>
                <textarea
                  id="student-note-input"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  rows={3}
                  placeholder="Ví dụ: Cận thị nặng cần ngồi bàn đầu; Học rất tốt phần Hình học không gian; Hay mất tập trung khi làm đại số..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingStudent(null);
                  }}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
                >
                  Hủy bỏ
                </button>
                <button
                  id="save-student-submit-btn"
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  {editingStudent ? 'Cập nhật học sinh' : 'Lưu học sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Smart Excel Import Modal */}
      {isExcelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div 
            id="excel-import-modal"
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200"
            role="dialog"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">Nhập Danh Sách Từ Excel / Google Sheets</h3>
                  <p className="text-xs text-slate-500">Copy các ô từ bảng tính và dán trực tiếp vào ô bên dưới</p>
                </div>
              </div>
              <button
                id="close-excel-modal-btn"
                onClick={() => setIsExcelModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-lg text-emerald-900 leading-relaxed">
                <span className="font-bold block mb-1">📋 Mẹo sao chép nhanh:</span>
                Mở file Excel hoặc Google Sheet của thầy/cô, quét chọn danh sách học sinh (cột <strong>Họ và tên</strong>, có thể kèm <strong>Giới tính, Ngày sinh, Ghi chú</strong>), nhấn <strong>Ctrl + C</strong> rồi dán (<strong>Ctrl + V</strong>) vào ô bên dưới. Hệ thống sẽ tự động bóc tách từng dòng!
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Vùng dán dữ liệu (Paste here)
                </label>
                <textarea
                  id="excel-paste-textarea"
                  value={excelRawText}
                  onChange={(e) => handleParseExcelText(e.target.value)}
                  rows={6}
                  placeholder={`Nguyễn Hoàng An\tNam\t15/03/2009\tCận thị 2 độ\nTrần Mai Anh\tNữ\t22/07/2009\tLớp phó học tập\nPhạm Bảo Bình\tNam\t05/01/2009\tTư duy tốt`}
                  className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                />
              </div>

              {excelError && (
                <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg border border-rose-200">
                  {excelError}
                </div>
              )}

              {/* Preview Table */}
              {parsedExcelRows.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-800">
                      Xem trước ({parsedExcelRows.length} học sinh nhận diện được):
                    </span>
                    <span className="text-emerald-700 font-medium">Sẵn sàng nhập</span>
                  </div>

                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 font-semibold">
                          <th className="py-2 px-2.5 w-10 text-center">STT</th>
                          <th className="py-2 px-3">Họ và tên</th>
                          <th className="py-2 px-2 text-center">Giới tính</th>
                          <th className="py-2 px-3">Ngày sinh</th>
                          <th className="py-2 px-3">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedExcelRows.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-1.5 px-2.5 text-center text-slate-500">{r.stt}</td>
                            <td className="py-1.5 px-3 font-medium text-slate-800">{r.fullName}</td>
                            <td className="py-1.5 px-2 text-center">{r.gender}</td>
                            <td className="py-1.5 px-3 font-mono text-slate-600">{r.dateOfBirth}</td>
                            <td className="py-1.5 px-3 text-slate-600 truncate max-w-[150px]">{r.note || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-xl">
              <button
                type="button"
                onClick={() => {
                  setExcelRawText('');
                  setParsedExcelRows([]);
                }}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Xóa làm lại
              </button>

              <div className="flex gap-2">
                <button
                  id="cancel-excel-modal-btn"
                  type="button"
                  onClick={() => setIsExcelModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg"
                >
                  Hủy
                </button>
                <button
                  id="confirm-import-excel-btn"
                  type="button"
                  onClick={handleConfirmImport}
                  disabled={parsedExcelRows.length === 0}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Xác nhận thêm {parsedExcelRows.length} học sinh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Viewing Photo Modal */}
      {viewingPhotoStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-5 border border-slate-200 text-center relative">
            <button
              onClick={() => setViewingPhotoStudent(null)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-slate-800 mb-1">{viewingPhotoStudent.fullName}</h3>
            <p className="text-xs text-slate-500 mb-4">{viewingPhotoStudent.studentCode} • {viewingPhotoStudent.gender}</p>

            <div className="w-48 h-64 mx-auto rounded-lg overflow-hidden border border-slate-200 shadow-md bg-slate-100 mb-4">
              {viewingPhotoStudent.avatar ? (
                <img
                  src={viewingPhotoStudent.avatar}
                  alt={viewingPhotoStudent.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-400">
                  Chưa có ảnh
                </div>
              )}
            </div>

            {viewingPhotoStudent.note && (
              <p className="text-xs bg-amber-50 text-amber-900 border border-amber-200 p-2.5 rounded-lg mb-4 text-left">
                <strong>Đặc điểm:</strong> {viewingPhotoStudent.note}
              </p>
            )}

            {isTeacher && (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => {
                    const st = viewingPhotoStudent;
                    setViewingPhotoStudent(null);
                    openEditModal(st);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Thay đổi ảnh / ghi chú
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
