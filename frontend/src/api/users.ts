import api from './index'
import type { User } from '@/types'

export interface UpdateUserDto {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  role?: 'customer' | 'admin'
}

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const { data } = await api.get<User[]>('/users')
    return data
  },

  getOne: async (id: string): Promise<User> => {
    const { data } = await api.get<User>(`/users/${id}`)
    return data
  },

  update: async (id: string, userData: UpdateUserDto): Promise<User> => {
    const { data } = await api.patch<User>(`/users/${id}`, userData)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`)
  },
}
