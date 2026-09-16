import React, { useState, useRef } from 'react';
import { Student } from '../types';
import { 
  User, 
  Camera, 
  Upload, 
  Lock, 
  Phone, 
  Calendar, 
  Cloud, 
  CheckCircle2, 
  X, 
  Shield, 
  Eye, 
  EyeOff,
  Sparkles
} from 'lucide-react';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  classNameStr: string;
  onSaveProfile: (updatedData: {
    avatar?: string;
    dateOfBirth?: string;
    phoneNumber?: string;
    password?: string;
  }) => Promise<void>;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  student,
  classNameStr,
  onSaveProfile,
}) => {
  const [avatar, setAvatar] = useState(student.avatar || '');
  const [dateOfBirth, setDateOfBirth] = useState(student.dateOfBirth || '');
  const [phoneNumber, setPhoneNumber] = useState(student.phoneNumber || '');
  const [password, setPassword] = useState(student.password || '123');
  const [showPassword, setShowPassword] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle image upload from file
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chỉ chọn tệp hình ảnh (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const img = new Image();
      img.onload = () => {
        // Optimize & resize image to max 300x300 for crisp Base64 storage
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
          setErrorMessage('');
        }
      };
      img.src = loadEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage('Mật khẩu không được để trống.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    try {
      await onSaveProfile({
        avatar,
        dateOfBirth: dateOfBirth.trim(),
        phoneNumber: phoneNumber.trim(),
        password: password.trim(),
      });
      setSuccessMessage('Đã cập nhật thông tin cá nhân và lưu lên Google Sheets thành công!');
      setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi khi lưu dữ liệu. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        id="student-profile-modal"
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col border border-slate-200 overflow-hidden"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 to-blue-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <span>Hồ Sơ Cá Nhân Học Sinh</span>
                <span className="text-[11px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                  {classNameStr}
                </span>
              </h3>
              <p className="text-xs text-slate-500">Chỉnh sửa ảnh thẻ, ngày sinh, số ĐT và đổi mật khẩu</p>
            </div>
          </div>
          <button
            id="close-profile-modal-btn"
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Notification feedback */}
          {successMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
              {errorMessage}
            </div>
          )}

          {/* Section: Avatar / Photo */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="relative group shrink-0">
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-200 border-2 border-indigo-200 shadow-xs flex items-center justify-center">
                {avatar ? (
                  <img
                    src={avatar}
                    alt={student.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2 text-slate-400">
                    <User className="w-10 h-10 mx-auto text-slate-300 mb-1" />
                    <span className="text-[10px] block font-medium">Chưa có ảnh</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 text-center sm:text-left flex-1">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Ảnh đại diện / Ảnh thẻ của em</span>
                <span className="text-[11px] text-slate-500">
                  Tải ảnh chân dung rõ mặt để hiển thị trên danh sách và sơ đồ lớp.
                </span>
              </div>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileChange}
                  className="hidden"
                  id="student-avatar-file-input"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Chọn ảnh từ máy</span>
                </button>
                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar('')}
                    className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-rose-200"
                  >
                    Xóa ảnh
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section: Read-only info (Họ tên, Mã HS, STT) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80">
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Họ và tên</span>
              <span className="text-sm font-bold text-slate-800">{student.fullName}</span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Mã học sinh (Tên đăng nhập)</span>
              <span className="text-sm font-mono font-bold text-indigo-600 bg-indigo-50/80 px-2 py-0.5 rounded inline-block">
                {student.studentCode}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Giới tính</span>
              <span className="text-xs font-semibold text-slate-700">{student.gender}</span>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Lớp giảng dạy</span>
              <span className="text-xs font-semibold text-slate-700">{classNameStr} (STT: {student.stt})</span>
            </div>
            {student.note && (
              <div className="sm:col-span-2 pt-1 border-t border-slate-200/60">
                <span className="text-[11px] font-medium text-slate-400 block">Ghi chú đặc điểm của Giáo viên</span>
                <span className="text-xs text-slate-600 italic">{student.note}</span>
              </div>
            )}
          </div>

          {/* Section: Editable Information */}
          <div className="space-y-4">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Thông tin cá nhân em được phép chỉnh sửa:</span>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Ngày sinh</span>
              </label>
              <input
                id="student-dob-input"
                type="text"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                placeholder="Ví dụ: 15/03/2009"
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">Định dạng: Ngày/Tháng/Năm (VD: 15/03/2009)</span>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>Số điện thoại liên hệ</span>
              </label>
              <input
                id="student-phone-input"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ví dụ: 0912345678"
                className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">Số điện thoại của học sinh hoặc phụ huynh để liên lạc</span>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Mật khẩu đăng nhập</span>
                </label>
                <span className="text-[10px] text-slate-400">(Mặc định ban đầu là: 123)</span>
              </div>
              <div className="relative">
                <input
                  id="student-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới của em"
                  className="w-full px-3.5 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Em có thể đổi mật khẩu để bảo vệ thông tin điểm và hồ sơ của mình.
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <button
              id="student-save-profile-btn"
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs flex items-center gap-2 transition-all disabled:opacity-50"
            >
              <Cloud className={`w-4 h-4 ${isSaving ? 'animate-pulse' : ''}`} />
              <span>{isSaving ? 'Đang lưu lên Sheet...' : 'Lưu thông tin & Tải lên Sheet'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
