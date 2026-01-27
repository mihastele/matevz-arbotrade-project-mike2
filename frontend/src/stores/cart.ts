import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { Cart, AddToCartData, UpdateCartItemData } from '@/types'
import { cartApi } from '@/api/cart'
import { useToast } from '@/composables/useToast'

export const useCartStore = defineStore('cart', () => {
  const cart = ref<Cart | null>(null)
  const loading = ref(false)
  const { showToast } = useToast()

  const items = computed(() => cart.value?.items || [])
  const itemCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))
  // Ensure numeric values - API may return strings from decimal columns
  const subtotal = computed(() => Number(cart.value?.subtotal) || 0)
  const total = computed(() => Number(cart.value?.total) || Number(cart.value?.subtotal) || 0)
  const isEmpty = computed(() => items.value.length === 0)

  function getGuestToken(): string {
    let token = localStorage.getItem('guestToken')
    if (!token) {
      token = uuidv4()
      localStorage.setItem('guestToken', token)
    }
    return token
  }

  async function fetchCart() {
    loading.value = true
    try {
      // Ensure guest token exists
      getGuestToken()
      cart.value = await cartApi.get()
    } catch (error) {
      console.error('Failed to fetch cart:', error)
    } finally {
      loading.value = false
    }
  }

  async function addItem(data: AddToCartData) {
    loading.value = true
    try {
      cart.value = await cartApi.addItem(data)
      showToast({ type: 'success', message: 'Item added to cart' })
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to add item to cart' })
      throw error
    } finally {
      loading.value = false
    }
  }

  async function updateItem(itemId: string, data: UpdateCartItemData) {
    loading.value = true
    try {
      cart.value = await cartApi.updateItem(itemId, data)
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to update cart' })
      throw error
    } finally {
      loading.value = false
    }
  }

  async function removeItem(itemId: string) {
    loading.value = true
    try {
      cart.value = await cartApi.removeItem(itemId)
      showToast({ type: 'success', message: 'Item removed from cart' })
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to remove item' })
      throw error
    } finally {
      loading.value = false
    }
  }

  async function clearCart() {
    // Immediately clear local state (optimistic update)
    cart.value = null

    loading.value = true
    try {
      await cartApi.clear()
      // Generate a new guest token so we get a fresh cart next time
      localStorage.removeItem('guestToken')
    } catch (error) {
      // If clear fails, we should refetch to get the actual state
      // The cart might already be empty on the server
      console.error('Failed to clear cart on server:', error)
      try {
        await fetchCart()
      } catch {
        // If fetching also fails, just ensure local state is cleared
        cart.value = null
      }
    } finally {
      loading.value = false
    }
  }

  // Simple local-only reset (useful after order placement when backend already cleared)
  function resetLocalCart() {
    cart.value = null
    localStorage.removeItem('guestToken')
  }

  async function mergeCart() {
    const guestToken = localStorage.getItem('guestToken')
    if (!guestToken) return

    try {
      cart.value = await cartApi.merge()
      localStorage.removeItem('guestToken')
    } catch (error) {
      console.error('Failed to merge cart:', error)
    }
  }

  return {
    cart,
    loading,
    items,
    itemCount,
    subtotal,
    total,
    isEmpty,
    fetchCart,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    resetLocalCart,
    mergeCart,
  }
})
