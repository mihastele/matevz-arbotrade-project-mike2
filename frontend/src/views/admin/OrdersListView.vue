<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ordersApi } from '@/api/orders'
import { useToast } from '@/composables/useToast'
import type { Order, OrderStatus } from '@/types'

const toast = useToast()

const orders = ref<Order[]>([])
const loading = ref(true)
const statusFilter = ref('')

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

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
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
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

async function loadOrders() {
  loading.value = true
  try {
    const response = await ordersApi.getAll()
    let data = Array.isArray(response.data) ? response.data : response.data
    
    if (statusFilter.value) {
      data = data.filter((o: Order) => o.status === statusFilter.value)
    }
    
    orders.value = data
  } catch (error) {
    toast.error('Failed to load orders')
  } finally {
    loading.value = false
  }
}

async function updateStatus(orderId: string, status: string) {
  try {
    await ordersApi.updateStatus(orderId, { status: status as OrderStatus })
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      order.status = status as OrderStatus
    }
    toast.success('Order status updated')
  } catch (error) {
    toast.error('Failed to update status')
  }
}

onMounted(loadOrders)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-secondary-900">Orders</h1>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div class="flex gap-4">
        <select 
          v-model="statusFilter"
          class="px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          @change="loadOrders"
        >
          <option v-for="option in statusOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="bg-white rounded-lg shadow-sm p-6">
      <div v-for="i in 5" :key="i" class="animate-pulse flex items-center mb-4">
        <div class="flex-1">
          <div class="h-4 bg-secondary-200 rounded w-1/4 mb-2"></div>
          <div class="h-3 bg-secondary-200 rounded w-1/3"></div>
        </div>
      </div>
    </div>

    <!-- Orders Table -->
    <div v-else class="bg-white rounded-lg shadow-sm overflow-hidden">
      <table class="min-w-full divide-y divide-secondary-200">
        <thead class="bg-secondary-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
              Order
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
              Customer
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
              Date
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
              Total
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
              Status
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-secondary-200">
          <tr v-if="orders.length === 0">
            <td colspan="6" class="px-6 py-12 text-center text-secondary-500">
              No orders found
            </td>
          </tr>
          <tr v-for="order in orders" :key="order.id" class="hover:bg-secondary-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <p class="font-medium text-secondary-900">#{{ order.orderNumber }}</p>
              <p class="text-sm text-secondary-500">{{ order.items?.length || 0 }} items</p>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <p class="font-medium text-secondary-900">
                {{ order.user?.firstName }} {{ order.user?.lastName }}
              </p>
              <p class="text-sm text-secondary-500">{{ order.user?.email }}</p>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
              {{ formatDate(order.createdAt) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap font-medium text-secondary-900">
              {{ formatPrice(order.total) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <select
                :value="order.status"
                :class="[
                  'px-2 py-1 rounded-full text-xs font-medium capitalize border-0 cursor-pointer',
                  getStatusColor(order.status)
                ]"
                @change="updateStatus(order.id, ($event.target as HTMLSelectElement).value)"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <RouterLink 
                :to="`/admin/orders/${order.id}`"
                class="text-primary-600 hover:text-primary-900"
              >
                View
              </RouterLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
