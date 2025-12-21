<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ProductCard from '@/components/product/ProductCard.vue'
import { productsApi } from '@/api/products'
import type { Product } from '@/types'

const { t } = useI18n()
const featuredProducts = ref<Product[]>([])
const loading = ref(true)

onMounted(async () => {
  try {
    const response = await productsApi.getAll({ isFeatured: true, limit: 8 })
    featuredProducts.value = response.data
  } catch (error) {
    console.error('Failed to load featured products:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
      <div class="container-custom py-20 md:py-32">
        <div class="max-w-2xl">
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            {{ t('hero.title') }}
          </h1>
          <p class="text-lg md:text-xl text-primary-100 mb-8">
            {{ t('hero.subtitle') }}
          </p>
          <RouterLink 
            to="/products" 
            class="inline-flex items-center px-6 py-3 bg-white text-primary-600 font-semibold rounded-lg hover:bg-primary-50 transition-colors"
          >
            {{ t('hero.shopNow') }}
            <svg class="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="py-16 bg-secondary-50">
      <div class="container-custom">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-secondary-900">{{ t('features.quality.title') }}</h3>
              <p class="text-secondary-600 mt-1">{{ t('features.quality.description') }}</p>
            </div>
          </div>
          
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-secondary-900">{{ t('features.prices.title') }}</h3>
              <p class="text-secondary-600 mt-1">{{ t('features.prices.description') }}</p>
            </div>
          </div>
          
          <div class="flex items-start space-x-4">
            <div class="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-secondary-900">{{ t('features.shipping.title') }}</h3>
              <p class="text-secondary-600 mt-1">{{ t('features.shipping.description') }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Products -->
    <section class="py-16">
      <div class="container-custom">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-2xl md:text-3xl font-bold text-secondary-900">{{ t('products.featured') }}</h2>
          <RouterLink 
            to="/products" 
            class="text-primary-600 hover:text-primary-700 font-medium flex items-center"
          >
            {{ t('products.viewAll') }}
            <svg class="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </RouterLink>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div v-for="i in 8" :key="i" class="animate-pulse">
            <div class="aspect-square bg-secondary-200 rounded-lg mb-4"></div>
            <div class="h-4 bg-secondary-200 rounded w-3/4 mb-2"></div>
            <div class="h-4 bg-secondary-200 rounded w-1/2"></div>
          </div>
        </div>

        <!-- Products Grid -->
        <div v-else class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <ProductCard 
            v-for="product in featuredProducts" 
            :key="product.id" 
            :product="product" 
          />
        </div>

        <!-- Empty State -->
        <div v-if="!loading && featuredProducts.length === 0" class="text-center py-12">
          <p class="text-secondary-500">{{ t('products.noFeatured') }}</p>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-16 bg-secondary-900 text-white">
      <div class="container-custom text-center">
        <h2 class="text-2xl md:text-3xl font-bold mb-4">{{ t('cta.title') }}</h2>
        <p class="text-secondary-300 mb-8 max-w-2xl mx-auto">
          {{ t('cta.description') }}
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <RouterLink 
            to="/register" 
            class="btn-primary px-8 py-3"
          >
            {{ t('cta.createAccount') }}
          </RouterLink>
          <RouterLink 
            to="/products" 
            class="btn-outline border-white text-white hover:bg-white hover:text-secondary-900 px-8 py-3"
          >
            {{ t('cta.browseProducts') }}
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>
