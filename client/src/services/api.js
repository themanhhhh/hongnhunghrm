import { getMockResponse } from './mockStore';

// Đọc từ file .env của client (biến VITE_API_URL), nếu không có thì mới dùng giá trị mặc định cho local dev.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = (isMultipart = false) => {
  const token = localStorage.getItem('bravo_hrm_token');
  const headers = {};
  if (!isMultipart) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  get: async (endpoint) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: getHeaders()
      });
      const json = await response.json();
      if (!response.ok) {
        return json || { success: false, message: `HTTP error ${response.status}` };
      }
      return json;
    } catch (err) {
      console.warn(`⚠️ [API] Không kết nối được server thật cho GET ${endpoint} - đang hiển thị dữ liệu mẫu (mock). Lỗi:`, err.message);
      return getMockResponse('GET', endpoint);
    }
  },

  post: async (endpoint, data) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      const json = await response.json();
      if (!response.ok) {
        return json || { success: false, message: `HTTP error ${response.status}` };
      }
      try { getMockResponse('POST', endpoint, data); } catch (e) {}
      return json;
    } catch (err) {
      console.error(`❌ [API] Không lưu được dữ liệu (POST ${endpoint}) - server không phản hồi:`, err.message);
      return { success: false, message: 'Không thể kết nối tới server. Dữ liệu CHƯA được lưu, vui lòng thử lại.' };
    }
  },

  put: async (endpoint, data) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      const json = await response.json();
      if (!response.ok) {
        return json || { success: false, message: `HTTP error ${response.status}` };
      }
      try { getMockResponse('PUT', endpoint, data); } catch (e) {}
      return json;
    } catch (err) {
      console.error(`❌ [API] Không cập nhật được dữ liệu (PUT ${endpoint}) - server không phản hồi:`, err.message);
      return { success: false, message: 'Không thể kết nối tới server. Thay đổi CHƯA được lưu, vui lòng thử lại.' };
    }
  },

  delete: async (endpoint) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const json = await response.json();
      if (!response.ok) {
        return json || { success: false, message: `HTTP error ${response.status}` };
      }
      try { getMockResponse('DELETE', endpoint); } catch (e) {}
      return json;
    } catch (err) {
      console.error(`❌ [API] Không xóa được dữ liệu (DELETE ${endpoint}) - server không phản hồi:`, err.message);
      return { success: false, message: 'Không thể kết nối tới server. Bản ghi CHƯA được xóa, vui lòng thử lại.' };
    }
  },

  upload: async (endpoint, formData) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: getHeaders(true),
        body: formData
      });
      const json = await response.json();
      if (!response.ok) {
        return json || { success: false, message: `HTTP error ${response.status}` };
      }
      return json;
    } catch (err) {
      console.error(`❌ [API] Không tải file lên được (upload ${endpoint}) - server không phản hồi:`, err.message);
      return { success: false, message: 'Không thể kết nối tới server. File CHƯA được tải lên, vui lòng thử lại.' };
    }
  }
};