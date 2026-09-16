import { AppData, ClassData } from '../types';
import { initialAppData } from '../data/initialData';
import { DEFAULT_GS_URL, DEFAULT_ADMIN_PIN } from '../config/appConfig';

const LOCAL_STORAGE_KEY = 'math_teacher_app_data_v1';

export function sanitizeClassSeating(cls: ClassData): ClassData {
  if (!cls || !cls.seating) return cls;
  const rows = Number(cls.seating.rows) || 6;
  const cols = Number(cls.seating.cols) || 4;
  const seats = cls.seating.seats || {};
  const validStudentIds = new Set((cls.students || []).map((s) => s.id));

  const cleanSeats: Record<string, string | null> = {};
  const seatedIds = new Set<string>();

  // 1. First pass: fill valid grid seats
  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= cols; c++) {
      const key = `${r}-${c}`;
      const stId = seats[key];
      if (stId && validStudentIds.has(stId) && !seatedIds.has(stId)) {
        cleanSeats[key] = stId;
        seatedIds.add(stId);
      } else {
        cleanSeats[key] = null;
      }
    }
  }

  // 2. Second pass: rescue any students found in out-of-bounds keys (e.g. '6-1' when rows = 5)
  Object.entries(seats).forEach(([key, val]) => {
    const stId = val as string;
    if (!stId || !validStudentIds.has(stId) || seatedIds.has(stId)) return;
    const [r, c] = key.split('-').map(Number);
    if (r > rows || c > cols || r < 1 || c < 1) {
      // Find an empty seat in the valid grid to rescue this student
      let placed = false;
      for (let tr = 1; tr <= rows; tr++) {
        for (let tc = 1; tc <= cols; tc++) {
          const tKey = `${tr}-${tc}`;
          if (!cleanSeats[tKey]) {
            cleanSeats[tKey] = stId;
            seatedIds.add(stId);
            placed = true;
            break;
          }
        }
        if (placed) break;
      }
      // If no empty seat in grid, student remains unseated (which is safe as they show in Unseated list)
    }
  });

  return {
    ...cls,
    seating: {
      rows,
      cols,
      seats: cleanSeats,
    },
  };
}

export function sanitizeAppData(data: AppData): AppData {
  if (!data || !Array.isArray(data.classes)) return data;
  return {
    ...data,
    classes: data.classes.map(sanitizeClassSeating),
  };
}

export function loadLocalData(): AppData {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.classes) && parsed.classes.length > 0) {
        parsed.scriptConfig = {
          ...(parsed.scriptConfig || {}),
          url: DEFAULT_GS_URL,
          lastUpdated: parsed.scriptConfig?.lastUpdated || new Date().toLocaleString('vi-VN'),
          notesHistory: parsed.scriptConfig?.notesHistory || [],
        };
        if (!parsed.teacherPin || parsed.teacherPin === 'toan123') {
          parsed.teacherPin = DEFAULT_ADMIN_PIN;
        }
        if (!parsed.guestPermissions) {
          parsed.guestPermissions = {
            allowViewStudents: true,
            allowViewSeating: true,
            allowViewGradebook: false,
          };
        }
        const sanitized = sanitizeAppData(parsed);
        // Persist clean sanitized state back
        saveLocalData(sanitized);
        return sanitized;
      }
    }
  } catch (err) {
    console.error('Error reading localStorage:', err);
  }
  return initialAppData;
}

export function saveLocalData(data: AppData): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error saving to localStorage:', err);
  }
}

export interface SyncResult {
  success: boolean;
  message: string;
  data?: AppData;
}

/**
 * Fetch latest data from Google Apps Script Web App
 */
