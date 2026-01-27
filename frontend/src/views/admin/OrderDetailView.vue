<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { ordersApi } from '@/api/orders'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import { useToast } from '@/composables/useToast'
import type { Order, OrderStatus } from '@/types'

const route = useRoute()
const toast = useToast()
const order = ref<Order | null>(null)
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

const statusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
]

async function updateStatus(status: string) {
  if (!order.value) return
  
  try {
    await ordersApi.updateStatus(order.value.id, { status: status as OrderStatus })
    order.value.status = status as OrderStatus
    toast.success('Order status updated')
  } catch (error) {
    toast.error('Failed to update status')
  }
}

onMounted(async () => {
  try {
    const id = route.params.id as string
    const response = await ordersApi.getOne(id)
    order.value = response
  } catch (error) {
    console.error('Failed to load order:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <RouterLink to="/admin/orders" class="text-primary-600 hover:text-primary-700 flex items-center mb-6">
      <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      Back to Orders
    </RouterLink>

    <!-- Loading -->
    <div v-if="loading" class="animate-pulse">
      <div class="h-8 bg-secondary-200 rounded w-1/3 mb-4"></div>
      <div class="bg-white rounded-lg p-6 space-y-4">
        <div class="h-4 bg-secondary-200 rounded w-1/4"></div>
        <div class="h-4 bg-secondary-200 rounded w-1/2"></div>
      </div>
    </div>

    <!-- Order Details -->
    <div v-else-if="order">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-secondary-900">
          Order #{{ order.orderNumber }}
        </h1>
        <span 
          :class="[
            'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize',
            getStatusColor(order.status)
          ]"
        >
          {{ order.status }}
        </span>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Order Info -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Items -->
          <div class="bg-white rounded-lg shadow-sm">
            <div class="p-6 border-b border-secondary-200">
              <h2 class="font-semibold text-secondary-900">Order Items</h2>
            </div>
            <div class="divide-y divide-secondary-100">
              <div 
                v-for="item in order.items" 
                :key="item.id"
                class="p-6 flex gap-4"
              >
                <div class="w-20 h-20 bg-secondary-100 rounded overflow-hidden flex-shrink-0">
                  <img 
                    :src="item.product?.images?.[0]?.url || '/placeholder.jpg'" 
                    :alt="item.productName"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="flex-1">
                  <h3 class="font-medium text-secondary-900">{{ item.productName }}</h3>
                  <p v-if="item.variantName" class="text-sm text-secondary-500">{{ item.variantName }}</p>
                  <p class="text-sm text-secondary-500">Qty: {{ item.quantity }}</p>
                </div>
                <div class="text-right">
                  <p class="font-medium text-secondary-900">{{ formatPrice(item.price * item.quantity) }}</p>
                  <p class="text-sm text-secondary-500">{{ formatPrice(item.price) }} each</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Customer Info -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="font-semibold text-secondary-900 mb-4">Customer Information</h2>
            <div class="grid grid-cols-2 gap-6">
              <div>
                <h3 class="text-sm font-medium text-secondary-500 mb-1">Customer</h3>
                <p class="text-secondary-900">{{ order.user?.firstName }} {{ order.user?.lastName }}</p>
                <p class="text-secondary-600 text-sm">{{ order.user?.email }}</p>
              </div>
              <div>
                <h3 class="text-sm font-medium text-secondary-500 mb-1">Shipping Address</h3>
                <div v-if="order.shippingAddress" class="text-secondary-600 text-sm">
                  <p>{{ order.shippingAddress.firstName }} {{ order.shippingAddress.lastName }}</p>
                  <p>{{ order.shippingAddress.street }}</p>
                  <p>{{ order.shippingAddress.postalCode }} {{ order.shippingAddress.city }}</p>
                  <p>{{ order.shippingAddress.country }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sidebar -->
        <div class="lg:col-span-1 space-y-6">
          <!-- Update Status -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="font-semibold text-secondary-900 mb-4">Update Status</h2>
            <BaseSelect
              :model-value="order.status"
              :options="statusOptions"
              @update:model-value="updateStatus"
            />
          </div>

          <!-- Order Summary -->
          <div class="bg-white rounded-lg shadow-sm p-6">
            <h2 class="font-semibold text-secondary-900 mb-4">Order Summary</h2>
            
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-secondary-600">Order Date</span>
                <span>{{ formatDate(order.createdAt) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-secondary-600">Subtotal</span>
                <span>{{ formatPrice(order.subtotal) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-secondary-600">Shipping</span>
                <span>{{ formatPrice(order.shippingCost || 0) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-secondary-600">Tax</span>
                <span>{{ formatPrice(order.taxAmount || 0) }}</span>
              </div>
            </div>

            <hr class="my-4" />

            <div class="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span class="text-primary-600">{{ formatPrice(order.total) }}</span>
            </div>

            <div class="mt-6 pt-6 border-t border-secondary-200">
              <h3 class="font-medium text-secondary-900 mb-2">Payment</h3>
              <span 
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  getPaymentStatusColor(order.paymentStatus)
                ]"
              >
                {{ getPaymentStatusLabel(order.paymentStatus) }}
              </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Not Found -->
    <div v-else class="text-center py-16">
      <h2 class="text-xl font-semibold text-secondary-900 mb-2">Order not found</h2>
      <RouterLink to="/admin/orders" class="text-primary-600 hover:text-primary-700">
        Back to Orders
      </RouterLink>
    </div>
  </div>
</template>
