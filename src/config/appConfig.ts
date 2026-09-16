/**
 * =========================================================================
 * FILE CẤU HÌNH TẬP TRUNG HỆ THỐNG (APP CONFIG)
 * =========================================================================
 * Bất cứ khi nào muốn thay đổi:
 *  1. Mã Web App Google Apps Script (URL exec)
 *  2. Mật khẩu Quản trị viên (Admin) mặc định
 *  3. Mật khẩu Học sinh mặc định
 *  4. Ngày giờ cập nhật mã Apps Script
 *
 * 👉 Thầy chỉ cần chỉnh sửa tại DUY NHẤT file này! 
 * Cả giao diện Web (Frontend) và Máy chủ trung gian (Server Proxy) 
 * sẽ tự động nhận cấu hình mới ngay lập tức.
 * =========================================================================
 */

export const APP_CONFIG = {
  // 1. Đường dẫn Web App Google Apps Script kết nối với Google Sheets
  DEFAULT_GS_URL: "https://script.google.com/macros/s/AKfycbysYIHahZkJdW3Zau38mBBXswpiRI0dCIH8GMbQCBA_ntVLv5qlgsoz0Q3f7H7MbMSbdg/exec",

  // 2. Mật khẩu Admin / Giáo viên mặc định
  DEFAULT_ADMIN_PIN: "Huy0909!@",

  // 3. Mật khẩu Học sinh mặc định khi đăng nhập mã số học sinh
  DEFAULT_STUDENT_PIN: "123",

  // 4. Mốc ngày giờ lập trình viên cập nhật mã Apps Script
  SCRIPT_CODE_LAST_MODIFIED: "16/09/2026 lúc 23:25:00",
};

// Xuất các biến riêng biệt để tiện tái sử dụng trong toàn bộ hệ thống:
export const DEFAULT_GS_URL = APP_CONFIG.DEFAULT_GS_URL;
export const DEFAULT_ADMIN_PIN = APP_CONFIG.DEFAULT_ADMIN_PIN;
export const DEFAULT_STUDENT_PIN = APP_CONFIG.DEFAULT_STUDENT_PIN;
export const SCRIPT_CODE_LAST_MODIFIED = APP_CONFIG.SCRIPT_CODE_LAST_MODIFIED;
