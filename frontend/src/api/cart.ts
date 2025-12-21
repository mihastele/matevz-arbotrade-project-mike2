import api from './index'
import type { Cart, AddToCartData, UpdateCartItemData } from '@/types'

export const cartApi = {
  get: async (): Promise<Cart> => {
    const { data } = await api.get<Cart>('/cart')
    return data
  },

  addItem: async (item: AddToCartData): Promise<Cart> => {
    const { data } = await api.post<Cart>('/cart/items', item)
    return data
  },

  updateItem: async (itemId: string, update: UpdateCartItemData): Promise<Cart> => {
    const { data } = await api.patch<Cart>(`/cart/items/${itemId}`, update)
    return data
  },

  removeItem: async (itemId: string): Promise<Cart> => {
    const { data } = await api.delete<Cart>(`/cart/items/${itemId}`)
    return data
  },

  clear: async (): Promise<void> => {
    await api.delete('/cart')
  },

  merge: async (): Promise<Cart> => {
    const { data } = await api.post<Cart>('/cart/merge')
    return data
  },
}
