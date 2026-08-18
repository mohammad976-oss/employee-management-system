// API URLs
const LOCAL_API_BASE = 'http://localhost:8099/api';
const RENDER_API_BASE = 'https://employee-management-system-api-jl72.onrender.com/api';

// Automatically select the correct backend
const API_BASE = window.location.hostname === 'localhost'
  ? LOCAL_API_BASE
  : RENDER_API_BASE;

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;

    try {
      const body = await res.json();
      message = body.message || JSON.stringify(body.errors) || message;
    } catch (_) {
      /* no JSON body */
    }

    throw new Error(message);
  }

  if (res.status === 204) return null;

  return res.json();
}

const api = {
  // Departments
  getDepartments: () => apiRequest('/departments'),

  createDepartment: (data) =>
    apiRequest('/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateDepartment: (id, data) =>
    apiRequest(`/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteDepartment: (id) =>
    apiRequest(`/departments/${id}`, {
      method: 'DELETE',
    }),

  // Employees
  getEmployees: () => apiRequest('/employees'),

  createEmployee: (data) =>
    apiRequest('/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateEmployee: (id, data) =>
    apiRequest(`/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteEmployee: (id) =>
    apiRequest(`/employees/${id}`, {
      method: 'DELETE',
    }),

  // Attendance
  getAttendance: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/attendance${qs ? '?' + qs : ''}`);
  },

  markAttendance: (data) =>
    apiRequest('/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteAttendance: (id) =>
    apiRequest(`/attendance/${id}`, {
      method: 'DELETE',
    }),

  // Payroll
  getPayroll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/payroll${qs ? '?' + qs : ''}`);
  },

  generatePayroll: (data) =>
    apiRequest('/payroll/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deletePayroll: (id) =>
    apiRequest(`/payroll/${id}`, {
      method: 'DELETE',
    }),
};