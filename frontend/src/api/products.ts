import api from './index'
import type { Product, PaginatedResponse, ProductsQuery } from '@/types'

export const productsApi = {
  getAll: async (query?: ProductsQuery): Promise<PaginatedResponse<Product>> => {
    const { data } = await api.get<PaginatedResponse<Product>>('/products', { params: query })
    return data
  },

  getOne: async (id: string): Promise<Product> => {
    const { data } = await api.get<Product>(`/products/${id}`)
    return data
  },

  getBySlug: async (slug: string): Promise<Product> => {
    const { data } = await api.get<Product>(`/products/slug/${slug}`)
    return data
  },

  getFeatured: async (limit = 8): Promise<Product[]> => {
    const { data } = await api.get<Product[]>('/products/featured', { params: { limit } })
    return data
  },

  getRelated: async (productId: string, limit = 4): Promise<Product[]> => {
    const { data } = await api.get<Product[]>(`/products/${productId}/related`, { params: { limit } })
    return data
  },

  create: async (product: Partial<Product>): Promise<Product> => {
    const { data } = await api.post<Product>('/products', product)
    return data
  },

  update: async (id: string, product: Partial<Product>): Promise<Product> => {
    const { data } = await api.patch<Product>(`/products/${id}`, product)
    return data
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`)
  },

  updateStock: async (id: string, quantity: number): Promise<Product> => {
    const { data } = await api.patch<Product>(`/products/${id}/stock`, { quantity })
    return data
  },
}
