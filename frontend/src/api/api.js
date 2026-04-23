import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
});

// Add a request interceptor to add the token
api.interceptors.request.use(
  (config) => {
    const authStorage = JSON.parse(localStorage.getItem('auth-storage'));
    const token = authStorage?.state?.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle automated token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If we receive a 401 (Unauthorized) and haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const authStorageStr = localStorage.getItem('auth-storage');
        if (!authStorageStr) throw new Error('No auth storage');
        
        const authStorage = JSON.parse(authStorageStr);
        const refreshToken = authStorage?.state?.refreshToken;
        
        if (!refreshToken) throw new Error('No refresh token');

        // Request a new access token
        const res = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken });
        
        // Update local storage with new tokens
        const newTokens = res.data.data;
        authStorage.state.accessToken = newTokens.accessToken;
        authStorage.state.refreshToken = newTokens.refreshToken;
        localStorage.setItem('auth-storage', JSON.stringify(authStorage));

        // Retry the original request with the new access token
        originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
        return api(originalRequest);
        
      } catch (refreshErr) {
        // If refresh fails (e.g., refresh token expired or invalid), clear storage and force login
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
