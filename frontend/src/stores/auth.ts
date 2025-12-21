import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User, LoginCredentials, RegisterData } from '@/types'
import { authApi } from '@/api/auth'
import { useCartStore } from './cart'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const accessToken = ref<string | null>(null)
  const initialized = ref(false)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function initAuth() {
    const token = localStorage.getItem('accessToken')
    const savedUser = localStorage.getItem('user')

    if (token && savedUser) {
      accessToken.value = token
      user.value = JSON.parse(savedUser)
      
      // Verify token is still valid
      try {
        const userData = await authApi.getMe()
        user.value = userData
        localStorage.setItem('user', JSON.stringify(userData))
      } catch {
        logout()
      }
    }

    initialized.value = true
  }

  async function login(credentials: LoginCredentials) {
    loading.value = true
    try {
      const response = await authApi.login(credentials)
      user.value = response.user
      accessToken.value = response.accessToken
      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      // Merge guest cart
      const cartStore = useCartStore()
      await cartStore.mergeCart()
      
      return response
    } finally {
      loading.value = false
    }
  }

  async function register(data: RegisterData) {
    loading.value = true
    try {
      const response = await authApi.register(data)
      user.value = response.user
      accessToken.value = response.accessToken
      localStorage.setItem('accessToken', response.accessToken)
      localStorage.setItem('user', JSON.stringify(response.user))
      
      // Merge guest cart
      const cartStore = useCartStore()
      await cartStore.mergeCart()
      
      return response
    } finally {
      loading.value = false
    }
  }

  function logout() {
    user.value = null
    accessToken.value = null
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
  }

  return {
    user,
    accessToken,
    initialized,
    loading,
    isAuthenticated,
    isAdmin,
    initAuth,
    login,
    register,
    logout,
  }
})
