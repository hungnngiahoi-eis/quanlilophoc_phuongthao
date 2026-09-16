import React, { useState } from 'react';
import { Student, ClassData } from '../types';
import { DEFAULT_ADMIN_PIN } from '../config/appConfig';
import { KeyRound, Lock, Eye, EyeOff, ShieldCheck, X, User } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginAdminSuccess: () => void;
  onLoginStudentSuccess: (student: Student, classId: string) => void;
  expectedAdminPin: string;
  classes: ClassData[];
  onUpdateAdminPin: (newPin: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginAdminSuccess,
  onLoginStudentSuccess,
  expectedAdminPin,
  classes,
  onUpdateAdminPin,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  // Teacher pin change state
  const [isChangingAdminPin, setIsChangingAdminPin] = useState(false);
  const [currentAdminPinInput, setCurrentAdminPinInput] = useState('');
  const [newAdminPin, setNewAdminPin] = useState('');
  const [changePinSuccess, setChangePinSuccess] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    // 1. Check if Admin Login
    const isAdminUser = 
      cleanUser.toLowerCase() === 'admin' || 
      cleanUser.toLowerCase() === 'thayhuy' || 
      cleanUser.toLowerCase() === 'huy' || 
      cleanUser.toLowerCase() === 'huyquochoc@gmail.com';

    if (isAdminUser) {
      const isValidAdminPass = 
        cleanPass === expectedAdminPin || 
        cleanPass === DEFAULT_ADMIN_PIN || 
        cleanPass === 'toan123';

      if (isValidAdminPass) {
        if (cleanPass === DEFAULT_ADMIN_PIN && expectedAdminPin !== DEFAULT_ADMIN_PIN) {
          onUpdateAdminPin(DEFAULT_ADMIN_PIN);
        }
        setError('');
        setUsername('');
        setPassword('');
        onLoginAdminSuccess();
        onClose();
        return;
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không chính xác.');
        return;
      }
    }

    // 2. Check if Student Login (search by studentCode across all classes)
    let foundStudent: Student | null = null;
    let foundClassId: string = '';

    for (const cls of classes) {
      for (const st of cls.students || []) {
        if (st.studentCode && st.studentCode.trim().toLowerCase() === cleanUser.toLowerCase()) {
          foundStudent = st;
          foundClassId = cls.id;
          break;
        }
      }
      if (foundStudent) break;
    }

    if (foundStudent) {
      const studentPass = (foundStudent.password && foundStudent.password.trim()) ? foundStudent.password.trim() : '123';
      if (cleanPass === studentPass) {
        setError('');
        setUsername('');
        setPassword('');
        onLoginStudentSuccess(foundStudent, foundClassId);
        onClose();
        return;
      } else {
        setError('Tên đăng nhập hoặc mật khẩu không chính xác.');
        return;
      }
    }

    // Neither admin nor student found
    setError('Tên đăng nhập hoặc mật khẩu không chính xác.');
  };

  const handleChangeAdminPin = (e: React.FormEvent) => {
    e.preventDefault();
    const curInput = currentAdminPinInput.trim();
    const isValidCurrent = 
      curInput === expectedAdminPin || 
      curInput === DEFAULT_ADMIN_PIN || 
      curInput === 'toan123';

    if (!isValidCurrent) {
      setError('Mật khẩu quản trị viên hiện tại không đúng.');
      return;
    }
    if (newAdminPin.trim().length < 4) {
      setError('Mật khẩu mới phải có ít nhất 4 ký tự.');
      return;
    }

    onUpdateAdminPin(newAdminPin.trim());
    setChangePinSuccess('Đã đổi mật khẩu quản trị viên thành công!');
    setCurrentAdminPinInput('');
    setNewAdminPin('');
    setIsChangingAdminPin(false);
    setError('');
    setTimeout(() => setChangePinSuccess(''), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        id="login-modal-box"
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200"
        role="dialog"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {isChangingAdminPin ? 'Đổi Mật Khẩu Quản Trị' : 'Đăng Nhập Hệ Thống'}
              </h3>
              <p className="text-xs text-slate-500">
                {isChangingAdminPin ? 'Cập nhật mật khẩu bảo mật' : 'Dành cho Quản trị viên (admin) hoặc Học sinh'}
              </p>
            </div>
          </div>
          <button
            id="login-modal-close"
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {changePinSuccess && (
          <div className="mt-4 p-3 bg-emerald-50 text-emerald-700 text-xs rounded-xl border border-emerald-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{changePinSuccess}</span>
          </div>
        )}

        {!isChangingAdminPin ? (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Username / Student Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Tên đăng nhập hoặc Mã học sinh</span>
              </label>
              <input
                id="login-username-input"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="Nhập tên đăng nhập hoặc mã HS"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                autoFocus
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Mật khẩu</span>
              </label>
              <div className="relative">
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Nhập mật khẩu"
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 text-rose-600 text-xs rounded-lg border border-rose-200 animate-in fade-in duration-100">
                {error}
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              <button
                id="toggle-change-admin-pin-btn"
                type="button"
                onClick={() => {
                  setIsChangingAdminPin(true);
                  setError('');
                }}
                className="text-[11px] text-slate-500 hover:text-indigo-700 underline font-medium"
              >
                Đổi mật khẩu Admin?
              </button>
              <div className="flex gap-2">
                <button
                  id="login-cancel-btn"
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Bỏ qua
                </button>
                <button
                  id="login-submit-btn"
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Đăng nhập</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleChangeAdminPin} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mật khẩu Admin hiện tại
              </label>
              <input
                id="current-admin-pin-input"
                type="password"
                value={currentAdminPinInput}
                onChange={(e) => {
                  setCurrentAdminPinInput(e.target.value);
                  setError('');
                }}
                placeholder="Nhập mật khẩu hiện tại"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                autoFocus
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mật khẩu Admin mới
              </label>
              <input
                id="new-admin-pin-input"
                type="password"
                value={newAdminPin}
                onChange={(e) => {
                  setNewAdminPin(e.target.value);
                  setError('');
                }}
                placeholder="Nhập mật khẩu mới"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                required
              />
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 text-rose-600 text-xs rounded-lg border border-rose-200">
                {error}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsChangingAdminPin(false);
                  setError('');
                }}
                className="px-3.5 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Quay lại
              </button>
              <button
                id="save-new-admin-pin-btn"
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
              >
                Lưu mật khẩu Admin mới
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
