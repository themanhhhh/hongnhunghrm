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
        if (response.status >= 500) return getMockResponse('GET', endpoint);
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
        if (response.status >= 500) return getMockResponse('POST', endpoint, data);
        return json || { success: false, message: `HTTP error ${response.status}` };
      }
      try { getMockResponse('POST', endpoint, data); } catch (e) {}
      return json;
    } catch (err) {
      console.warn(`⚠️ [API] POST ${endpoint} không kết nối được server thật - chuyển sang dữ liệu mock:`, err.message);
      return getMockResponse('POST', endpoint, data);
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
        if (response.status >= 500) return getMockResponse('PUT', endpoint, data);
        return json || { success: false, message: `HTTP error ${response.status}` };
      }
      try { getMockResponse('PUT', endpoint, data); } catch (e) {}
      return json;
    } catch (err) {
      console.warn(`⚠️ [API] PUT ${endpoint} không kết nối được server thật - chuyển sang dữ liệu mock:`, err.message);
      return getMockResponse('PUT', endpoint, data);
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
        if (response.status >= 500) return getMockResponse('DELETE', endpoint);
        return json || { success: false, message: `HTTP error ${response.status}` };
      }
      try { getMockResponse('DELETE', endpoint); } catch (e) {}
      return json;
    } catch (err) {
      console.warn(`⚠️ [API] DELETE ${endpoint} không kết nối được server thật - chuyển sang dữ liệu mock:`, err.message);
      return getMockResponse('DELETE', endpoint);
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
        if (response.status >= 500) return { success: true, data: { avatarUrl: URL.createObjectURL(formData.get('avatar')) }, mock: true };
        return json || { success: false, message: `HTTP error ${response.status}` };
      }
      return json;
    } catch (err) {
      console.warn(`⚠️ [API] Upload ${endpoint} không kết nối được server thật - dùng preview cục bộ:`, err.message);
      return { success: true, data: { avatarUrl: URL.createObjectURL(formData.get('avatar')) }, mock: true };
    }
  },

  uploadInterviewFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch(`${API_BASE_URL}/recruitment/interview-files`, {
        method: 'POST',
        headers: getHeaders(true),
        body: formData
      });
      const json = await response.json();
      if (!response.ok || !json?.success || !json?.data?.fileUrl) {
        return json || { success: false, message: `HTTP error ${response.status}` };
      }
      return json;
    } catch (err) {
      console.warn(`⚠️ [API] Upload tệp bài thi không kết nối được server - dùng preview cục bộ:`, err.message);
      return { success: true, data: { fileName: file.name, fileUrl: URL.createObjectURL(file) }, mock: true };
    }
  }
};
