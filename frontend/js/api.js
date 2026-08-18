// API URLs
const LOCAL_API_BASE = 'http://localhost:8099/api';
const RENDER_API_BASE = 'https://employee-management-system-api-jl72.onrender.com/api';

// Automatically select the correct backend
const API_BASE = window.location.hostname === 'localhost'
  ? LOCAL_API_BASE
  : RENDER_API_BASE;
async function apiRequest(path, options = {}) {
  const config = {
    ...options,
    headers: {
      ...(options.body
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...(options.headers || {}),
    },
  };

  const res = await fetch(`${API_BASE}${path}`, config);

  if (!res.ok) {
    let message = `Request failed (${res.status})`;

    try {
      const body = await res.json();
      message = body.message || JSON.stringify(body.errors) || message;
    } catch (_) {
      // No JSON response
    }

    throw new Error(message);
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
}