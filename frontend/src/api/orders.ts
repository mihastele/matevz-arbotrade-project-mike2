import api from './index'
import type { Order, CreateOrderData, PaginatedResponse, UpdateOrderStatusData } from '@/types'

export const ordersApi = {
  create: async (orderData: CreateOrderData): Promise<Order> => {
    const { data } = await api.post<Order>('/orders', orderData)
    return data
  },

  getAll: async (page = 1, limit = 20): Promise<PaginatedResponse<Order>> => {
    const { data } = await api.get<PaginatedResponse<Order>>('/orders', { params: { page, limit } })
    return data
  },

  getMyOrders: async (page = 1, limit = 20): Promise<PaginatedResponse<Order>> => {
    const { data } = await api.get<PaginatedResponse<Order>>('/orders/my-orders', { params: { page, limit } })
    return data
  },

  getOne: async (id: string): Promise<Order> => {
    const { data } = await api.get<Order>(`/orders/${id}`)
    return data
  },

  getByOrderNumber: async (orderNumber: string): Promise<Order> => {
    const { data } = await api.get<Order>(`/orders/number/${orderNumber}`)
    return data
  },

  updateStatus: async (id: string, status: UpdateOrderStatusData): Promise<Order> => {
    const { data } = await api.patch<Order>(`/orders/${id}/status`, status)
    return data
  },
}
