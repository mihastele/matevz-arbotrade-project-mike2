import api from './index'
import type { Category } from '@/types'

export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    const { data } = await api.get<Category[]>('/categories')
    return data
  },

  getTree: async (): Promise<Category[]> => {
    const { data } = await api.get<Category[]>('/categories/tree')
    return data
  },

  getOne: async (id: string): Promise<Category> => {
    const { data } = await api.get<Category>(`/categories/${id}`)
    return data
  },

  getBySlug: async (slug: string): Promise<Category> => {
    const { data } = await api.get<Category>(`/categories/slug/${slug}`)
    return data
  },

  create: async (category: Partial<Category>): Promise<Category> => {
    const { data } = await api.post<Category>('/categories', category)
    return data
  },

  update: async (id: string, category: Partial<Category>): Promise<Category> => {
    const { data } = await api.patch<Category>(`/categories/${id}`, category)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/categories/${id}`)
  },
}
