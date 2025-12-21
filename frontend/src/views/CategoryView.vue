<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { productsApi } from '@/api/products'
import { categoriesApi } from '@/api/categories'
import ProductCard from '@/components/product/ProductCard.vue'
import type { Product, Category } from '@/types'

const route = useRoute()
const category = ref<Category | null>(null)
const products = ref<Product[]>([])
const loading = ref(true)
const page = ref(1)
const totalPages = ref(1)

const slug = computed(() => route.params.slug as string)

async function loadCategory() {
  try {
    const response = await categoriesApi.getBySlug(slug.value)
    category.value = response.data
  } catch (error) {
    console.error('Failed to load category:', error)
  }
}

async function loadProducts() {
  loading.value = true
  try {
    const response = await productsApi.getAll({
      categorySlug: slug.value,
      page: page.value,
      limit: 12
    })
    products.value = response.data
    totalPages.value = response.meta?.totalPages || 1
  } catch (error) {
    console.error('Failed to load products:', error)
  } finally {
    loading.value = false
  }
}

function goToPage(p: number) {
  if (p >= 1 && p <= totalPages.value) {
    page.value = p
    loadProducts()
  }
}

onMounted(() => {
  loadCategory()
  loadProducts()
})
</script>

<template>
  <div>
    <!-- Breadcrumb -->
    <nav class="mb-6">
      <ol class="flex items-center text-sm text-secondary-500">
        <li>
          <RouterLink to="/" class="hover:text-primary-600">Home</RouterLink>
        </li>
        <li class="mx-2">/</li>
        <li>
          <RouterLink to="/products" class="hover:text-primary-600">Products</RouterLink>
        </li>
        <li class="mx-2">/</li>
        <li class="text-secondary-900">{{ category?.name || 'Category' }}</li>
      </ol>
    </nav>

    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-secondary-900 mb-2">
        {{ category?.name || 'Category' }}
      </h1>
      <p v-if="category?.description" class="text-secondary-600">
        {{ category.description }}
      </p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <div v-for="i in 8" :key="i" class="animate-pulse">
        <div class="aspect-square bg-secondary-200 rounded-lg mb-4"></div>
        <div class="h-4 bg-secondary-200 rounded w-3/4 mb-2"></div>
        <div class="h-4 bg-secondary-200 rounded w-1/4"></div>
      </div>
    </div>

    <!-- Products Grid -->
    <div v-else-if="products.length > 0">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <ProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
        />
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center mt-8">
        <div class="flex items-center gap-2">
          <button
            :disabled="page === 1"
            class="px-4 py-2 border border-secondary-300 rounded-lg disabled:opacity-50"
            @click="goToPage(page - 1)"
          >
            Previous
          </button>
          <span class="px-4 py-2 text-secondary-600">
            Page {{ page }} of {{ totalPages }}
          </span>
          <button
            :disabled="page === totalPages"
            class="px-4 py-2 border border-secondary-300 rounded-lg disabled:opacity-50"
            @click="goToPage(page + 1)"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- Empty -->
    <div v-else class="text-center py-16">
      <svg class="w-16 h-16 mx-auto text-secondary-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
      <h2 class="text-lg font-semibold text-secondary-900 mb-2">No products found</h2>
      <p class="text-secondary-500">There are no products in this category yet.</p>
    </div>
  </div>
</template>
