import React, { useState, useMemo } from 'react';
import { ScriptConfig, ScriptUpdateLog, GuestPermissions } from '../types';
import { DEFAULT_GS_URL, SCRIPT_CODE_LAST_MODIFIED } from '../config/appConfig';
import { Cloud, History, CheckCircle2, AlertCircle, Copy, Check, Link2, FileCode, RefreshCw, X, HelpCircle, Image as ImageIcon, Shield, Eye } from 'lucide-react';

const formatTimestamp = (d: Date = new Date()) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${day}/${month}/${year} lúc ${hours}:${minutes}:${seconds}`;
};

interface GSManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ScriptConfig;
  onSaveConfig: (newUrl: string, note: string) => void;
  onTestConnection: (url: string) => Promise<{ success: boolean; message: string }>;
  onSyncNow: () => void;
  onSaveToSheetNow: () => void;
  isSyncing: boolean;
  isSaving: boolean;
  onExportBackup?: () => void;
  autoSyncEnabled?: boolean;
  onToggleAutoSync?: (val: boolean) => void;
  guestPermissions?: GuestPermissions;
  onUpdateGuestPermissions?: (perms: GuestPermissions) => void;
}

export const GSManagerModal: React.FC<GSManagerModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onTestConnection,
  onSyncNow,
  onSaveToSheetNow,
  isSyncing,
  isSaving,
  onExportBackup,
  autoSyncEnabled = true,
  onToggleAutoSync,
  guestPermissions = { allowViewStudents: true, allowViewSeating: true, allowViewGradebook: false },
  onUpdateGuestPermissions,
}) => {
  const [note, setNote] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const finalNote = note.trim() || 'Cập nhật ghi chú hệ thống mã GS';
    onSaveConfig(DEFAULT_GS_URL, finalNote);
    setNote('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await onTestConnection(DEFAULT_GS_URL);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Lỗi khi kiểm tra kết nối',
      });
    } finally {
      setTesting(false);
    }
  };

  const sampleAppsScriptCode = `/**
 * =========================================================================
 * MÃ GOOGLE APPS SCRIPT ĐỒNG BỘ TOÀN DIỆN: SỔ ĐIỂM & LỚP HỌC MÔN TOÁN
 * Ngày, giờ cập nhật: ${SCRIPT_CODE_LAST_MODIFIED}
 * Phiên bản: Chuẩn hóa _DATABASE_, tự động dọn dẹp trang tính khi xóa lớp
 * =========================================================================
 * Hướng dẫn cài đặt/cập nhật:
 * 1. Mở file Google Sheet của bạn trên trình duyệt.
 * 2. Chọn menu "Tiện ích mở rộng" (Extensions) -> "Apps Script".
 * 3. Xóa toàn bộ nội dung cũ trong Code.gs, dán toàn bộ mã này vào.
 * 4. Nhấn "Lưu" (biểu tượng 💾).
 * 5. Nhấn "Triển khai" (Deploy) -> "Quản lý bản triển khai" (Manage deployments)
 *    -> Nhấn biểu tượng bút chì ✏️ -> Ở mục "Phiên bản" chọn "Phiên bản mới" (New version)
 *    -> Nhấn "Triển khai" (Deploy).
 * 6. Sao chép Web App URL (kết thúc /exec) và dán vào phần mềm.
 */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var stored = loadDatabase(ss);
    
    // Fallback: Kiểm tra Script Properties nếu chưa có trong sheet _DATABASE_
    if (!stored) {
      var props = PropertiesService.getScriptProperties();
      stored = props.getProperty("APP_DATA");
    }
    
    if (!stored) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "ok",
        message: "Chưa có dữ liệu trên Sheet, sẵn sàng lưu",
        classes: []
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // ĐỒNG BỘ 2 CHIỀU THÔNG MINH: Quét trực tiếp các điểm số & nhận xét Thầy/Cô đã sửa trên Google Sheets
    try {
      var appData = JSON.parse(stored);
      if (appData && Array.isArray(appData.classes) && appData.classes.length > 0) {
        syncFromVisualSheets(ss, appData);
        stored = JSON.stringify(appData);
      }
    } catch (syncErr) {
      // Nếu có lỗi quét, vẫn trả về dữ liệu database gốc để đảm bảo an toàn tuyệt đối
    }

    return ContentService.createTextOutput(stored).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var contents = e.postData.contents;
    var parsed = JSON.parse(contents);
    var appData = parsed.data || parsed;
    var jsonString = JSON.stringify(appData);
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Lưu trữ JSON an toàn trong sheet _DATABASE_ (hiển thị rõ ràng, không ẩn)
    saveDatabase(ss, jsonString, appData);
    
    // 2. Dự phòng thêm vào Script Properties (nếu kích thước nhỏ hơn 8.5KB)
    try {
      var props = PropertiesService.getScriptProperties();
      props.setProperty("APP_DATA", jsonString.length < 8500 ? jsonString : "");
    } catch(propErr) {}
    
    // 3. Tạo các trang tính trực quan: Kho Ảnh Thẻ, Danh Sách, Điểm HK1, Điểm HK2 & Cả Năm, Sơ Đồ Lớp
    syncToSheet(ss, appData);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: "Đã lưu và đồng bộ toàn bộ Danh sách, Ảnh thẻ, Sổ điểm và Sơ đồ lớp lên Google Sheets!",
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Lưu dữ liệu JSON vào sheet _DATABASE_ (ĐẨY BẢNG KIỂM SOÁT HỒ SƠ XUỐNG DƯỚI TỪ DÒNG 4 VÀ CĂN TỪ CỘT A ĐẾN G)
function saveDatabase(ss, jsonString, appData) {
  var dbSheet = ss.getSheetByName("_DATABASE_");
  if (!dbSheet) {
    dbSheet = ss.insertSheet("_DATABASE_");
  }
  // Hiển thị rõ ràng sheet _DATABASE_ (không ẩn) và đặt màu xanh lá cây nổi bật
  try { dbSheet.showSheet(); } catch(e) {}
  try { dbSheet.setTabColor("#059669"); } catch(e) {}
  
  dbSheet.clear();
  try {
    dbSheet.getRange(1, 1, Math.max(dbSheet.getMaxRows(), 60), Math.max(dbSheet.getMaxColumns(), 12)).breakApart();
  } catch(e) {}

  // 1. Dòng 1: Dòng ghi chú hệ thống (Gộp A1:G1)
  var sysNote = [["⚙️ CƠ SỞ DỮ LIỆU ĐỒNG BỘ HỆ THỐNG WEBSITE (TỰ ĐỘNG CẬP NHẬT - VUI LÒNG KHÔNG SỬA DÒNG 1 & 2)", "", "", "", "", "", ""]];
  dbSheet.getRange(1, 1, 1, 7).setValues(sysNote);
  var sysNoteRange = dbSheet.getRange(1, 1, 1, 7);
  sysNoteRange.merge();
  sysNoteRange.setFontWeight("bold");
  sysNoteRange.setFontSize(9);
  sysNoteRange.setHorizontalAlignment("center");
  sysNoteRange.setVerticalAlignment("middle");
  sysNoteRange.setBackground("#f1f5f9");
  sysNoteRange.setFontColor("#64748b");
  dbSheet.setRowHeight(1, 24);

  // 2. Dòng 2: Lưu chuỗi JSON dàn ngang theo từng ô A2, B2, C2... (đảm bảo không chiếm dụng các dòng bên dưới)
  var chunkSize = 40000;
  var chunksRow = [];
  for (var i = 0; i < jsonString.length; i += chunkSize) {
    chunksRow.push(jsonString.substring(i, i + chunkSize));
  }
  if (chunksRow.length > 0) {
    dbSheet.getRange(2, 1, 1, chunksRow.length).setValues([chunksRow]);
  }
  // Thu gọn chiều cao dòng 2 để không vướng mắt
  dbSheet.setRowHeight(2, 18);

  // 3. Dòng 3: Dòng đệm ngăn cách trắng tinh
  dbSheet.setRowHeight(3, 12);

  // 4. Dòng 4: BẢNG KIỂM SOÁT HỒ SƠ & TÀI KHOẢN HỌC SINH TỔNG HỢP (Gộp từ Cột A đến Cột G)
  var bannerText = [["BẢNG KIỂM SOÁT HỒ SƠ & TÀI KHOẢN HỌC SINH TỔNG HỢP", "", "", "", "", "", ""]];
  dbSheet.getRange(4, 1, 1, 7).setValues(bannerText);
  var banner = dbSheet.getRange(4, 1, 1, 7);
  banner.merge();
  banner.setFontWeight("bold");
  banner.setFontSize(11);
  banner.setHorizontalAlignment("center");
  banner.setVerticalAlignment("middle");
  banner.setBackground("#d1fae5");
  banner.setFontColor("#065f46");
  dbSheet.setRowHeight(4, 34);

  // 5. Dòng 5: Tiêu đề cột từ Cột A đến Cột G (STT, Lớp, Mã HS, Ảnh thẻ, Họ và tên, Số ĐT, Trạng thái ảnh)
  var subHeader = [["STT", "Lớp", "Mã HS", "Ảnh thẻ", "Họ và tên", "Số ĐT", "Trạng thái ảnh"]];
  dbSheet.getRange(5, 1, 1, 7).setValues(subHeader);
  var headerRange = dbSheet.getRange(5, 1, 1, 7);
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  headerRange.setVerticalAlignment("middle");
  headerRange.setBackground("#f8fafc");
  headerRange.setFontColor("#1e293b");
  dbSheet.setRowHeight(5, 28);

  dbSheet.setColumnWidth(1, 45);  // A: STT
  dbSheet.setColumnWidth(2, 75);  // B: Lớp
  dbSheet.setColumnWidth(3, 95);  // C: Mã HS
  dbSheet.setColumnWidth(4, 75);  // D: Ảnh thẻ
  dbSheet.setColumnWidth(5, 200); // E: Họ và tên
  dbSheet.setColumnWidth(6, 115); // F: Số ĐT
  dbSheet.setColumnWidth(7, 140); // G: Trạng thái ảnh

  // 6. Từ Dòng 6 trở đi: Danh sách học sinh toàn trường
  var photoRow = 6;
  if (appData && appData.classes) {
    var globalIndex = 1;
    appData.classes.forEach(function(c) {
      var students = c.students || [];
      students.forEach(function(st) {
        var hasImg = st.avatar && typeof st.avatar === "string" && st.avatar.indexOf("data:image") === 0;
        var statusText = hasImg ? "✅ Đã có ảnh Base64" : "⚪ Chưa có ảnh";
        
        dbSheet.getRange(photoRow, 1, 1, 7).setValues([[
          globalIndex,
          c.name,
          st.studentCode || "",
          "",
          st.fullName,
          st.phoneNumber || "",
          statusText
        ]]);

        dbSheet.setRowHeight(photoRow, 36);

        if (hasImg) {
          try {
            var cellImg = SpreadsheetApp.newCellImage().setSourceUrl(st.avatar).build();
            dbSheet.getRange(photoRow, 4).setValue(cellImg);
          } catch(err) {
            dbSheet.getRange(photoRow, 4).setValue("📸");
          }
        } else {
          dbSheet.getRange(photoRow, 4).setValue("—");
        }

        globalIndex++;
        photoRow++;
      });
    });

    if (photoRow > 6) {
      dbSheet.getRange(6, 1, photoRow - 6, 3).setHorizontalAlignment("center"); // STT, Lớp, Mã HS
      dbSheet.getRange(6, 4, photoRow - 6, 1).setHorizontalAlignment("center"); // Ảnh thẻ
      dbSheet.getRange(6, 5, photoRow - 6, 1).setHorizontalAlignment("left");   // Họ tên
      dbSheet.getRange(6, 6, photoRow - 6, 2).setHorizontalAlignment("center"); // SĐT, Trạng thái

      dbSheet.getRange(5, 1, photoRow - 5, 7).setBorder(
        true, true, true, true, true, true,
        "#cbd5e1",
        SpreadsheetApp.BorderStyle.SOLID
      );
    }
  }
}

