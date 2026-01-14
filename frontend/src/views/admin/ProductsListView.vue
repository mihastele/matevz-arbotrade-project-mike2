<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { productsApi } from '@/api/products'
import type { ImportResult, ImportResultV3 } from '@/api/products'
import { useToast } from '@/composables/useToast'
import type { Product } from '@/types'

const toast = useToast()

const products = ref<Product[]>([])
const loading = ref(true)
const search = ref('')
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0
})
const filterStatus = ref<string>('') // Empty means all

const showImportModal = ref(false)
const importFile = ref<File | null>(null)
const importType = ref<'csv' | 'zip' | 'skyman-index-zip'>('skyman-index-zip')
const overrideExisting = ref(true)
const importing = ref(false)
const importResult = ref<ImportResult | ImportResultV3 | null>(null)
const exporting = ref(false)

function formatPrice(price: number): string {
  return new Intl.NumberFormat('sl-SI', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}

async function loadProducts() {
  loading.value = true
  try {
    const params: Record<string, unknown> = {
      page: pagination.value.page,
      limit: pagination.value.limit,
    }
    if (search.value) params.search = search.value
    if (filterStatus.value) {
      params.status = filterStatus.value
    } else {
      params.showAll = true
    }
    
    const response = await productsApi.getAll(params)
    products.value = response.data
    pagination.value.total = response.meta.total
    pagination.value.totalPages = response.meta.totalPages
  } catch (error) {
    toast.error('Failed to load products')
  } finally {
    loading.value = false
  }
}

function handlePageChange(page: number) {
  pagination.value.page = page
  loadProducts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
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

function openImportModal() {
  showImportModal.value = true
  importFile.value = null
  importResult.value = null
  overrideExisting.value = true
}

function closeImportModal() {
  showImportModal.value = false
  importFile.value = null
  importResult.value = null
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    importFile.value = file
    
    // Auto-detect type from extension (except if explicitly set to skyman-index-zip)
    if (importType.value !== 'skyman-index-zip') {
      if (file.name.endsWith('.zip')) {
        importType.value = 'zip'
      } else if (file.name.endsWith('.csv')) {
        importType.value = 'csv'
      }
    }
  }
}

async function handleImport() {
  if (!importFile.value) {
    toast.error('Please select a file')
    return
  }

  importing.value = true
  importResult.value = null

  try {
    if (importType.value === 'skyman-index-zip') {
      importResult.value = await productsApi.importSkymanIndexZIP(importFile.value, overrideExisting.value)
    } else if (importType.value === 'zip') {
      importResult.value = await productsApi.importZIP(importFile.value)
    } else {
      importResult.value = await productsApi.importCSV(importFile.value)
    }

    if (importResult.value.success > 0) {
      toast.success(`Successfully imported ${importResult.value.success} products`)
      await loadProducts()
    }

    if (importResult.value.failed > 0) {
      toast.error(`${importResult.value.failed} products failed to import`)
    }
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } }; message?: string }
    toast.error(err.response?.data?.message || err.message || 'Import failed')
  } finally {
    importing.value = false
  }
}