export async function fetchFromGoogleSheet(gsUrl?: string): Promise<SyncResult> {
  const targetUrl = (gsUrl && gsUrl.trim()) ? gsUrl.trim() : DEFAULT_GS_URL;

  try {
    // Attempt 1: Call via backend Express proxy (eliminates CORS & redirect issues)
    const proxyUrl = `/api/gs/fetch?url=${encodeURIComponent(targetUrl)}`;
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (response.ok) {
      const resJson = await response.json();
      if (resJson.success && resJson.data) {
        let payload = resJson.data;
        // If Google Sheet wrapped data in an outer object or string
        if (typeof payload === 'string') {
          try { payload = JSON.parse(payload); } catch {}
        }
        if (payload && payload.data) {
          payload = payload.data;
        }

        if (payload && Array.isArray(payload.classes) && payload.classes.length > 0) {
          // Normalize students STT and ordering
          payload.classes = payload.classes.map((cls: any) => {
            if (!cls.students || !Array.isArray(cls.students)) return cls;
            const sorted = [...cls.students].sort((a: any, b: any) => {
              const numA = parseInt(String(a.stt), 10);
              const numB = parseInt(String(b.stt), 10);
              if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
              return (a.fullName || '').localeCompare(b.fullName || '');
            });
            return {
              ...cls,
              students: sorted.map((s: any, idx: number) => ({ ...s, stt: s.stt || (idx + 1) })),
            };
          });

          // Normalize teacherPin if missing or legacy toan123
          if (!payload.teacherPin || payload.teacherPin === 'toan123') {
            payload.teacherPin = DEFAULT_ADMIN_PIN;
          }

          // Retain targetUrl in scriptConfig
          if (!payload.scriptConfig || !payload.scriptConfig.url) {
            payload.scriptConfig = {
              url: targetUrl,
              lastUpdated: new Date().toLocaleString('vi-VN'),
              notesHistory: [],
            };
          }

          payload = sanitizeAppData(payload);
          saveLocalData(payload);
          return {
            success: true,
            message: 'Đã tải dữ liệu mới nhất từ Google Sheets thành công!',
            data: payload,
          };
        } else {
          return {
            success: true,
            message: 'Đã kết nối được Google Apps Script (Trang tính chưa có dữ liệu cấu trúc sẵn hoặc trả về dạng thô).',
          };
        }
      }
    }
  } catch (backendErr) {
    console.warn('Backend proxy fetch failed, attempting direct fetch...', backendErr);
  }

  // Attempt 2: Direct browser fetch with fallback
  try {
    const directUrl = new URL(targetUrl);
    directUrl.searchParams.set('action', 'getData');
    directUrl.searchParams.set('_t', Date.now().toString());

    const directRes = await fetch(directUrl.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      mode: 'cors',
    });

    if (directRes.ok) {
      const json = await directRes.json();
      const payload = json.data || json;
      if (payload && Array.isArray(payload.classes)) {
        if (!payload.teacherPin || payload.teacherPin === 'toan123') {
          payload.teacherPin = DEFAULT_ADMIN_PIN;
        }
        saveLocalData(payload);
        return {
          success: true,
          message: 'Đã kết nối trực tiếp và đồng bộ từ Google Sheets thành công!',
          data: payload,
        };
      }
    }
  } catch (directErr) {
    console.warn('Direct fetch failed:', directErr);
  }

  return {
    success: false,
    message: 'Không thể kết nối đến URL Google Apps Script. Ứng dụng sẽ dùng dữ liệu lưu cục bộ trên máy.',
  };
}

/**
 * Save data to Google Sheet via Google Apps Script Web App
 */
export async function saveToGoogleSheet(gsUrl: string | undefined, data: AppData): Promise<SyncResult> {
  const targetUrl = (gsUrl && gsUrl.trim()) ? gsUrl.trim() : DEFAULT_GS_URL;

  // Sanitize and sort all students by STT 1..N before persisting
  const sanitizedData: AppData = {
    ...data,
    classes: data.classes.map((c) => {
      const sorted = [...c.students].sort((a, b) => {
        const numA = parseInt(String(a.stt), 10);
        const numB = parseInt(String(b.stt), 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return (a.fullName || '').localeCompare(b.fullName || '');
      });
      return {
        ...c,
        students: sorted.map((s, idx) => ({ ...s, stt: idx + 1 })),
      };
    }),
  };

  const payload = {
    action: 'saveData',
    timestamp: new Date().toISOString(),
    data: sanitizeAppData(sanitizedData),
  };

  // Attempt 1: Call via backend Express proxy
  try {
    const response = await fetch('/api/gs/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: targetUrl,
        payload,
      }),
    });

    if (response.ok) {
      const resJson = await response.json();
      if (resJson.success && (!resJson.result || resJson.result.success !== false)) {
        return {
          success: true,
          message: resJson.result?.message || 'Đã lưu toàn bộ dữ liệu thành công lên Google Sheets & Google Drive!',
        };
      } else if (resJson.error) {
        return {
          success: false,
          message: resJson.error || 'Google Apps Script báo lỗi khi lưu',
        };
      }
    }
  } catch (proxyErr) {
    console.warn('Backend proxy save failed, trying direct POST...', proxyErr);
  }

  // Attempt 2: Direct browser POST (using text/plain to avoid CORS preflight rejection in Google Apps Script)
  try {
    const directRes = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      mode: 'cors',
    });

    if (directRes.ok) {
      const directText = await directRes.text();
      let directJson: any;
      try {
        directJson = JSON.parse(directText);
      } catch {
        directJson = { success: true };
      }

      if (directJson && directJson.success === false) {
        return {
          success: false,
          message: directJson.error || 'Lỗi khi lưu lên Google Sheets.',
        };
      }

      return {
        success: true,
        message: directJson.message || 'Đã gửi và lưu thành công dữ liệu lên Google Sheets!',
      };
    }
  } catch (directErr) {
    console.warn('Direct POST failed:', directErr);
  }

  return {
    success: false,
    message: 'Lưu lên Google Sheets không thành công. Dữ liệu đã được lưu an toàn vào bộ nhớ cục bộ trên trình duyệt.',
  };
}

/**
 * Export AppData to a JSON file download for manual local backup
 */
export function exportAppDataToFile(data: AppData, fileName = 'so_quan_ly_toan_backup.json') {
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error exporting backup file:', err);
  }
}