// Đọc dữ liệu JSON từ sheet _DATABASE_
function loadDatabase(ss) {
  var dbSheet = ss.getSheetByName("_DATABASE_");
  if (!dbSheet) return null;
  
  // 1. Kiểm tra định dạng chuẩn mới: Dàn ngang ở dòng 2 (A2, B2, C2...)
  try {
    var maxCol = Math.max(dbSheet.getLastColumn(), 20);
    var row2Values = dbSheet.getRange(2, 1, 1, maxCol).getValues()[0];
    var joinedRow2 = "";
    for (var col = 0; col < row2Values.length; col++) {
      if (row2Values[col] && typeof row2Values[col] === "string") {
        joinedRow2 += row2Values[col];
      }
    }
    if (joinedRow2 && joinedRow2.indexOf("{") === 0) {
      return joinedRow2;
    }
  } catch(e2) {}

  // 2. Kiểm tra định dạng cũ: Cột A dòng 2 trở xuống (trước khi nâng cấp)
  var lastRow = dbSheet.getLastRow();
  if (lastRow > 1) {
    try {
      var values = dbSheet.getRange(2, 1, Math.min(lastRow - 1, 10), 1).getValues();
      var jsonVertical = "";
      for (var i = 0; i < values.length; i++) {
        if (values[i][0] && typeof values[i][0] === "string") jsonVertical += values[i][0];
      }
      if (jsonVertical && jsonVertical.indexOf("{") === 0) {
        return jsonVertical;
      }
    } catch(eV) {}
  }
  
  // 3. Fallback phiên bản cũ ở ô A1
  var cell1 = dbSheet.getRange(1, 1).getValue();
  if (cell1 && typeof cell1 === "string" && cell1.indexOf("{") === 0) {
    return cell1;
  }
  return null;
}

