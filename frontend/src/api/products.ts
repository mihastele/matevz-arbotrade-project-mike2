import api from './index'
import type { Product, PaginatedResponse, ProductsQuery } from '@/types'

export interface ImportResult {
  success: number
  failed: number
  errors: Array<{ row: number; error: string; name?: string }>
}



export interface ImportResultV3 extends ImportResult {
  imagesImported: number
  imagesFailed: number
  message?: string
}


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

  // Import/Export methods
  importCSV: async (file: File): Promise<ImportResult> => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await api.post<ImportResult>('/products/import/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  importZIP: async (file: File): Promise<ImportResult> => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await api.post<ImportResult>('/products/import/zip', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  // Skyman Index ZIP import with local images from index.csv
  // ZIP should contain: index.csv (merged product + image_paths) and images/ folder
  importSkymanIndexZIP: async (file: File, overrideExisting: boolean = true): Promise<ImportResultV3> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('overrideExisting', String(overrideExisting))
    const { data } = await api.post<ImportResultV3>('/products/import/skyman-index-zip', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  exportCSV: async (categoryIds?: string[]): Promise<Blob> => {
    const params = categoryIds ? { categoryIds } : {}
    const response = await api.get('/products/export/csv', {
      params,
      responseType: 'blob',
    })
    return response.data
  },
}
