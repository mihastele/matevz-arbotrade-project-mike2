<script setup lang="ts">
import { computed, type PropType } from 'vue'
import type { Product } from '@/types'
import { RouterLink } from 'vue-router'

const props = defineProps({
  product: {
    type: Object as PropType<Product>,
    required: true
  }
})

const mainImage = computed(() => {
  const img = props.product.images?.find(i => i.isMain) || props.product.images?.[0]
  return img?.url || '/placeholder.jpg'
})

const displayPrice = computed(() => {
  if (props.product.salePrice) {
    return props.product.salePrice
  }
  return props.product.price
})

const hasDiscount = computed(() => {
  return props.product.salePrice && props.product.salePrice < props.product.price
})

const discountPercent = computed(() => {
  if (!hasDiscount.value) return 0
  return Math.round((1 - props.product.salePrice! / props.product.price) * 100)
})

function formatPrice(price: number): string {
  return new Intl.NumberFormat('sl-SI', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}
</script>

<template>
  <RouterLink 
    :to="`/products/${product.slug}`"
    class="group block bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
  >
    <!-- Image -->
    <div class="aspect-square bg-secondary-100 relative overflow-hidden">
      <img 
        :src="mainImage" 
        :alt="product.name"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
      
      <!-- Badges -->
      <div class="absolute top-2 left-2 flex flex-col gap-1">
        <span 
          v-if="hasDiscount"
          class="bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded"
        >
          -{{ discountPercent }}%
        </span>
        <span 
          v-if="product.isFeatured"
          class="bg-primary-600 text-white text-xs font-semibold px-2 py-1 rounded"
        >
          Featured
        </span>
      </div>

      <!-- Out of Stock -->
      <div 
        v-if="product.stockQuantity === 0"
        class="absolute inset-0 bg-black/50 flex items-center justify-center"
      >
        <span class="text-white font-semibold">Out of Stock</span>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <!-- Category -->
      <p v-if="product.category" class="text-xs text-secondary-500 mb-1">
        {{ product.category.name }}
      </p>

      <!-- Name -->
      <h3 class="font-medium text-secondary-900 group-hover:text-primary-600 transition-colors line-clamp-2">
        {{ product.name }}
      </h3>

      <!-- Price -->
      <div class="mt-2 flex items-center gap-2">
        <span class="text-lg font-semibold text-primary-600">
          {{ formatPrice(displayPrice) }}
        </span>
        <span 
          v-if="hasDiscount"
          class="text-sm text-secondary-400 line-through"
        >
          {{ formatPrice(product.price) }}
        </span>
      </div>

      <!-- Rating placeholder -->
      <div class="mt-2 flex items-center gap-1">
        <div class="flex text-yellow-400">
          <svg v-for="i in 5" :key="i" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      </div>
    </div>
  </RouterLink>
</template>