// Đồng bộ các trang tính cho tất cả các lớp (TỰ ĐỘNG DỌN DẸP TRANG TÍNH KHI XÓA LỚP TRÊN WEB)
function syncToSheet(ss, appData) {
  if (!ss || !appData || !appData.classes) return;

  // 1. Xóa sheet Kho Ảnh Thẻ nếu tồn tại từ các phiên bản trước
  try {
    var oldPhotoSheet = ss.getSheetByName("Kho Ảnh Thẻ Học Sinh");
    if (oldPhotoSheet) ss.deleteSheet(oldPhotoSheet);
  } catch(e) {}

  // 2. Tự động dọn dẹp các trang tính của lớp đã bị xóa trên Web
  var validClassSheets = { "_DATABASE_": true };
  (appData.classes || []).forEach(function(cls) {
    if (cls && cls.name) {
      validClassSheets[cls.name + " - Danh Sách"] = true;
      validClassSheets[cls.name + " - Điểm HK1"] = true;
      validClassSheets[cls.name + " - Điểm HK2 & Cả Năm"] = true;
      validClassSheets[cls.name + " - Điểm HK2"] = true;
      validClassSheets[cls.name + " - Sơ Đồ Lớp"] = true;
      validClassSheets[cls.name + " - Sơ đồ lớp"] = true;
    }
  });

  var allSheets = ss.getSheets();
  for (var i = 0; i < allSheets.length; i++) {
    var currentSh = allSheets[i];
    var currentName = currentSh.getName();
    
    if (currentName === "_DATABASE_") continue;

    // Nhận diện nếu tên trang tính thuộc mẫu định dạng trang của một lớp học
    var isClassRelated = (
      currentName.indexOf(" - Danh Sách") !== -1 ||
      currentName.indexOf(" - Điểm HK1") !== -1 ||
      currentName.indexOf(" - Điểm HK2 & Cả Năm") !== -1 ||
      currentName.indexOf(" - Điểm HK2") !== -1 ||
      currentName.indexOf(" - Sơ Đồ Lớp") !== -1 ||
      currentName.indexOf(" - Sơ đồ lớp") !== -1
    );

    // Nếu trang tính này thuộc về một lớp đã bị xóa trên web -> Xóa bỏ khỏi Google Sheet
    if (isClassRelated && !validClassSheets[currentName]) {
      if (ss.getSheets().length > 1) {
        try {
          ss.deleteSheet(currentSh);
        } catch(delErr) {}
      }
    }
  }

  // 3. Tạo hoặc cập nhật các trang tính cho từng lớp đang hoạt động
  appData.classes.forEach(function(cls) {
    syncClassStudents(ss, cls);
    syncClassGradesHK1(ss, cls);
    syncClassGradesHK2(ss, cls);
    syncClassSeating(ss, cls);
  });
}