async function handleExport() {
  exporting.value = true
  try {
    const blob = await productsApi.exportCSV()
    
    // Create download link
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `products-export-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    toast.success('Products exported successfully')
  } catch (error) {
    toast.error('Export failed')
  } finally {
    exporting.value = false
  }
}

onMounted(loadProducts)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-secondary-900">Products</h1>
      <div class="flex gap-2">
        <BaseButton variant="secondary" @click="openImportModal">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Import
        </BaseButton>
        <BaseButton variant="secondary" @click="handleExport" :loading="exporting">
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </BaseButton>
        <RouterLink to="/admin/products/new">
          <BaseButton>
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </BaseButton>
        </RouterLink>
      </div>
    </div>

    <!-- Search & Filters -->
    <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div class="flex flex-col md:flex-row gap-4">
        <div class="flex-1">
          <BaseInput
            v-model="search"
            placeholder="Search products..."
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="w-full md:w-48">
          <select
            v-model="filterStatus"
            class="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            @change="handleSearch"
          >
            <option value="">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
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

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 1" class="mt-8 flex justify-center">
      <nav class="flex items-center gap-2">
        <button
          :disabled="pagination.page === 1"
          class="px-3 py-2 rounded-lg border border-secondary-300 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="handlePageChange(pagination.page - 1)"
        >
          Previous
        </button>
        
        <template v-for="page in pagination.totalPages" :key="page">
          <button
            v-if="page === 1 || page === pagination.totalPages || (page >= pagination.page - 1 && page <= pagination.page + 1)"
            :class="[
              'w-10 h-10 rounded-lg',
              page === pagination.page
                ? 'bg-primary-600 text-white'
                : 'border border-secondary-300 hover:bg-secondary-50'
            ]"
            @click="handlePageChange(page)"
          >
            {{ page }}
          </button>
          <span 
            v-else-if="page === pagination.page - 2 || page === pagination.page + 2"
            class="px-2"
          >
            ...
          </span>
        </template>
        
        <button
          :disabled="pagination.page === pagination.totalPages"
          class="px-3 py-2 rounded-lg border border-secondary-300 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
          @click="handlePageChange(pagination.page + 1)"
        >
          Next
        </button>
      </nav>
    </div>

    <!-- Import Modal -->
    <Teleport to="body">
      <div
        v-if="showImportModal"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        @click.self="closeImportModal"
      >
        <div class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
          <div class="flex items-center justify-between px-6 py-4 border-b">
            <h3 class="text-lg font-semibold text-secondary-900">Import Products</h3>
            <button
              @click="closeImportModal"
              class="text-secondary-400 hover:text-secondary-600 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="p-6 space-y-4">
            <!-- File type selection -->
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">Import Type</label>
              <div class="flex flex-col gap-2">
                <label class="flex items-center">
                  <input type="radio" v-model="importType" value="skyman-index-zip" class="mr-2" />
                  <span class="font-medium text-primary-700">Skyman Index ZIP (Recommended)</span>
                </label>
                <label class="flex items-center">
                  <input type="radio" v-model="importType" value="csv" class="mr-2" />
                  <span>CSV (WooCommerce)</span>
                </label>
                <label class="flex items-center">
                  <input type="radio" v-model="importType" value="zip" class="mr-2" />
                  <span>ZIP with Images</span>
                </label>
              </div>
            </div>

            <!-- File input section -->
            <div>
              <label class="block text-sm font-medium text-secondary-700 mb-2">Select File</label>
              <input
                type="file"
                :accept="importType === 'skyman-index-zip' || importType === 'zip' ? '.zip' : '.csv'"
                @change="handleFileSelect"
                class="block w-full text-sm text-secondary-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <p class="text-xs text-secondary-500 mt-1">
                {{ importType === 'skyman-index-zip'
                  ? 'ZIP file must contain: index.csv (with image_paths column) and images/ folder'
                  : importType === 'zip' 
                    ? 'ZIP file should contain products.csv and an images/ folder' 
                    : 'CSV file in WooCommerce export format' 
                }}
              </p>
            </div>

            <!-- Override option for existing products -->
            <div v-if="importType === 'skyman-index-zip'">
              <label class="block text-sm font-medium text-secondary-700 mb-2">Existing Products</label>
              <div class="flex flex-col gap-2">
                <label class="flex items-center">
                  <input type="radio" v-model="overrideExisting" :value="true" class="mr-2" />
                  <span>Override data from CSV (images always updated)</span>
                </label>
                <label class="flex items-center">
                  <input type="radio" v-model="overrideExisting" :value="false" class="mr-2" />
                  <span>Keep existing data (only update images)</span>
                </label>
              </div>
              <p class="text-xs text-secondary-500 mt-1">
                Note: Images are always replaced with new ones from the import file.
              </p>
            </div>

            <!-- Import result -->
            <div v-if="importResult" class="mt-4 p-4 rounded-lg" :class="importResult.failed === 0 ? 'bg-green-50' : 'bg-yellow-50'">
              <p class="font-medium" :class="importResult.failed === 0 ? 'text-green-800' : 'text-yellow-800'">
                Import completed: {{ importResult.success }} successful, {{ importResult.failed }} failed
              </p>
              <div v-if="importResult.errors.length > 0" class="mt-2 max-h-32 overflow-y-auto">
                <p class="text-sm text-yellow-700" v-for="(err, idx) in importResult.errors.slice(0, 10)" :key="idx">
                  Row {{ err.row }}: {{ err.error }} {{ err.name ? `(${err.name})` : '' }}
                </p>
                <p v-if="importResult.errors.length > 10" class="text-sm text-yellow-700">
                  ... and {{ importResult.errors.length - 10 }} more errors
                </p>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4">
              <BaseButton type="button" variant="secondary" @click="closeImportModal">
                Cancel
              </BaseButton>
              <BaseButton 
                @click="handleImport" 
                :loading="importing" 
                :disabled="!importFile"
              >
                Import
              </BaseButton>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
