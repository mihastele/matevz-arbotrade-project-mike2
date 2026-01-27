<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ordersApi } from '@/api/orders'
import type { Order } from '@/types'

const orders = ref<Order[]>([])
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
    month: 'long',
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

function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    paid: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-purple-100 text-purple-800'
  }
  return colors[status] || 'bg-secondary-100 text-secondary-800'
}

function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    paid: 'Plačano',
    pending: 'Neplačano',
    failed: 'Neuspešno',
    refunded: 'Povrnjeno'
  }
  return labels[status] || status
}

onMounted(async () => {
  try {
    const response = await ordersApi.getMyOrders()
    orders.value = response.data
  } catch (error) {
    console.error('Failed to load orders:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-secondary-900 mb-6">My Orders</h1>

    <!-- Loading -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="animate-pulse bg-white rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="h-5 bg-secondary-200 rounded w-1/4"></div>
          <div class="h-5 bg-secondary-200 rounded w-20"></div>
        </div>
        <div class="h-4 bg-secondary-200 rounded w-1/2"></div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="orders.length === 0" class="bg-white rounded-lg shadow-sm p-12 text-center">
      <svg class="w-16 h-16 mx-auto text-secondary-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <h2 class="text-xl font-semibold text-secondary-900 mb-2">No orders yet</h2>
      <p class="text-secondary-500 mb-6">When you place an order, it will appear here</p>
      <RouterLink to="/products" class="btn-primary">
        Start Shopping
      </RouterLink>
    </div>

    <!-- Orders List -->
    <div v-else class="space-y-4">
      <div 
        v-for="order in orders" 
        :key="order.id"
        class="bg-white rounded-lg shadow-sm overflow-hidden"
      >
        <!-- Order Header -->
        <div class="p-6 border-b border-secondary-100">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div class="flex items-center gap-3">
                <h3 class="font-semibold text-secondary-900">
                  Order #{{ order.orderNumber }}
                </h3>
                <span 
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
                    getStatusColor(order.status)
                  ]"
                >
                  {{ order.status }}
                </span>
                <span 
                  :class="[
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    getPaymentStatusColor(order.paymentStatus)
                  ]"
                >
                  {{ getPaymentStatusLabel(order.paymentStatus) }}
                </span>
              </div>
              <p class="text-sm text-secondary-500 mt-1">
                Placed on {{ formatDate(order.createdAt) }}
              </p>
            </div>
            <div class="text-right">
              <p class="text-lg font-semibold text-secondary-900">
                {{ formatPrice(order.total) }}
              </p>
              <p class="text-sm text-secondary-500">
                {{ order.items?.length || 0 }} items
              </p>
            </div>
          </div>
        </div>

        <!-- Order Items Preview -->
        <div class="p-6">
          <div class="flex items-center gap-4 overflow-x-auto pb-2">
            <div 
              v-for="item in (order.items || []).slice(0, 4)" 
              :key="item.id"
              class="w-16 h-16 flex-shrink-0 bg-secondary-100 rounded overflow-hidden"
            >
              <img 
                :src="item.product?.images?.[0]?.url || '/placeholder.jpg'" 
                :alt="item.productName"
                class="w-full h-full object-cover"
              />
            </div>
            <div 
              v-if="(order.items?.length || 0) > 4"
              class="w-16 h-16 flex-shrink-0 bg-secondary-100 rounded flex items-center justify-center"
            >
              <span class="text-sm font-medium text-secondary-500">
                +{{ (order.items?.length || 0) - 4 }}
              </span>
            </div>
          </div>
        </div>

        <!-- Order Footer -->
        <div class="px-6 py-4 bg-secondary-50 flex items-center justify-between">
          <RouterLink 
            :to="`/account/orders/${order.id}`"
            class="text-primary-600 hover:text-primary-700 font-medium text-sm"
          >
            View Details
          </RouterLink>
          <button 
            v-if="order.status === 'delivered'"
            class="text-sm text-secondary-600 hover:text-secondary-900"
          >
            Reorder
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
