import React from 'react';
import { Student, ClassData, ScoreColumn } from '../types';
import { 
  Calculator, 
  Award, 
  BookOpen, 
  TrendingUp, 
  Calendar, 
  User, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface StudentScoreViewProps {
  student: Student;
  cls: ClassData;
  onOpenEditProfile: () => void;
}

export const StudentScoreView: React.FC<StudentScoreViewProps> = ({
  student,
  cls,
  onOpenEditProfile,
}) => {
  const gradeHK1 = cls.gradesHK1?.[student.id];
  const gradeHK2 = cls.gradesHK2?.[student.id];

  const colsHK1 = cls.scoreColumnsHK1 || [];
  const colsHK2 = cls.scoreColumnsHK2 || [];

  // Calculate HK1 average
  let sumHK1 = 0;
  let weightHK1 = 0;
  colsHK1.forEach((col) => {
    const s = gradeHK1?.scores?.[col.id];
    if (typeof s === 'number' && !isNaN(s)) {
      sumHK1 += s * col.weight;
      weightHK1 += col.weight;
    }
  });
  const avgHK1 = weightHK1 > 0 ? Math.round((sumHK1 / weightHK1) * 10) / 10 : null;

  // Calculate HK2 average
  let sumHK2 = 0;
  let weightHK2 = 0;
  colsHK2.forEach((col) => {
    const s = gradeHK2?.scores?.[col.id];
    if (typeof s === 'number' && !isNaN(s)) {
      sumHK2 += s * col.weight;
      weightHK2 += col.weight;
    }
  });
  const avgHK2 = weightHK2 > 0 ? Math.round((sumHK2 / weightHK2) * 10) / 10 : null;

  // Year average: (avgHK1 + avgHK2 * 2) / 3
  let avgYear: number | null = null;
  if (avgHK1 !== null && avgHK2 !== null) {
    avgYear = Math.round(((avgHK1 + avgHK2 * 2) / 3) * 10) / 10;
  } else if (avgHK1 !== null) {
    avgYear = avgHK1;
  } else if (avgHK2 !== null) {
    avgYear = avgHK2;
  }

  // Determine classification
  let academicRanking = 'Chưa xếp loại';
  let badgeColor = 'bg-slate-100 text-slate-700 border-slate-200';
  if (avgYear !== null) {
    if (avgYear >= 8.0) {
      academicRanking = 'Học Lực Tốt / Giỏi';
      badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-300';
    } else if (avgYear >= 6.5) {
      academicRanking = 'Học Lực Khá';
      badgeColor = 'bg-blue-50 text-blue-700 border-blue-300';
    } else if (avgYear >= 5.0) {
      academicRanking = 'Học Lực Đạt';
      badgeColor = 'bg-amber-50 text-amber-700 border-amber-300';
    } else {
      academicRanking = 'Chưa Đạt';
      badgeColor = 'bg-rose-50 text-rose-700 border-rose-300';
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-150">
      {/* Student Welcome & Profile Summary Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 border-2 border-indigo-200 shadow-xs shrink-0 flex items-center justify-center">
            {student.avatar ? (
              <img
                src={student.avatar}
                alt={student.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-slate-300" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-slate-900">{student.fullName}</h2>
              <span className="font-mono text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200">
                {student.studentCode}
              </span>
              <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                {cls.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-3 flex-wrap">
              <span>Ngày sinh: <strong>{student.dateOfBirth || 'Chưa cập nhật'}</strong></span>
              <span>•</span>
              <span>Số ĐT: <strong>{student.phoneNumber || 'Chưa cập nhật'}</strong></span>
              <span>•</span>
              <span>Giới tính: <strong>{student.gender}</strong></span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenEditProfile}
          className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl flex items-center gap-2 shadow-2xs transition-colors shrink-0"
        >
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Sửa thông tin của em & Đổi mật khẩu</span>
        </button>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">ĐTB Học Kì 1</span>
            <div className="text-2xl font-black text-indigo-700 mt-1">
              {avgHK1 !== null ? avgHK1.toFixed(1) : '—'}
            </div>
            <span className="text-[11px] text-slate-400">Hệ số 1</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Calculator className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">ĐTB Học Kì 2</span>
            <div className="text-2xl font-black text-blue-700 mt-1">
              {avgHK2 !== null ? avgHK2.toFixed(1) : '—'}
            </div>
            <span className="text-[11px] text-slate-400">Hệ số 2</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 block">ĐTB Cả Năm & Xếp Loại</span>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {avgYear !== null ? avgYear.toFixed(1) : '—'}
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block mt-0.5 ${badgeColor}`}>
              {academicRanking}
            </span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Semester 1 Score Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">Chi Tiết Điểm Môn Toán - Học Kì 1</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Điểm TB HK1: <strong className="text-indigo-600">{avgHK1 !== null ? avgHK1.toFixed(1) : 'Chưa đủ điểm'}</strong>
          </span>
        </div>

        <div className="overflow-x-auto p-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                <th className="py-2.5 px-3">Cột Điểm</th>
                <th className="py-2.5 px-3 text-center">Hệ số</th>
                <th className="py-2.5 px-3 text-center">Điểm Đạt Được</th>
                <th className="py-2.5 px-3 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {colsHK1.map((col) => {
                const score = gradeHK1?.scores?.[col.id];
                const hasScore = typeof score === 'number' && !isNaN(score);
                return (
                  <tr key={col.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-800">{col.name}</td>
                    <td className="py-2.5 px-3 text-center text-slate-500">HS{col.weight}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-sm">
                      {hasScore ? (
                        <span className={score >= 8 ? 'text-emerald-600' : score >= 5 ? 'text-indigo-600' : 'text-rose-600'}>
                          {score}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-normal">Chưa nhập</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {hasScore ? (
                        <span className="text-[11px] text-emerald-700 font-medium">✓ Đã chấm</span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Đang chờ kiểm tra</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {gradeHK1?.finalNote && (
            <div className="mt-3 p-3 bg-indigo-50/60 rounded-xl text-xs text-indigo-900 border border-indigo-100">
              <strong>Nhận xét HK1 của Thầy Huy:</strong> {gradeHK1.finalNote}
            </div>
          )}
        </div>
      </div>

      {/* Semester 2 Score Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Chi Tiết Điểm Môn Toán - Học Kì 2</h3>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            Điểm TB HK2: <strong className="text-blue-600">{avgHK2 !== null ? avgHK2.toFixed(1) : 'Chưa đủ điểm'}</strong>
          </span>
        </div>

        <div className="overflow-x-auto p-4">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold">
                <th className="py-2.5 px-3">Cột Điểm</th>
                <th className="py-2.5 px-3 text-center">Hệ số</th>
                <th className="py-2.5 px-3 text-center">Điểm Đạt Được</th>
                <th className="py-2.5 px-3 text-center">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {colsHK2.map((col) => {
                const score = gradeHK2?.scores?.[col.id];
                const hasScore = typeof score === 'number' && !isNaN(score);
                return (
                  <tr key={col.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-800">{col.name}</td>
                    <td className="py-2.5 px-3 text-center text-slate-500">HS{col.weight}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-sm">
                      {hasScore ? (
                        <span className={score >= 8 ? 'text-emerald-600' : score >= 5 ? 'text-blue-600' : 'text-rose-600'}>
                          {score}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-normal">Chưa nhập</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {hasScore ? (
                        <span className="text-[11px] text-emerald-700 font-medium">✓ Đã chấm</span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Đang chờ kiểm tra</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {gradeHK2?.finalNote && (
            <div className="mt-3 p-3 bg-blue-50/60 rounded-xl text-xs text-blue-900 border border-blue-100">
              <strong>Nhận xét HK2 của Thầy Huy:</strong> {gradeHK2.finalNote}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
