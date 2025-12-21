<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import { useCartStore } from '@/stores/cart'
import { useToast } from '@/composables/useToast'
import type { CartItem } from '@/types'

const router = useRouter()
const cartStore = useCartStore()
const toast = useToast()

const cart = computed(() => cartStore.cart)
const loading = computed(() => cartStore.loading)
const isEmpty = computed(() => !cart.value?.items?.length)

function formatPrice(price: number): string {
  return new Intl.NumberFormat('sl-SI', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}

function getItemImage(item: CartItem): string {
  const mainImage = item.product.images?.find(img => img.isPrimary) || item.product.images?.[0]
  return mainImage?.url || '/placeholder.jpg'
}

async function updateQuantity(itemId: string, quantity: number) {
  if (quantity < 1) return
  try {
    await cartStore.updateItem(itemId, { quantity })
  } catch (error) {
    toast.error('Failed to update quantity')
  }
}

async function removeItem(itemId: string) {
  try {
    await cartStore.removeItem(itemId)
    toast.success('Item removed from cart')
  } catch (error) {
    toast.error('Failed to remove item')
  }
}

function proceedToCheckout() {
  router.push('/checkout')
}
</script>

<template>
  <div class="py-8">
    <div class="container-custom">
      <h1 class="text-3xl font-bold text-secondary-900 mb-8">Shopping Cart</h1>

      <!-- Loading State -->
      <div v-if="loading" class="animate-pulse space-y-4">
        <div v-for="i in 3" :key="i" class="flex gap-4 p-4 bg-white rounded-lg">
          <div class="w-24 h-24 bg-secondary-200 rounded"></div>
          <div class="flex-1">
            <div class="h-5 bg-secondary-200 rounded w-3/4 mb-2"></div>
            <div class="h-4 bg-secondary-200 rounded w-1/4"></div>
          </div>
        </div>
      </div>

      <!-- Empty Cart -->
      <div v-else-if="isEmpty" class="text-center py-16 bg-white rounded-lg">
        <svg class="w-20 h-20 mx-auto text-secondary-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <h2 class="text-xl font-semibold text-secondary-900 mb-2">Your cart is empty</h2>
        <p class="text-secondary-500 mb-6">Start shopping to add items to your cart</p>
        <RouterLink to="/products" class="btn-primary">
          Browse Products
        </RouterLink>
      </div>

      <!-- Cart Content -->
      <div v-else class="lg:flex lg:gap-8">
        <!-- Cart Items -->
        <div class="lg:flex-1 space-y-4">
          <div
            v-for="item in cart?.items"
            :key="item.id"
            class="flex gap-4 p-4 bg-white rounded-lg shadow-sm"
          >
            <!-- Image -->
            <RouterLink 
              :to="`/products/${item.product.slug}`"
              class="w-24 h-24 flex-shrink-0 bg-secondary-100 rounded-lg overflow-hidden"
            >
              <img 
                :src="getItemImage(item)" 
                :alt="item.product.name"
                class="w-full h-full object-cover"
              />
            </RouterLink>

            <!-- Details -->
            <div class="flex-1 min-w-0">
              <RouterLink 
                :to="`/products/${item.product.slug}`"
                class="font-medium text-secondary-900 hover:text-primary-600 line-clamp-2"
              >
                {{ item.product.name }}
              </RouterLink>
              
              <p v-if="item.variant" class="text-sm text-secondary-500 mt-1">
                {{ item.variant.name }}
              </p>

              <div class="flex items-center gap-4 mt-2">
                <!-- Quantity -->
                <div class="flex items-center border border-secondary-300 rounded">
                  <button
                    class="px-2 py-1 text-secondary-600 hover:bg-secondary-50"
                    :disabled="item.quantity <= 1"
                    @click="updateQuantity(item.id, item.quantity - 1)"
                  >
                    -
                  </button>
                  <span class="px-3 py-1 text-sm font-medium">{{ item.quantity }}</span>
                  <button
                    class="px-2 py-1 text-secondary-600 hover:bg-secondary-50"
                    @click="updateQuantity(item.id, item.quantity + 1)"
                  >
                    +
                  </button>
                </div>

                <!-- Remove -->
                <button
                  class="text-red-600 hover:text-red-700 text-sm"
                  @click="removeItem(item.id)"
                >
                  Remove
                </button>
              </div>
            </div>

            <!-- Price -->
            <div class="text-right">
              <p class="font-semibold text-secondary-900">
                {{ formatPrice(item.price * item.quantity) }}
              </p>
              <p v-if="item.quantity > 1" class="text-sm text-secondary-500">
                {{ formatPrice(item.price) }} each
              </p>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="lg:w-80 mt-8 lg:mt-0">
          <div class="bg-white rounded-lg shadow-sm p-6 sticky top-24">
            <h2 class="text-lg font-semibold text-secondary-900 mb-4">Order Summary</h2>

            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-secondary-600">Subtotal</span>
                <span class="font-medium">{{ formatPrice(cartStore.subtotal) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-secondary-600">Shipping</span>
                <span class="text-secondary-500">Calculated at checkout</span>
              </div>
            </div>

            <hr class="my-4" />

            <div class="flex justify-between text-lg font-semibold mb-6">
              <span>Total</span>
              <span class="text-primary-600">{{ formatPrice(cartStore.total) }}</span>
            </div>

            <BaseButton class="w-full" @click="proceedToCheckout">
              Proceed to Checkout
            </BaseButton>

            <RouterLink 
              to="/products" 
              class="block text-center text-sm text-primary-600 hover:text-primary-700 mt-4"
            >
              Continue Shopping
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
