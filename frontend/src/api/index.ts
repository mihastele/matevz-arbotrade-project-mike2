import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // Add guest token for cart
    const guestToken = localStorage.getItem('guestToken')
    if (guestToken) {
      config.headers['x-guest-token'] = guestToken
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only force logout on 401 for endpoints that strictly require authentication
    // Don't logout for optional-auth endpoints (cart, payments, orders) - these allow guest access
    const optionalAuthPaths = ['/cart', '/payments', '/orders'];
    const requestUrl = error.config?.url || '';
    const isOptionalAuthEndpoint = optionalAuthPaths.some(path => requestUrl.includes(path));
    
    if (error.response?.status === 401 && !isOptionalAuthEndpoint) {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
