<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ordersApi } from '@/api/orders'
import type { Order } from '@/types'

const authStore = useAuthStore()
const recentOrders = ref<Order[]>([])
const loading = ref(true)

function formatPrice(price: number): string {
  return new Intl.NumberFormat('sl-SI', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('sl-SI', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-purple-100 text-purple-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }
  return colors[status] || 'bg-secondary-100 text-secondary-800'
}

onMounted(async () => {
  try {
    const response = await ordersApi.getAll({ limit: 5 })
    recentOrders.value = response.data.items || response.data
  } catch (error) {
    console.error('Failed to load orders:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-secondary-900 mb-6">Dashboard</h1>

    <!-- Welcome Card -->
    <div class="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white mb-8">
      <h2 class="text-xl font-semibold">
        Welcome back, {{ authStore.user?.firstName }}!
      </h2>
      <p class="text-primary-100 mt-1">
        Manage your orders, profile, and account settings.
      </p>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm text-secondary-500">Total Orders</p>
            <p class="text-2xl font-semibold text-secondary-900">{{ recentOrders.length }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm text-secondary-500">Completed</p>
            <p class="text-2xl font-semibold text-secondary-900">
              {{ recentOrders.filter(o => o.status === 'delivered').length }}
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm text-secondary-500">Processing</p>
            <p class="text-2xl font-semibold text-secondary-900">
              {{ recentOrders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status)).length }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Orders -->
    <div class="bg-white rounded-lg shadow-sm">
      <div class="p-6 border-b border-secondary-200">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-secondary-900">Recent Orders</h2>
          <RouterLink to="/account/orders" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All
          </RouterLink>
        </div>
      </div>

      <div v-if="loading" class="p-6">
        <div v-for="i in 3" :key="i" class="animate-pulse flex items-center gap-4 mb-4">
          <div class="w-16 h-16 bg-secondary-200 rounded"></div>
          <div class="flex-1">
            <div class="h-4 bg-secondary-200 rounded w-1/4 mb-2"></div>
            <div class="h-3 bg-secondary-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>

      <div v-else-if="recentOrders.length === 0" class="p-12 text-center">
        <svg class="w-12 h-12 mx-auto text-secondary-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <p class="text-secondary-500 mb-4">No orders yet</p>
        <RouterLink to="/products" class="btn-primary">
          Start Shopping
        </RouterLink>
      </div>

      <div v-else class="divide-y divide-secondary-200">
        <RouterLink
          v-for="order in recentOrders"
          :key="order.id"
          :to="`/account/orders/${order.id}`"
          class="flex items-center justify-between p-6 hover:bg-secondary-50 transition-colors"
        >
          <div>
            <p class="font-medium text-secondary-900">Order #{{ order.orderNumber }}</p>
            <p class="text-sm text-secondary-500">{{ formatDate(order.createdAt) }}</p>
          </div>
          <div class="text-right">
            <span 
              :class="[
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
                getStatusColor(order.status)
              ]"
            >
              {{ order.status }}
            </span>
            <p class="text-sm font-medium text-secondary-900 mt-1">
              {{ formatPrice(order.total) }}
            </p>
          </div>
        </RouterLink>
      </div>
    </div>
  </div>
</template>
