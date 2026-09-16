import { AppData, ClassData, Student, ScoreColumn, StudentGrade } from '../types';
import { DEFAULT_GS_URL, DEFAULT_ADMIN_PIN } from '../config/appConfig';

export { DEFAULT_GS_URL, DEFAULT_ADMIN_PIN };

export const DEFAULT_SCORE_COLUMNS_HK1: ScoreColumn[] = [
  { id: 'hk1_m', name: 'Miệng', weight: 1, semester: 'HK1' },
  { id: 'hk1_15p1', name: '15p ĐS', weight: 1, semester: 'HK1' },
  { id: 'hk1_15p2', name: '15p HH', weight: 1, semester: 'HK1' },
  { id: 'hk1_tx', name: 'ĐG Thường xuyên', weight: 1, semester: 'HK1' },
  { id: 'hk1_gk', name: 'Giữa kì 1', weight: 2, semester: 'HK1' },
  { id: 'hk1_ck', name: 'Cuối kì 1', weight: 3, semester: 'HK1' },
];

export const DEFAULT_SCORE_COLUMNS_HK2: ScoreColumn[] = [
  { id: 'hk2_m1', name: 'Miệng 1', weight: 1, semester: 'HK2' },
  { id: 'hk2_m2', name: 'Miệng 2', weight: 1, semester: 'HK2' },
  { id: 'hk2_15p1', name: '15p ĐS', weight: 1, semester: 'HK2' },
  { id: 'hk2_15p2', name: '15p HH', weight: 1, semester: 'HK2' },
  { id: 'hk2_tx', name: 'ĐG Thường xuyên', weight: 1, semester: 'HK2' },
  { id: 'hk2_gk', name: 'Giữa kì 2', weight: 2, semester: 'HK2' },
  { id: 'hk2_ck', name: 'Cuối kì 2', weight: 3, semester: 'HK2' },
];