function syncClassStudents(ss, cls) {
  var sheetName = cls.name + " - Danh Sách";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  
  // Xóa nội dung cũ và hủy các ô gộp trước đó để bảng tính chuẩn xác
  sheet.clear();
  try {
    sheet.getRange(1, 1, Math.max(sheet.getMaxRows(), 60), Math.max(sheet.getMaxColumns(), 12)).breakApart();
  } catch(e) {}

  var totalCols = 9;
  var allRows = [];
  
  // Hàng 1: Tiêu đề lớp (gộp ô từ cột 1 đến 9)
  allRows.push(["DANH SÁCH HỌC SINH LỚP " + cls.name.toUpperCase(), "", "", "", "", "", "", "", ""]);
  
  // Hàng 2: Tiêu đề các cột (bao gồm Ảnh thẻ, Số ĐT, Mật khẩu tài khoản)
  allRows.push(["STT", "Mã HS", "Ảnh thẻ", "Họ và tên", "Giới tính", "Ngày sinh", "Số ĐT", "Mật khẩu", "Đặc điểm / Nhận dạng"]);
  
  // Sắp xếp học sinh chuẩn theo STT (tăng dần 1, 2, 3...)
  var sortedStudents = (cls.students || []).slice().sort(function(a, b) {
    var numA = parseInt(a.stt, 10);
    var numB = parseInt(b.stt, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return (a.fullName || "").localeCompare(b.fullName || "");
  });

  sortedStudents.forEach(function(st, idx) {
    allRows.push([
      idx + 1,
      st.studentCode || "",
      "",
      st.fullName || "",
      st.gender || "",
      st.dateOfBirth || "",
      st.phoneNumber || "",
      st.password || "123",
      st.note || ""
    ]);
  });

  // Ghi toàn bộ dữ liệu 1 lần (atomic batch write)
  sheet.getRange(1, 1, allRows.length, totalCols).setValues(allRows);

  // 1. Định dạng Hàng 1: Tiêu đề biểu ngữ gộp ô
  var banner = sheet.getRange(1, 1, 1, totalCols);
  banner.merge();
  banner.setFontWeight("bold");
  banner.setFontSize(13);
  banner.setHorizontalAlignment("center");
  banner.setVerticalAlignment("middle");
  banner.setBackground("#e0f2fe");
  banner.setFontColor("#0369a1");
  sheet.setRowHeight(1, 38);

  // 2. Định dạng Hàng 2: Hàng tiêu đề cột
  var header = sheet.getRange(2, 1, 1, totalCols);
  header.setFontWeight("bold");
  header.setFontSize(10);
  header.setHorizontalAlignment("center");
  header.setVerticalAlignment("middle");
  header.setBackground("#f1f5f9");
  header.setFontColor("#1e293b");
  sheet.setRowHeight(2, 28);

  // 3. Cố định độ rộng cột: STT 50px, Mã HS 95px, Ảnh thẻ 75px, Số ĐT 110px, Mật khẩu 90px
  sheet.setColumnWidth(1, 50);  // STT
  sheet.setColumnWidth(2, 95);  // Mã HS
  sheet.setColumnWidth(3, 75);  // Ảnh thẻ
  sheet.setColumnWidth(4, 210); // Họ và tên
  sheet.setColumnWidth(5, 80);  // Giới tính
  sheet.setColumnWidth(6, 100); // Ngày sinh
  sheet.setColumnWidth(7, 110); // Số ĐT
  sheet.setColumnWidth(8, 90);  // Mật khẩu
  sheet.setColumnWidth(9, 220); // Đặc điểm / Nhận dạng

  // 4. Kẻ viền, chèn ảnh thẻ trực tiếp và căn gióng dữ liệu học sinh
  if (sortedStudents.length > 0) {
    sortedStudents.forEach(function(st, idx) {
      var rowIdx = idx + 3;
      sheet.setRowHeight(rowIdx, 36);

      if (st.avatar && typeof st.avatar === "string" && st.avatar.indexOf("data:image") === 0) {
        try {
          var cellImg = SpreadsheetApp.newCellImage().setSourceUrl(st.avatar).build();
          sheet.getRange(rowIdx, 3).setValue(cellImg);
        } catch(imgErr) {
          sheet.getRange(rowIdx, 3).setValue("📸 Đã có");
        }
      } else {
        sheet.getRange(rowIdx, 3).setValue("—");
      }
    });

    var dataRange = sheet.getRange(3, 1, sortedStudents.length, totalCols);
    dataRange.setVerticalAlignment("middle");
    sheet.getRange(3, 1, sortedStudents.length, 3).setHorizontalAlignment("center"); // STT, Mã HS, Ảnh
    sheet.getRange(3, 4, sortedStudents.length, 1).setHorizontalAlignment("left");   // Họ tên
    sheet.getRange(3, 5, sortedStudents.length, 4).setHorizontalAlignment("center"); // Giới tính, Ngày sinh, SĐT, Mật khẩu
    sheet.getRange(3, 9, sortedStudents.length, 1).setHorizontalAlignment("left");   // Ghi chú
    
    sheet.getRange(2, 1, sortedStudents.length + 1, totalCols).setBorder(
      true, true, true, true, true, true,
      "#cbd5e1",
      SpreadsheetApp.BorderStyle.SOLID
    );
  }
}

function syncClassGradesHK1(ss, cls) {
  var sheetName = cls.name + " - Điểm HK1";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  sheet.clear();
  try {
    sheet.getRange(1, 1, Math.max(sheet.getMaxRows(), 60), Math.max(sheet.getMaxColumns(), 20)).breakApart();
  } catch(e) {}
  
  var cols = cls.scoreColumnsHK1 || [];
  var headers = ["STT", "Mã HS", "Họ và tên"];
  cols.forEach(function(c) {
    headers.push(c.name + " (HS" + c.weight + ")");
  });
  headers.push("ĐTB HK1");
  headers.push("Xếp loại");
  headers.push("Ghi chú / Nhận xét");
  var totalCols = headers.length;

  var allRows = [];
  var titleRow = ["BẢNG ĐIỂM MÔN TOÁN HỌC KÌ 1 - " + cls.name.toUpperCase()];
  for (var c = 1; c < totalCols; c++) titleRow.push("");
  allRows.push(titleRow);
  allRows.push(headers);
  
  var sortedStudents = (cls.students || []).slice().sort(function(a, b) {
    var numA = parseInt(a.stt, 10);
    var numB = parseInt(b.stt, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return (a.fullName || "").localeCompare(b.fullName || "");
  });

  sortedStudents.forEach(function(st, idx) {
    var row = [idx + 1, st.studentCode || "", st.fullName || ""];
    var grade = (cls.gradesHK1 && cls.gradesHK1[st.id]) ? cls.gradesHK1[st.id] : null;
    var scores = grade ? grade.scores : {};
    
    var sum = 0;
    var totalWeight = 0;
    cols.forEach(function(c) {
      var val = (scores && scores[c.id] !== undefined && scores[c.id] !== null) ? scores[c.id] : "";
      row.push(val);
      if (typeof val === "number" && !isNaN(val)) {
        sum += val * c.weight;
        totalWeight += c.weight;
      }
    });
    
    var avg = totalWeight > 0 ? (Math.round((sum / totalWeight) * 10) / 10) : "";
    var xepLoai = "";
    if (typeof avg === "number") {
      if (avg >= 8.0) xepLoai = "Giỏi";
      else if (avg >= 6.5) xepLoai = "Khá";
      else if (avg >= 5.0) xepLoai = "Đạt (TB)";
      else xepLoai = "Chưa đạt";
    }
    
    row.push(avg);
    row.push(xepLoai);
    row.push(grade ? (grade.finalNote || "") : "");
    allRows.push(row);
  });

  sheet.getRange(1, 1, allRows.length, totalCols).setValues(allRows);

  var banner = sheet.getRange(1, 1, 1, totalCols);
  banner.merge();
  banner.setFontWeight("bold");
  banner.setFontSize(13);
  banner.setHorizontalAlignment("center");
  banner.setVerticalAlignment("middle");
  banner.setBackground("#dcfce7");
  banner.setFontColor("#15803d");
  sheet.setRowHeight(1, 38);

  var header = sheet.getRange(2, 1, 1, totalCols);
  header.setFontWeight("bold");
  header.setFontSize(10);
  header.setHorizontalAlignment("center");
  header.setVerticalAlignment("middle");
  header.setBackground("#f1f5f9");
  header.setFontColor("#1e293b");
  sheet.setRowHeight(2, 28);

  sheet.setColumnWidth(1, 55);  // STT
  sheet.setColumnWidth(2, 110); // Mã HS
  sheet.setColumnWidth(3, 230); // Họ và tên
  for (var i = 0; i < cols.length; i++) {
    sheet.setColumnWidth(4 + i, 80);
  }
  sheet.setColumnWidth(4 + cols.length, 85);
  sheet.setColumnWidth(4 + cols.length + 1, 95);
  sheet.setColumnWidth(4 + cols.length + 2, 200);

  if (sortedStudents.length > 0) {
    sheet.getRange(3, 1, sortedStudents.length, 1).setHorizontalAlignment("center");
    sheet.getRange(3, 2, sortedStudents.length, 1).setHorizontalAlignment("center");
    sheet.getRange(3, 3, sortedStudents.length, 1).setHorizontalAlignment("left");
    sheet.getRange(3, 4, sortedStudents.length, cols.length + 2).setHorizontalAlignment("center");
    sheet.getRange(3, totalCols, sortedStudents.length, 1).setHorizontalAlignment("left");
    
    sheet.getRange(2, 1, sortedStudents.length + 1, totalCols).setBorder(
      true, true, true, true, true, true,
      "#cbd5e1",
      SpreadsheetApp.BorderStyle.SOLID
    );
  }
}

function syncClassGradesHK2(ss, cls) {
  var sheetName = cls.name + " - Điểm HK2 & Cả Năm";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  sheet.clear();
  try {
    sheet.getRange(1, 1, Math.max(sheet.getMaxRows(), 60), Math.max(sheet.getMaxColumns(), 20)).breakApart();
  } catch(e) {}
  
  var colsHK1 = cls.scoreColumnsHK1 || [];
  var colsHK2 = cls.scoreColumnsHK2 || [];
  
  var headers = ["STT", "Mã HS", "Họ và tên"];
  colsHK2.forEach(function(c) {
    headers.push(c.name + " (HS" + c.weight + ")");
  });
  headers.push("ĐTB HK2");
  headers.push("ĐTB HK1");
  headers.push("ĐTB CẢ NĂM");
  headers.push("Xếp loại Cả Năm");
  headers.push("Ghi chú / Nhận xét");
  var totalCols = headers.length;

  var allRows = [];
  var titleRow = ["BẢNG ĐIỂM MÔN TOÁN HỌC KÌ 2 & CẢ NĂM - " + cls.name.toUpperCase()];
  for (var c = 1; c < totalCols; c++) titleRow.push("");
  allRows.push(titleRow);
  allRows.push(headers);
  
  var sortedStudents = (cls.students || []).slice().sort(function(a, b) {
    var numA = parseInt(a.stt, 10);
    var numB = parseInt(b.stt, 10);
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
    return (a.fullName || "").localeCompare(b.fullName || "");
  });

  sortedStudents.forEach(function(st, idx) {
    var row = [idx + 1, st.studentCode || "", st.fullName || ""];
    
    // Tính ĐTB HK1
    var grade1 = (cls.gradesHK1 && cls.gradesHK1[st.id]) ? cls.gradesHK1[st.id] : null;
    var scores1 = grade1 ? grade1.scores : {};
    var sum1 = 0, weight1 = 0;
    colsHK1.forEach(function(c) {
      var v = scores1 ? scores1[c.id] : null;
      if (typeof v === "number" && !isNaN(v)) {
        sum1 += v * c.weight;
        weight1 += c.weight;
      }
    });
    var avgHK1 = weight1 > 0 ? (Math.round((sum1 / weight1) * 10) / 10) : null;
    
    // Tính ĐTB HK2
    var grade2 = (cls.gradesHK2 && cls.gradesHK2[st.id]) ? cls.gradesHK2[st.id] : null;
    var scores2 = grade2 ? grade2.scores : {};
    var sum2 = 0, weight2 = 0;
    colsHK2.forEach(function(c) {
      var val = (scores2 && scores2[c.id] !== undefined && scores2[c.id] !== null) ? scores2[c.id] : "";
      row.push(val);
      if (typeof val === "number" && !isNaN(val)) {
        sum2 += val * c.weight;
        weight2 += c.weight;
      }
    });
    var avgHK2 = weight2 > 0 ? (Math.round((sum2 / weight2) * 10) / 10) : null;
    
    // Tính ĐTB Cả Năm: (HK1 + HK2 * 2) / 3
    var avgYear = "";
    var xepLoaiYear = "";
    if (avgHK1 !== null && avgHK2 !== null) {
      avgYear = Math.round(((avgHK1 + avgHK2 * 2) / 3) * 10) / 10;
      if (avgYear >= 8.0) xepLoaiYear = "Giỏi";
      else if (avgYear >= 6.5) xepLoaiYear = "Khá";
      else if (avgYear >= 5.0) xepLoaiYear = "Đạt (TB)";
      else xepLoaiYear = "Chưa đạt";
    } else if (avgHK2 !== null) {
      avgYear = avgHK2;
    }
    
    row.push(avgHK2 !== null ? avgHK2 : "");
    row.push(avgHK1 !== null ? avgHK1 : "");
    row.push(avgYear);
    row.push(xepLoaiYear);
    row.push(grade2 ? (grade2.finalNote || "") : "");
    allRows.push(row);
  });

  sheet.getRange(1, 1, allRows.length, totalCols).setValues(allRows);

  var banner = sheet.getRange(1, 1, 1, totalCols);
  banner.merge();
  banner.setFontWeight("bold");
  banner.setFontSize(13);
  banner.setHorizontalAlignment("center");
  banner.setVerticalAlignment("middle");
  banner.setBackground("#fef3c7");
  banner.setFontColor("#b45309");
  sheet.setRowHeight(1, 38);

  var header = sheet.getRange(2, 1, 1, totalCols);
  header.setFontWeight("bold");
  header.setFontSize(10);
  header.setHorizontalAlignment("center");
  header.setVerticalAlignment("middle");
  header.setBackground("#f1f5f9");
  header.setFontColor("#1e293b");
  sheet.setRowHeight(2, 28);

  sheet.setColumnWidth(1, 55);  // STT
  sheet.setColumnWidth(2, 110); // Mã HS
  sheet.setColumnWidth(3, 230); // Họ và tên
  for (var j = 0; j < colsHK2.length; j++) {
    sheet.setColumnWidth(4 + j, 80);
  }
  sheet.setColumnWidth(4 + colsHK2.length, 85);
  sheet.setColumnWidth(4 + colsHK2.length + 1, 85);
  sheet.setColumnWidth(4 + colsHK2.length + 2, 95);
  sheet.setColumnWidth(4 + colsHK2.length + 3, 110);
  sheet.setColumnWidth(4 + colsHK2.length + 4, 200);

  if (sortedStudents.length > 0) {
    sheet.getRange(3, 1, sortedStudents.length, 1).setHorizontalAlignment("center");
    sheet.getRange(3, 2, sortedStudents.length, 1).setHorizontalAlignment("center");
    sheet.getRange(3, 3, sortedStudents.length, 1).setHorizontalAlignment("left");
    sheet.getRange(3, 4, sortedStudents.length, colsHK2.length + 4).setHorizontalAlignment("center");
    sheet.getRange(3, totalCols, sortedStudents.length, 1).setHorizontalAlignment("left");
    
    sheet.getRange(2, 1, sortedStudents.length + 1, totalCols).setBorder(
      true, true, true, true, true, true,
      "#cbd5e1",
      SpreadsheetApp.BorderStyle.SOLID
    );
  }
}

function syncClassSeating(ss, cls) {
  if (!cls.seating) return;
  var sheetName = cls.name + " - Sơ Đồ Lớp";
  var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
  sheet.clear();
  try {
    sheet.getRange(1, 1, Math.max(sheet.getMaxRows(), 35), Math.max(sheet.getMaxColumns(), 15)).breakApart();
  } catch(e) {}
  
  var cols = cls.seating.cols || 4;
  var rows = cls.seating.rows || 6;
  var totalCols = cols + 1;

  var allRows = [];
  var titleRow = ["SƠ ĐỒ BÀN HỌC LỚP " + cls.name.toUpperCase() + " (GÓC NHÌN TỪ BÀN GIÁO VIÊN Ở DƯỚI NHÌN LÊN)"];
  for (var c = 1; c < totalCols; c++) titleRow.push("");
  allRows.push(titleRow);

  var colHeaders = ["Vị trí"];
  for (var c = 1; c <= cols; c++) {
    colHeaders.push("Dãy " + c);
  }
  allRows.push(colHeaders);
  
  var studentMap = {};
  if (cls.students) {
    cls.students.forEach(function(s) {
      studentMap[s.id] = s.fullName + " (" + (s.studentCode || "") + ")";
    });
  }
  
  // Xếp các hàng từ trên xuống dưới (Hàng rows ... Hàng 2, Hàng 1) để Hàng 1 ở sát bàn giáo viên ở phía dưới
  for (var r = rows; r >= 1; r--) {
    var rowData = ["Hàng " + r + (r === 1 ? " (Sát bàn GV)" : "")];
    for (var col = 1; col <= cols; col++) {
      var key = r + "-" + col;
      var sId = cls.seating.seats ? cls.seating.seats[key] : null;
      rowData.push(sId && studentMap[sId] ? studentMap[sId] : "[Trống]");
    }
    allRows.push(rowData);
  }

  // Dòng dưới cùng: BÀN GIÁO VIÊN & BỤC GIẢNG
  var teacherRow = ["BÀN GIÁO VIÊN & BỤC GIẢNG (NƠI THẦY NGỒI QUAN SÁT LÊN CÁC DÃY BÀN)"];
  for (var c = 1; c < totalCols; c++) teacherRow.push("");
  allRows.push(teacherRow);

  sheet.getRange(1, 1, allRows.length, totalCols).setValues(allRows);

  var banner = sheet.getRange(1, 1, 1, totalCols);
  banner.merge();
  banner.setFontWeight("bold");
  banner.setFontSize(12);
  banner.setHorizontalAlignment("center");
  banner.setVerticalAlignment("middle");
  banner.setBackground("#f3e8ff");
  banner.setFontColor("#7e22ce");
  sheet.setRowHeight(1, 36);

  var header = sheet.getRange(2, 1, 1, totalCols);
  header.setFontWeight("bold");
  header.setHorizontalAlignment("center");
  header.setVerticalAlignment("middle");
  header.setBackground("#f1f5f9");
  sheet.setRowHeight(2, 28);

  sheet.setColumnWidth(1, 130);
  for (var k = 1; k <= cols; k++) {
    sheet.setColumnWidth(1 + k, 180);
  }

  var dataRange = sheet.getRange(3, 1, rows, totalCols);
  dataRange.setHorizontalAlignment("center");
  dataRange.setVerticalAlignment("middle");

  // Định dạng dòng BÀN GIÁO VIÊN ở dưới cùng
  var tRowIndex = rows + 3;
  var teacherBar = sheet.getRange(tRowIndex, 1, 1, totalCols);
  teacherBar.merge();
  teacherBar.setFontWeight("bold");
  teacherBar.setFontSize(11);
  teacherBar.setHorizontalAlignment("center");
  teacherBar.setVerticalAlignment("middle");
  teacherBar.setBackground("#fef3c7");
  teacherBar.setFontColor("#92400e");
  sheet.setRowHeight(tRowIndex, 34);

  sheet.getRange(2, 1, rows + 2, totalCols).setBorder(
    true, true, true, true, true, true,
    "#cbd5e1",
    SpreadsheetApp.BorderStyle.SOLID
  );
}

// =========================================================================
// HÀM ĐỒNG BỘ 2 CHIỀU: QUÉT DỮ LIỆU ĐIỂM & NHẬN XÉT ĐƯỢC SỬA TRÊN GOOGLE SHEETS
// =========================================================================
function syncFromVisualSheets(ss, appData) {
  if (!ss || !appData || !Array.isArray(appData.classes)) return;

  appData.classes.forEach(function(cls) {
    readGradesFromVisualSheet(ss, cls, "HK1");
    readGradesFromVisualSheet(ss, cls, "HK2");
    readStudentsFromVisualSheet(ss, cls);
  });
}

function readGradesFromVisualSheet(ss, cls, semester) {
  var sheetName = semester === "HK1" 
    ? (cls.name + " - Điểm HK1") 
    : (cls.name + " - Điểm HK2 & Cả Năm");
  
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet && semester === "HK2") {
    sheet = ss.getSheetByName(cls.name + " - Điểm HK2");
  }
  if (!sheet) return;

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 3 || lastCol < 4) return;

  var cols = (semester === "HK1" ? cls.scoreColumnsHK1 : cls.scoreColumnsHK2) || [];
  if (cols.length === 0) return;

  var gradesProp = semester === "HK1" ? "gradesHK1" : "gradesHK2";
  if (!cls[gradesProp]) cls[gradesProp] = {};

  var students = cls.students || [];
  var dataValues = sheet.getRange(3, 1, lastRow - 2, lastCol).getValues();

  dataValues.forEach(function(row) {
    var code = row[1] !== undefined && row[1] !== null ? String(row[1]).trim() : "";
    var name = row[2] !== undefined && row[2] !== null ? String(row[2]).trim() : "";
    if (!code && !name) return;

    var st = null;
    if (code) {
      for (var s = 0; s < students.length; s++) {
        if (students[s].studentCode && String(students[s].studentCode).trim() === code) {
          st = students[s];
          break;
        }
      }
    }
    if (!st && name) {
      for (var s = 0; s < students.length; s++) {
        if (students[s].fullName && String(students[s].fullName).trim() === name) {
          st = students[s];
          break;
        }
      }
    }
    if (!st) return;

    if (!cls[gradesProp][st.id]) {
      cls[gradesProp][st.id] = { scores: {}, finalNote: "" };
    }
    if (!cls[gradesProp][st.id].scores) {
      cls[gradesProp][st.id].scores = {};
    }

    // Đọc từng cột điểm (cột 4 trong sheet tương ứng index 3 trong dataValues)
    for (var c = 0; c < cols.length; c++) {
      var cellColIdx = 3 + c;
      if (cellColIdx < lastCol) {
        var rawVal = row[cellColIdx];
        if (rawVal !== "" && rawVal !== null && rawVal !== undefined && rawVal !== "—") {
          if (typeof rawVal === "string") {
            rawVal = rawVal.replace(",", ".");
          }
          var num = parseFloat(rawVal);
          if (!isNaN(num) && num >= 0 && num <= 10) {
            cls[gradesProp][st.id].scores[cols[c].id] = Math.round(num * 10) / 10;
          }
        } else if (rawVal === "" || rawVal === null) {
          cls[gradesProp][st.id].scores[cols[c].id] = null;
        }
      }
    }

    // Cột cuối cùng của bảng tính là "Ghi chú / Nhận xét"
    var noteVal = row[lastCol - 1];
    if (noteVal !== undefined && noteVal !== null && String(noteVal).trim() !== "") {
      cls[gradesProp][st.id].finalNote = String(noteVal).trim();
    }
  });
}

