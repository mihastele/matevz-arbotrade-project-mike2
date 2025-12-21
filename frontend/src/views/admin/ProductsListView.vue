<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { productsApi } from '@/api/products'
import { useToast } from '@/composables/useToast'
import type { Product } from '@/types'

const toast = useToast()

const products = ref<Product[]>([])
const loading = ref(true)
const search = ref('')

function formatPrice(price: number): string {
  return new Intl.NumberFormat('sl-SI', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}

async function loadProducts() {
  loading.value = true
  try {
    const params: Record<string, unknown> = {}
    if (search.value) params.search = search.value
    
    const response = await productsApi.getAll(params)
    products.value = response.data
  } catch (error) {
    toast.error('Failed to load products')
  } finally {
    loading.value = false
  }
}

async function deleteProduct(id: string) {
  if (!confirm('Are you sure you want to delete this product?')) return
  
  try {
    await productsApi.delete(id)
    products.value = products.value.filter(p => p.id !== id)
    toast.success('Product deleted')
  } catch (error) {
    toast.error('Failed to delete product')
  }
}

function handleSearch() {
  loadProducts()
}

onMounted(loadProducts)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-secondary-900">Products</h1>
      <RouterLink to="/admin/products/new">
        <BaseButton>
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </BaseButton>
      </RouterLink>
    </div>

    <!-- Search -->
    <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div class="flex gap-4">
        <div class="flex-1">
          <BaseInput
            v-model="search"
            placeholder="Search products..."
            @keyup.enter="handleSearch"
          />
        </div>
        <BaseButton @click="handleSearch">Search</BaseButton>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="bg-white rounded-lg shadow-sm p-6">
      <div v-for="i in 5" :key="i" class="animate-pulse flex items-center mb-4">
        <div class="w-16 h-16 bg-secondary-200 rounded mr-4"></div>
        <div class="flex-1">
          <div class="h-4 bg-secondary-200 rounded w-1/3 mb-2"></div>
          <div class="h-3 bg-secondary-200 rounded w-1/4"></div>
        </div>
      </div>
    </div>

    <!-- Products Table -->
    <div v-else class="bg-white rounded-lg shadow-sm overflow-hidden">
      <table class="min-w-full divide-y divide-secondary-200">
        <thead class="bg-secondary-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
              Product
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
              SKU
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
              Price
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
              Stock
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
          <tr v-if="products.length === 0">
            <td colspan="6" class="px-6 py-12 text-center text-secondary-500">
              No products found
            </td>
          </tr>
          <tr v-for="product in products" :key="product.id" class="hover:bg-secondary-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div class="w-12 h-12 bg-secondary-100 rounded overflow-hidden flex-shrink-0">
                  <img 
                    :src="product.images?.[0]?.url || '/placeholder.jpg'" 
                    :alt="product.name"
                    class="w-full h-full object-cover"
                  />
                </div>
                <div class="ml-4">
                  <p class="font-medium text-secondary-900 line-clamp-1">{{ product.name }}</p>
                  <p class="text-sm text-secondary-500">{{ product.category?.name }}</p>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
              {{ product.sku }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div>
                <p class="font-medium text-secondary-900">{{ formatPrice(product.price) }}</p>
                <p v-if="product.salePrice" class="text-sm text-green-600">
                  Sale: {{ formatPrice(product.salePrice) }}
                </p>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span 
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  product.stock === 0 
                    ? 'bg-red-100 text-red-800' 
                    : product.stock < 10 
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                ]"
              >
                {{ product.stock }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span 
                :class="[
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  product.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-secondary-100 text-secondary-800'
                ]"
              >
                {{ product.isActive ? 'Active' : 'Inactive' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <RouterLink 
                :to="`/admin/products/${product.id}`"
                class="text-primary-600 hover:text-primary-900 mr-4"
              >
                Edit
              </RouterLink>
              <button 
                @click="deleteProduct(product.id)"
                class="text-red-600 hover:text-red-900"
              >
                Delete
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