const sampleStudents10A1: Student[] = [
  { id: 'hs-1', stt: 1, studentCode: '10A1-01', fullName: 'Nguyễn Hoàng An', gender: 'Nam', dateOfBirth: '15/03/2009', note: 'Cận thị 2.5 độ, nên ngồi dãy 1-2 gần bảng', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { id: 'hs-2', stt: 2, studentCode: '10A1-02', fullName: 'Trần Mai Anh', gender: 'Nữ', dateOfBirth: '22/07/2009', note: 'Lớp phó học tập, nắm chắc kiến thức Hình học', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
  { id: 'hs-3', stt: 3, studentCode: '10A1-03', fullName: 'Phạm Bảo Bình', gender: 'Nam', dateOfBirth: '05/01/2009', note: 'Tư duy logic tốt nhưng tính toán còn ẩu', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' },
  { id: 'hs-4', stt: 4, studentCode: '10A1-04', fullName: 'Lê Thùy Chi', gender: 'Nữ', dateOfBirth: '18/11/2009', note: 'Trầm tính, chăm chỉ làm bài tập về nhà', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80' },
  { id: 'hs-5', stt: 5, studentCode: '10A1-05', fullName: 'Vũ Quốc Cường', gender: 'Nam', dateOfBirth: '30/08/2009', note: 'Hay nói chuyện riêng với bạn bên cạnh', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: 'hs-6', stt: 6, studentCode: '10A1-06', fullName: 'Đỗ Hải Đăng', gender: 'Nam', dateOfBirth: '12/04/2009', note: 'Học sinh giỏi Toán thành phố, giải nhanh', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { id: 'hs-7', stt: 7, studentCode: '10A1-07', fullName: 'Bùi Thảo Dung', gender: 'Nữ', dateOfBirth: '25/09/2009', note: 'Chăm chú nghe giảng, trình bày vở sạch đẹp', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
  { id: 'hs-8', stt: 8, studentCode: '10A1-08', fullName: 'Hoàng Minh Đức', gender: 'Nam', dateOfBirth: '09/02/2009', note: 'Chiều cao vượt trội (1m78), nên ngồi hàng sau', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
  { id: 'hs-9', stt: 9, studentCode: '10A1-09', fullName: 'Nguyễn Thị Hạnh', gender: 'Nữ', dateOfBirth: '14/06/2009', note: 'Khả năng vẽ hình chuẩn, cần rèn thêm biến đổi lượng giác', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80' },
  { id: 'hs-10', stt: 10, studentCode: '10A1-10', fullName: 'Phan Tuấn Kiệt', gender: 'Nam', dateOfBirth: '03/10/2009', note: 'Tập trung cao độ khi giải bài khó', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
  { id: 'hs-11', stt: 11, studentCode: '10A1-11', fullName: 'Trần Gia Linh', gender: 'Nữ', dateOfBirth: '29/05/2009', note: 'Thích làm bài hình học tọa độ Oxy', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
  { id: 'hs-12', stt: 12, studentCode: '10A1-12', fullName: 'Lê Quang Minh', gender: 'Nam', dateOfBirth: '19/12/2009', note: 'Thường xung phong chữa bài trên bảng', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80' },
  { id: 'hs-13', stt: 13, studentCode: '10A1-13', fullName: 'Đặng Yến Nhi', gender: 'Nữ', dateOfBirth: '08/03/2009', note: 'Cần động viên khi làm bài kiểm tra định kì', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
  { id: 'hs-14', stt: 14, studentCode: '10A1-14', fullName: 'Phạm Minh Nhật', gender: 'Nam', dateOfBirth: '21/04/2009', note: 'Cán sự công nghệ, quản lý máy chiếu lớp', avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80' },
  { id: 'hs-15', stt: 15, studentCode: '10A1-15', fullName: 'Võ Thanh Phong', gender: 'Nam', dateOfBirth: '11/08/2009', note: 'Chăm học, hay đặt câu hỏi sâu về định lý', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
  { id: 'hs-16', stt: 16, studentCode: '10A1-16', fullName: 'Dương Quỳnh Như', gender: 'Nữ', dateOfBirth: '17/01/2009', note: 'Vở ghi chép cẩn thận, công thức rõ ràng', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80' },
  { id: 'hs-17', stt: 17, studentCode: '10A1-17', fullName: 'Ngô Việt Thắng', gender: 'Nam', dateOfBirth: '06/07/2009', note: 'Học tốt Bất đẳng thức Cauchy - Schwarz', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' },
  { id: 'hs-18', stt: 18, studentCode: '10A1-18', fullName: 'Lý Kim Thoa', gender: 'Nữ', dateOfBirth: '23/10/2009', note: 'Tính toán nhanh, giải trắc nghiệm rất tốt', avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80' },
  { id: 'hs-19', stt: 19, studentCode: '10A1-19', fullName: 'Trịnh Hữu Toàn', gender: 'Nam', dateOfBirth: '16/02/2009', note: 'Hơi rụt rè khi lên bảng, cần khích lệ', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80' },
  { id: 'hs-20', stt: 20, studentCode: '10A1-20', fullName: 'Hồ Cẩm Tú', gender: 'Nữ', dateOfBirth: '04/09/2009', note: 'Chăm chỉ, làm đủ bài tự luyện về nhà', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80' },
  { id: 'hs-21', stt: 21, studentCode: '10A1-21', fullName: 'Mai Văn Tùng', gender: 'Nam', dateOfBirth: '27/11/2009', note: 'Có tiến bộ rõ rệt trong chương Hàm số bậc hai', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80' },
  { id: 'hs-22', stt: 22, studentCode: '10A1-22', fullName: 'Tạ Minh Uyên', gender: 'Nữ', dateOfBirth: '13/05/2009', note: 'Học đều cả Đại số và Hình học', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80' },
  { id: 'hs-23', stt: 23, studentCode: '10A1-23', fullName: 'Phan Đình Vũ', gender: 'Nam', dateOfBirth: '02/12/2009', note: 'Tư duy sáng tạo, thích tìm cách giải độc đáo', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80' },
  { id: 'hs-24', stt: 24, studentCode: '10A1-24', fullName: 'Trần Bảo Yến', gender: 'Nữ', dateOfBirth: '31/07/2009', note: 'Bí thư chi đoàn, gương mẫu trong học tập', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80' },
];

function generateSampleGradesHK1(): Record<string, StudentGrade> {
  const grades: Record<string, StudentGrade> = {};
  const baseScores = [
    [9.0, 8.5, 9.0, 10, 8.5, 9.2, 'Nắm vững kiến thức, học tốt'],
    [10, 9.5, 9.0, 9.5, 9.0, 9.5, 'Xuất sắc, tư duy hình học rất nhạy'],
    [8.0, 7.5, 8.0, 8.5, 7.0, 7.8, 'Cần chú ý tính toán cẩn thận hơn'],
    [9.0, 8.0, 8.5, 9.0, 8.0, 8.5, 'Chăm chỉ, tiến bộ đều đặn'],
    [7.0, 6.5, 7.0, 7.5, 6.0, 6.8, 'Cần tập trung hơn trong giờ học'],
    [10, 10, 9.5, 10, 9.5, 9.8, 'Rất xuất sắc, thành viên đội tuyển HSG'],
    [8.5, 8.0, 8.5, 9.0, 8.5, 8.8, 'Vở sạch chữ đẹp, giải bài rành mạch'],
    [8.0, 7.0, 7.5, 8.0, 7.5, 8.0, 'Có cố gắng, cần ôn lại công thức lượng giác'],
    [9.0, 8.5, 8.0, 9.0, 8.0, 8.4, 'Tích cực phát biểu xây dựng bài'],
    [9.5, 9.0, 9.0, 9.5, 9.0, 9.2, 'Tư duy đại số tốt'],
    [8.5, 8.5, 9.0, 9.0, 8.5, 8.7, 'Bài kiểm tra trình bày mạch lạc'],
    [9.0, 9.0, 8.5, 9.5, 8.5, 9.0, 'Thường xuyên chữa bài khó'],
    [7.5, 7.0, 8.0, 7.5, 7.0, 7.2, 'Cần tự tin hơn khi lên bảng'],
    [8.0, 8.5, 8.0, 8.5, 8.0, 8.2, 'Ý thức học tập tốt'],
    [9.0, 8.5, 9.0, 9.0, 9.0, 9.0, 'Hiểu bài nhanh'],
    [9.5, 9.0, 8.5, 9.5, 8.5, 9.0, 'Ngoan ngoãn, chăm chỉ'],
    [10, 9.5, 9.5, 10, 9.0, 9.6, 'Giỏi Bất đẳng thức'],
    [8.5, 8.0, 8.5, 8.5, 8.0, 8.5, 'Tốc độ giải bài nhanh'],
    [7.0, 6.5, 7.0, 7.5, 6.5, 6.8, 'Cần rèn thêm kỹ năng biến đổi'],
    [8.5, 8.5, 9.0, 9.0, 8.0, 8.6, 'Chăm làm bài tập về nhà'],
    [8.0, 8.5, 8.0, 8.5, 8.0, 8.3, 'Tiến bộ vượt bậc'],
    [9.0, 8.5, 9.0, 9.5, 9.0, 9.2, 'Kiến thức vững vàng'],
    [9.5, 9.0, 9.5, 9.5, 9.0, 9.4, 'Sáng tạo trong giải toán'],
    [9.0, 9.0, 9.0, 9.5, 9.0, 9.2, 'Gương mẫu, tích cực'],
  ];

  sampleStudents10A1.forEach((st, idx) => {
    const s = baseScores[idx] || [8, 8, 8, 8, 8, 8, 'Học lực Khá'];
    grades[st.id] = {
      scores: {
        hk1_m: Number(s[0]),
        hk1_15p1: Number(s[1]),
        hk1_15p2: Number(s[2]),
        hk1_tx: Number(s[3]),
        hk1_gk: Number(s[4]),
        hk1_ck: Number(s[5]),
      },
      finalNote: String(s[6]),
    };
  });

  return grades;
}

function generateSampleGradesHK2(): Record<string, StudentGrade> {
  const grades: Record<string, StudentGrade> = {};
  sampleStudents10A1.forEach((st, idx) => {
    // HK2 has 5 HS1 columns + 1 HS2 + 1 HS3
    const base = 7 + (idx % 4) * 0.8;
    grades[st.id] = {
      scores: {
        hk2_m1: Math.min(10, Math.round((base + 0.5) * 10) / 10),
        hk2_m2: Math.min(10, Math.round((base + 1.0) * 10) / 10),
        hk2_15p1: Math.min(10, Math.round((base) * 10) / 10),
        hk2_15p2: Math.min(10, Math.round((base + 0.5) * 10) / 10),
        hk2_tx: Math.min(10, Math.round((base + 1.2) * 10) / 10),
        hk2_gk: Math.min(10, Math.round((base + 0.5) * 10) / 10),
        hk2_ck: Math.min(10, Math.round((base + 0.8) * 10) / 10),
      },
      finalNote: 'Hoàn thành tốt chương trình HK2',
    };
  });
  return grades;
}

// 6 rows x 4 columns = 24 seats mapped from students 0 to 23
function generateInitialSeats(students: Student[], rows = 6, cols = 4): Record<string, string | null> {
  const seats: Record<string, string | null> = {};
  let studentIdx = 0;
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      const key = `${r}-${c}`;
      if (studentIdx < students.length) {
        seats[key] = students[studentIdx].id;
        studentIdx++;
      } else {
        seats[key] = null;
      }
    }
  }
  return seats;
}

export const initialClass10A1: ClassData = {
  id: 'class-10a1',
  name: 'Lớp 10A1',
  gradeLevel: 10,
  schoolYear: '2024 - 2025',
  roomName: 'Phòng học 204 - Dãy nhà A',
  students: sampleStudents10A1,
  scoreColumnsHK1: DEFAULT_SCORE_COLUMNS_HK1,
  scoreColumnsHK2: DEFAULT_SCORE_COLUMNS_HK2,
  gradesHK1: generateSampleGradesHK1(),
  gradesHK2: generateSampleGradesHK2(),
  seating: {
    rows: 6,
    cols: 4,
    seats: generateInitialSeats(sampleStudents10A1, 6, 4),
  },
};

export const initialClass11B2: ClassData = {
  id: 'class-11b2',
  name: 'Lớp 11B2',
  gradeLevel: 11,
  schoolYear: '2024 - 2025',
  roomName: 'Phòng học 301 - Dãy nhà B',
  students: sampleStudents10A1.slice(0, 18).map((st, i) => ({
    ...st,
    id: `hs-11b2-${i + 1}`,
    studentCode: `11B2-${String(i + 1).padStart(2, '0')}`,
  })),
  scoreColumnsHK1: DEFAULT_SCORE_COLUMNS_HK1,
  scoreColumnsHK2: DEFAULT_SCORE_COLUMNS_HK2,
  gradesHK1: {},
  gradesHK2: {},
  seating: {
    rows: 6,
    cols: 4,
    seats: generateInitialSeats(sampleStudents10A1.slice(0, 18), 6, 4),
  },
};

export const initialAppData: AppData = {
  classes: [initialClass10A1, initialClass11B2],
  activeClassId: 'class-10a1',
  scriptConfig: {
    url: DEFAULT_GS_URL,
    lastUpdated: '2026-09-03 10:00',
    notesHistory: [
      {
        id: 'log-1',
        timestamp: '2026-09-03 10:00:00',
        note: 'Khởi tạo kết nối Google Apps Script ban đầu',
        url: DEFAULT_GS_URL,
      },
    ],
  },
  teacherPin: DEFAULT_ADMIN_PIN,
  lastSyncedAt: null,
  guestPermissions: {
    allowViewStudents: true,
    allowViewSeating: true,
    allowViewGradebook: false,
  },
};
