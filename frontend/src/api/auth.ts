import api from './index'
import type { LoginCredentials, RegisterData, User, AuthResponse } from '@/types'

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials)
    return data
  },

  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/register', userData)
    return data
  },

  getMe: async (): Promise<User> => {
    const { data } = await api.get<User>('/auth/me')
    return data
  },

  refresh: async (): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/refresh')
    return data
  },
}

export const usersApi = {
  updateProfile: (data: Partial<User>) => {
    return api.patch<User>('/users/me', data)
  },

  updatePassword: (data: { currentPassword: string; newPassword: string }) => {
    return api.post('/users/me/password', data)
  },
}
