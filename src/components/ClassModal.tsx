import React, { useState, useEffect } from 'react';
import { School, Check, X, Edit3, Save } from 'lucide-react';
import { ClassData } from '../types';

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateClass: (data: { name: string; gradeLevel: number; schoolYear: string; roomName: string }) => void;
  editingClass?: ClassData | null;
  onUpdateClass?: (id: string, data: { name: string; gradeLevel: number; schoolYear: string; roomName: string }) => void;
}

export const ClassModal: React.FC<ClassModalProps> = ({
  isOpen,
  onClose,
  onCreateClass,
  editingClass,
  onUpdateClass,
}) => {
  const [name, setName] = useState('');
  const [gradeLevel, setGradeLevel] = useState(10);
  const [schoolYear, setSchoolYear] = useState('2024 - 2025');
  const [roomName, setRoomName] = useState('');

  const isEditing = Boolean(editingClass);

  useEffect(() => {
    if (editingClass) {
      setName(editingClass.name || '');
      setGradeLevel(editingClass.gradeLevel || 10);
      setSchoolYear(editingClass.schoolYear || '2024 - 2025');
      setRoomName(editingClass.roomName || '');
    } else {
      setName('');
      setGradeLevel(10);
      setSchoolYear('2024 - 2025');
      setRoomName('');
    }
  }, [editingClass, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isEditing && editingClass && onUpdateClass) {
      onUpdateClass(editingClass.id, {
        name: name.trim(),
        gradeLevel: Number(gradeLevel),
        schoolYear: schoolYear.trim(),
        roomName: roomName.trim(),
      });
    } else {
      onCreateClass({
        name: name.trim(),
        gradeLevel: Number(gradeLevel),
        schoolYear: schoolYear.trim(),
        roomName: roomName.trim(),
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        id="class-modal"
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200"
        role="dialog"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-xl ${
              isEditing ? 'bg-amber-100 text-amber-800' : 'bg-indigo-50 text-indigo-700'
            }`}>
              {isEditing ? <Edit3 className="w-5 h-5" /> : <School className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {isEditing ? `Sửa Thông Tin ${editingClass?.name || 'Lớp Học'}` : 'Tạo Lớp Giảng Dạy Mới'}
              </h3>
              <p className="text-xs text-slate-500">
                {isEditing 
                  ? 'Cập nhật tên lớp, khối, năm học và phòng học' 
                  : 'Khởi tạo sổ điểm và sơ đồ phòng học cho lớp mới'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tên lớp học <span className="text-rose-500">*</span>
            </label>
            <input
              id="class-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ví dụ: 10A1, 11B2, 12A3..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs font-semibold text-slate-800"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Khối lớp</label>
              <select
                id="class-grade-select"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium text-slate-800"
              >
                <option value={6}>Khối 6</option>
                <option value={7}>Khối 7</option>
                <option value={8}>Khối 8</option>
                <option value={9}>Khối 9</option>
                <option value={10}>Khối 10</option>
                <option value={11}>Khối 11</option>
                <option value={12}>Khối 12</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Năm học</label>
              <input
                id="class-school-year-input"
                type="text"
                value={schoolYear}
                onChange={(e) => setSchoolYear(e.target.value)}
                placeholder="2024 - 2025"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Phòng học (Địa điểm học)</label>
            <input
              id="class-room-name-input"
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Ví dụ: Phòng 204 - Dãy nhà A, Phòng Bộ Môn..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-800"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              id="confirm-save-class-btn"
              type="submit"
              className={`px-4 py-2 text-xs font-bold text-white rounded-lg shadow-xs flex items-center gap-1.5 transition-colors ${
                isEditing
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isEditing ? (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Lưu thông tin lớp</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Tạo lớp ngay</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