function readStudentsFromVisualSheet(ss, cls) {
  var sheetName = cls.name + " - Danh Sách";
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 3) return;

  var students = cls.students || [];
  var dataValues = sheet.getRange(3, 1, lastRow - 2, Math.min(lastCol, 9)).getValues();

  dataValues.forEach(function(row) {
    var code = row[1] !== undefined && row[1] !== null ? String(row[1]).trim() : "";
    var name = row[3] !== undefined && row[3] !== null ? String(row[3]).trim() : "";
    if (!code && !name) return;

    var st = null;
    if (code) {
      for (var s = 0; s < students.length; s++) {
        if (students[s].studentCode && String(students[s].studentCode).trim() === code) {
          st = students[s];
          break;
        }
      }
    }
    if (!st && name) {
      for (var s = 0; s < students.length; s++) {
        if (students[s].fullName && String(students[s].fullName).trim() === name) {
          st = students[s];
          break;
        }
      }
    }
    if (!st) return;

    // Cột 7 (index 6): Số ĐT, Cột 8 (index 7): Mật khẩu, Cột 9 (index 8): Ghi chú nhận dạng
    if (row[6] !== undefined && row[6] !== null && String(row[6]).trim() !== "") {
      st.phoneNumber = String(row[6]).trim();
    }
    if (row[7] !== undefined && row[7] !== null && String(row[7]).trim() !== "") {
      st.password = String(row[7]).trim();
    }
    if (row[8] !== undefined && row[8] !== null && String(row[8]).trim() !== "") {
      st.note = String(row[8]).trim();
    }
  });
}
`;

  const copyCodeToClipboard = () => {
    navigator.clipboard.writeText(sampleAppsScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        id="gs-manager-modal"
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col border border-slate-200"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">Quản Lý Mã GS & Đồng Bộ Google Sheets</h3>
              <p className="text-xs text-slate-500">Đồng bộ tự động dữ liệu lớp học qua Google Apps Script Web App</p>
            </div>
          </div>
          <button
            id="close-gs-manager-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-sm">
          {/* Notice about multi-device & gradebook sync */}
          <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-xl text-xs text-indigo-900 leading-relaxed flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold block text-indigo-950 mb-0.5">Đồng bộ đa thiết bị & Tự động ghi Bảng Điểm lên Google Sheet</span>
              Mã Google Apps Script phiên bản nâng cấp bên dưới tự động tạo đầy đủ các sheet: <strong>Danh sách</strong>, <strong>Điểm HK1</strong>, <strong>Điểm HK2 & Cả Năm</strong> và <strong>Sơ đồ lớp</strong> trực tiếp trên Google Sheet, đồng thời lưu trữ an toàn trong sheet <code>_DATABASE_</code> để khi mở trên bất kỳ máy tính nào cũng đồng bộ chính xác 100%.
            </div>
          </div>

          {/* Quick Action Bar */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs font-semibold text-slate-700 block">Thao tác dữ liệu đám mây</span>
                <span className="text-[11px] text-slate-500">Lưu lên hoặc tải về từ Google Sheets hiện tại</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  id="modal-fetch-sheet-btn"
                  type="button"
                  onClick={onSyncNow}
                  disabled={isSyncing}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                  title="Tải lại dữ liệu mới nhất từ Google Sheets"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Đang tải...' : 'Tải dữ liệu từ Sheet'}
                </button>
                <button
                  id="modal-save-sheet-btn"
                  type="button"
                  onClick={onSaveToSheetNow}
                  disabled={isSaving}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 shadow-2xs disabled:opacity-50"
                  title="Lưu tất cả danh sách và điểm lên Google Sheets"
                >
                  <Cloud className={`w-3.5 h-3.5 ${isSaving ? 'animate-pulse' : ''}`} />
                  {isSaving ? 'Đang lưu...' : 'Lưu dữ liệu lên Sheet'}
                </button>
              </div>
            </div>

            {/* Auto-Sync Toggle & Offline Backup */}
            <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoSyncEnabled}
                  onChange={(e) => onToggleAutoSync && onToggleAutoSync(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <span className="font-semibold text-slate-700">Tự động lưu lên Google Sheets sau khi chỉnh sửa</span>
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">Khuyên dùng</span>
              </label>

              {onExportBackup && (
                <button
                  type="button"
                  onClick={onExportBackup}
                  className="text-slate-600 hover:text-slate-900 font-medium underline text-[11px] flex items-center gap-1"
                >
                  Tải file sao lưu dự phòng (.json) về máy
                </button>
              )}
            </div>
          </div>

          {/* Cấu hình phân quyền hiển thị cho Khách (Chưa đăng nhập) */}
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs">
                <Shield className="w-4 h-4 text-indigo-700" />
                <span>Phân quyền hiển thị cho Khách vãng lai (Chưa đăng nhập)</span>
              </div>
              <span className="text-[10px] text-indigo-600 font-semibold bg-indigo-100 px-2 py-0.5 rounded-full">
                Quản trị Admin
              </span>
            </div>
            <p className="text-[11px] text-indigo-800">
              Quản trị viên có thể bật/tắt các mục mà khách chưa đăng nhập được phép xem khi truy cập trang web:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
              <label className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-indigo-100 shadow-2xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={guestPermissions.allowViewStudents !== false}
                  onChange={(e) => {
                    if (onUpdateGuestPermissions) {
                      onUpdateGuestPermissions({
                        ...guestPermissions,
                        allowViewStudents: e.target.checked,
                      });
                    }
                  }}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="font-semibold text-slate-700">Xem Danh Sách</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-indigo-100 shadow-2xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={guestPermissions.allowViewSeating !== false}
                  onChange={(e) => {
                    if (onUpdateGuestPermissions) {
                      onUpdateGuestPermissions({
                        ...guestPermissions,
                        allowViewSeating: e.target.checked,
                      });
                    }
                  }}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="font-semibold text-slate-700">Xem Sơ Đồ Lớp</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-indigo-100 shadow-2xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={guestPermissions.allowViewGradebook === true}
                  onChange={(e) => {
                    if (onUpdateGuestPermissions) {
                      onUpdateGuestPermissions({
                        ...guestPermissions,
                        allowViewGradebook: e.target.checked,
                      });
                    }
                  }}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                />
                <span className="font-semibold text-slate-700">Xem Sổ Điểm</span>
              </label>
            </div>
          </div>

          {/* Giải đáp câu hỏi về lưu trữ & cập nhật cấu trúc sheet */}
          <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-xl text-xs text-emerald-950 leading-relaxed space-y-2.5">
            <div className="flex items-center gap-2 text-emerald-950 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Nâng cấp đồng bộ theo yêu cầu mới nhất của Thầy:</span>
            </div>
            <ul className="list-disc list-inside space-y-1.5 text-emerald-900 text-[11px] pl-1">
              <li className="bg-amber-100/70 p-2 rounded-lg border border-amber-200 text-amber-950 font-medium">
                <strong>⚡ Hỗ trợ sửa điểm trên Sheet & tải về Web:</strong> Khi Thầy/Cô sửa điểm trực tiếp trên các sheet bảng điểm của Google Sheet, hãy cập nhật mã Apps Script mới nhất (bằng cách bấm <em>"Xem & Sao chép mã"</em> phía dưới, dán vào Apps Script và Triển khai phiên bản mới). Khi đó, mỗi lần bấm <strong>"Tải dữ liệu mới về"</strong> trên web, toàn bộ điểm số vừa sửa trên Sheet sẽ được đọc và cập nhật vào web!
              </li>
              <li>
                <strong>Cơ sở dữ liệu ở sheet <code>_DATABASE_</code>:</strong> Đã chuẩn hóa toàn diện: Dòng 1 là ghi chú hệ thống, Dòng 2 chứa mã JSON thu gọn, <strong>Bảng kiểm soát hồ sơ học sinh được đẩy xuống từ Dòng 4 và căn thẳng từ Cột A đến Cột G</strong>. Không còn tình trạng cột A, B bị trống các hàng sau làm mất thẩm mỹ.
              </li>
              <li>
                <strong>Bỏ sheet Kho Ảnh Thẻ:</strong> Không còn tạo thêm sheet kho ảnh thẻ riêng lẻ, toàn bộ thông tin ảnh thẻ, số điện thoại, mật khẩu đều được tích hợp đầy đủ trong từng danh sách lớp.
              </li>
              <li>
                <strong>Sơ đồ lớp học:</strong> Được thiết kế chuẩn với góc nhìn từ <strong>Bàn giáo viên ở dưới màn hình</strong> nhìn lên các dãy bàn học sinh.
              </li>
              <li>
                <strong>Tài khoản học sinh:</strong> Học sinh đăng nhập bằng mã số (VD: <code>10A1-01</code>, pass mặc định <code>123</code>), được xem điểm cá nhân và tự sửa ảnh thẻ, ngày sinh, số điện thoại rồi tải lên Google Sheets.
              </li>
            </ul>
          </div>

          {/* Form configure URL and Update Note */}
          <form onSubmit={handleSave} className="space-y-4">
            {/* Hiển thị URL cố định trong mã nguồn (Đã bỏ ô nhập URL theo yêu cầu) */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>URL Web App Google Apps Script</span>
                </label>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                  🔒 Cố định trong mã nguồn
                </span>
              </div>
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg text-xs font-mono text-slate-700 break-all select-all flex items-center justify-between gap-2 shadow-2xs">
                <span className="truncate">{DEFAULT_GS_URL}</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Hệ thống luôn sử dụng URL exec lưu cố định trong mã nguồn. Bạn không cần phải dán hay cấu hình URL thủ công trên giao diện.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ghi chú nhật ký cập nhật (Tùy chọn)
              </label>
              <input
                id="gs-note-input"
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Ví dụ: Đồng bộ thêm lớp mới hoặc cập nhật điểm số..."
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              />
            </div>

            {saveSuccess && (
              <div className="p-2.5 bg-emerald-50 text-emerald-700 text-xs rounded-lg border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Đã lưu ghi chú thành công vào lịch sử!</span>
              </div>
            )}

            {testResult && (
              <div className={`p-3 text-xs rounded-lg border flex items-start gap-2 ${
                testResult.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 leading-relaxed">
                  <div className="font-semibold">{testResult.success ? 'Kết nối thành công!' : 'Kết nối thất bại:'}</div>
                  <div>{testResult.message}</div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <button
                id="test-gs-connection-btn"
                type="button"
                onClick={handleTest}
                disabled={testing}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                {testing ? 'Đang kiểm tra...' : 'Kiểm tra kết nối Google Sheets'}
              </button>

              <button
                id="save-gs-config-btn"
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
              >
                Lưu ghi chú
              </button>
            </div>
          </form>

          {/* History of updates */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3 text-xs font-bold text-slate-800">
              <History className="w-4 h-4 text-slate-500" />
              <span>Lịch sử cập nhật ghi chú đầu mã GS</span>
            </div>

            {config.notesHistory && config.notesHistory.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {config.notesHistory.map((item: ScriptUpdateLog) => (
                  <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs">
                    <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                      <span className="font-medium text-slate-700">{item.timestamp}</span>
                    </div>
                    <p className="font-medium text-slate-800 mb-1">{item.note}</p>
                    <p className="font-mono text-[10px] text-slate-500 truncate">{item.url}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Chưa có lịch sử thay đổi.</p>
            )}
          </div>

          {/* Apps Script Code Template Reference */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-indigo-50/80 rounded-xl border border-indigo-100">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-indigo-700 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-indigo-950 flex items-center gap-2">
                    <span>Mã Google Apps Script mới nhất</span>
                    <span className="text-[10px] font-semibold bg-indigo-200/80 text-indigo-800 px-2 py-0.5 rounded-full">
                      {SCRIPT_CODE_LAST_MODIFIED}
                    </span>
                  </div>
                  <div className="text-[11px] text-indigo-800">
                    Đã cập nhật tự động dọn dẹp trang tính khi xóa lớp trên Web
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={copyCodeToClipboard}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Đã sao chép mã!' : 'Sao chép toàn bộ mã'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-indigo-700 font-semibold text-xs rounded-lg border border-indigo-200 transition-colors"
                >
                  {showCode ? 'Thu gọn' : 'Xem mã'}
                </button>
              </div>
            </div>

            {showCode && (
              <div className="mt-2 bg-slate-900 rounded-lg p-4 text-slate-200 font-mono text-xs overflow-x-auto relative max-h-96">
                <button
                  type="button"
                  onClick={copyCodeToClipboard}
                  className="absolute right-3 top-3 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded flex items-center gap-1 border border-slate-700"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Đã sao chép' : 'Sao chép mã'}</span>
                </button>
                <pre className="mt-6 text-[11px] leading-relaxed whitespace-pre">{sampleAppsScriptCode}</pre>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/50 rounded-b-xl">
          <button
            id="close-gs-manager-footer-btn"
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
