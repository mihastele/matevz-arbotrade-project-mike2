<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { ordersApi } from '@/api/orders'
import { useCartStore } from '@/stores/cart'
import { formatPrice, formatDateTime, formatDate } from '@/utils/formatters'
import type { Order } from '@/types'

const route = useRoute()
const cartStore = useCartStore()
const order = ref<Order | null>(null)
const loading = ref(true)
const isPaymentConfirmation = ref(false)
const paymentIntentId = ref<string | null>(null)

// Check if this is a successful payment confirmation (order might still be processing)
const showPaymentConfirmation = computed(() => {
  return isPaymentConfirmation.value && !order.value
})

onMounted(async () => {
  try {
    // Check if this is a payment redirect from Stripe
    const paymentIntentQuery = route.query.payment_intent
    const paymentIntent = Array.isArray(paymentIntentQuery) ? paymentIntentQuery[0] : paymentIntentQuery as string | null
    const orderId = route.params.id as string

    if (paymentIntent) {
      isPaymentConfirmation.value = true
      paymentIntentId.value = paymentIntent
      
      // Clear the cart after successful payment
      cartStore.resetLocalCart()
      
      // Try to find the order by payment intent
      // (order might not exist yet if webhook hasn't processed)
      try {
        // For now, we'll just show a generic confirmation
        // In a production app, you'd poll for the order or use webhooks
        // to update the frontend in real-time
        loading.value = false
      } catch {
        loading.value = false
      }
    } else if (orderId) {
      const response = await ordersApi.getOne(orderId)
      order.value = response
      loading.value = false
    } else {
      loading.value = false
    }
  } catch (error) {
    console.error('Failed to load order:', error)
    loading.value = false
  }
})
</script>

<template>
  <div class="max-w-2xl mx-auto">
    <!-- Loading -->
    <div v-if="loading" class="text-center py-16">
      <div class="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto"></div>
      <p class="mt-4 text-secondary-600">Loading order details...</p>
    </div>

    <!-- Success -->
    <div v-else-if="order" class="text-center">
      <!-- Success Icon -->
      <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 class="text-3xl font-bold text-secondary-900 mb-2">Thank You!</h1>
      <p class="text-xl text-secondary-600 mb-2">Your order has been placed successfully.</p>
      <p class="text-secondary-500 mb-8">
        Order #{{ order.orderNumber }}
      </p>

      <!-- Order Summary -->
      <div class="bg-white rounded-lg shadow-sm p-6 text-left mb-8">
        <h2 class="font-semibold text-secondary-900 mb-4">Order Summary</h2>
        
        <div class="divide-y divide-secondary-100">
          <div 
            v-for="item in order.items" 
            :key="item.id"
            class="py-4 flex gap-4"
          >
            <div class="w-16 h-16 bg-secondary-100 rounded overflow-hidden flex-shrink-0">
              <img 
                :src="item.product?.images?.[0]?.url || '/placeholder.jpg'" 
                :alt="item.productName"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="flex-1">
              <h3 class="font-medium text-secondary-900">{{ item.productName }}</h3>
              <p class="text-sm text-secondary-500">Qty: {{ item.quantity }}</p>
            </div>
            <div class="text-right">
              <p class="font-medium text-secondary-900">{{ formatPrice(item.price * item.quantity) }}</p>
            </div>
          </div>
        </div>

        <div class="border-t border-secondary-200 mt-4 pt-4 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-secondary-600">Subtotal</span>
            <span>{{ formatPrice(order.subtotal) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-secondary-600">Shipping</span>
            <span>{{ formatPrice(order.shippingCost || 0) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-secondary-600">Tax</span>
            <span>{{ formatPrice(order.taxAmount || 0) }}</span>
          </div>
          <div class="flex justify-between font-semibold text-lg pt-2 border-t border-secondary-200">
            <span>Total</span>
            <span class="text-primary-600">{{ formatPrice(order.total) }}</span>
          </div>
        </div>
      </div>

      <!-- Info -->
      <div class="bg-secondary-50 rounded-lg p-6 text-left mb-8">
        <h3 class="font-semibold text-secondary-900 mb-2">What's Next?</h3>
        <ul class="text-secondary-600 space-y-2">
          <li class="flex items-start">
            <svg class="w-5 h-5 text-primary-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            You will receive an email confirmation at {{ order.user?.email }}
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-primary-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            We'll notify you when your order ships
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-primary-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Expected delivery: {{ formatDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()) }}
          </li>
        </ul>
      </div>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <RouterLink 
          :to="`/account/orders/${order.id}`"
          class="btn-primary"
        >
          View Order Details
        </RouterLink>
        <RouterLink 
          to="/products"
          class="btn-outline"
        >
          Continue Shopping
        </RouterLink>
      </div>
    </div>

    <!-- Payment Confirmed (Order Processing) -->
    <div v-else-if="showPaymentConfirmation" class="text-center">
      <!-- Success Icon -->
      <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg class="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 class="text-3xl font-bold text-secondary-900 mb-2">Payment Confirmed!</h1>
      <p class="text-xl text-secondary-600 mb-4">Your payment was successful.</p>
      <p class="text-secondary-500 mb-8">
        Your order is being processed and you will receive a confirmation email shortly.
      </p>

      <!-- Info -->
      <div class="bg-secondary-50 rounded-lg p-6 text-left mb-8">
        <h3 class="font-semibold text-secondary-900 mb-2">What's Next?</h3>
        <ul class="text-secondary-600 space-y-2">
          <li class="flex items-start">
            <svg class="w-5 h-5 text-primary-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            You will receive an order confirmation email shortly
          </li>
          <li class="flex items-start">
            <svg class="w-5 h-5 text-primary-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            We'll notify you when your order ships
          </li>
        </ul>
      </div>

      <!-- Actions -->
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <RouterLink 
          to="/account/orders"
          class="btn-primary"
        >
          View My Orders
        </RouterLink>
        <RouterLink 
          to="/products"
          class="btn-outline"
        >
          Continue Shopping
        </RouterLink>
      </div>
    </div>

    <!-- Error -->
    <div v-else class="text-center py-16">
      <h2 class="text-xl font-semibold text-secondary-900 mb-2">Order not found</h2>
      <RouterLink to="/" class="text-primary-600 hover:text-primary-700">
        Back to Home
      </RouterLink>
    </div>
  </div>
</template>
