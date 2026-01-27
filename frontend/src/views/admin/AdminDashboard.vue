<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ordersApi } from '@/api/orders'
import { productsApi } from '@/api/products'
import { formatPrice, formatDateTime } from '@/utils/formatters'
import type { Order, Product } from '@/types'

const stats = ref({
  totalOrders: 0,
  pendingOrders: 0,
  totalProducts: 0,
  revenue: 0
})

const recentOrders = ref<Order[]>([])
const lowStockProducts = ref<Product[]>([])
const loading = ref(true)

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
    const [ordersRes, productsRes] = await Promise.all([
      ordersApi.getAll(),
      productsApi.getAll({ limit: 100 })
    ])

    const orders = Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data
    const products = Array.isArray(productsRes.data) ? productsRes.data : productsRes.data

    stats.value.totalOrders = orders.length
    stats.value.pendingOrders = orders.filter((o: Order) => o.status === 'pending').length
    stats.value.totalProducts = products.length
    stats.value.revenue = orders.reduce((sum: number, o: Order) => sum + o.total, 0)

    recentOrders.value = orders.slice(0, 5)
    lowStockProducts.value = products.filter((p: Product) => p.stock < 10).slice(0, 5)
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold text-secondary-900 mb-6">Dashboard</h1>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm text-secondary-500">Total Orders</p>
            <p class="text-2xl font-semibold text-secondary-900">{{ stats.totalOrders }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm text-secondary-500">Pending Orders</p>
            <p class="text-2xl font-semibold text-secondary-900">{{ stats.pendingOrders }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm text-secondary-500">Total Products</p>
            <p class="text-2xl font-semibold text-secondary-900">{{ stats.totalProducts }}</p>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm text-secondary-500">Total Revenue</p>
            <p class="text-2xl font-semibold text-secondary-900">{{ formatPrice(stats.revenue) }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent Orders -->
      <div class="bg-white rounded-lg shadow-sm">
        <div class="p-6 border-b border-secondary-200">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-secondary-900">Recent Orders</h2>
            <RouterLink to="/admin/orders" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All
            </RouterLink>
          </div>
        </div>

        <div v-if="loading" class="p-6">
          <div v-for="i in 5" :key="i" class="animate-pulse flex items-center mb-4">
            <div class="w-12 h-12 bg-secondary-200 rounded-full mr-4"></div>
            <div class="flex-1">
              <div class="h-4 bg-secondary-200 rounded w-1/2 mb-2"></div>
              <div class="h-3 bg-secondary-200 rounded w-1/3"></div>
            </div>
          </div>
        </div>

        <div v-else-if="recentOrders.length === 0" class="p-12 text-center">
          <p class="text-secondary-500">No orders yet</p>
        </div>

        <div v-else class="divide-y divide-secondary-100">
          <RouterLink
            v-for="order in recentOrders"
            :key="order.id"
            :to="`/admin/orders/${order.id}`"
            class="flex items-center justify-between p-4 hover:bg-secondary-50 transition-colors"
          >
            <div class="flex items-center">
              <div class="w-10 h-10 bg-secondary-100 rounded-full flex items-center justify-center mr-3">
                <span class="text-sm font-medium text-secondary-600">
                  {{ order.user?.firstName?.[0] || 'G' }}
                </span>
              </div>
              <div>
                <p class="font-medium text-secondary-900">#{{ order.orderNumber }}</p>
                <p class="text-sm text-secondary-500">{{ formatDateTime(order.createdAt) }}</p>
              </div>
            </div>
            <div class="text-right">
              <span 
                :class="[
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize',
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

      <!-- Low Stock Products -->
      <div class="bg-white rounded-lg shadow-sm">
        <div class="p-6 border-b border-secondary-200">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-secondary-900">Low Stock Products</h2>
            <RouterLink to="/admin/products" class="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View All
            </RouterLink>
          </div>
        </div>

        <div v-if="loading" class="p-6">
          <div v-for="i in 5" :key="i" class="animate-pulse flex items-center mb-4">
            <div class="w-12 h-12 bg-secondary-200 rounded mr-4"></div>
            <div class="flex-1">
              <div class="h-4 bg-secondary-200 rounded w-3/4 mb-2"></div>
              <div class="h-3 bg-secondary-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>

        <div v-else-if="lowStockProducts.length === 0" class="p-12 text-center">
          <p class="text-secondary-500">All products are well stocked</p>
        </div>

        <div v-else class="divide-y divide-secondary-100">
          <RouterLink
            v-for="product in lowStockProducts"
            :key="product.id"
            :to="`/admin/products/${product.id}`"
            class="flex items-center justify-between p-4 hover:bg-secondary-50 transition-colors"
          >
            <div class="flex items-center">
              <div class="w-12 h-12 bg-secondary-100 rounded overflow-hidden mr-3">
                <img 
                  :src="product.images?.[0]?.url || '/placeholder.jpg'" 
                  :alt="product.name"
                  class="w-full h-full object-cover"
                />
              </div>
              <div>
                <p class="font-medium text-secondary-900 line-clamp-1">{{ product.name }}</p>
                <p class="text-sm text-secondary-500">{{ product.sku }}</p>
              </div>
            </div>
            <div class="text-right">
              <span 
                :class="[
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  product.stock === 0 
                    ? 'bg-red-100 text-red-800' 
                    : 'bg-yellow-100 text-yellow-800'
                ]"
              >
                {{ product.stock }} left
              </span>
            </div>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
