<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { productsApi } from '@/api/products'
import type { ImportResult, ImportResultV2, ImportResultV3 } from '@/api/products'
import { useToast } from '@/composables/useToast'
import type { Product } from '@/types'

const toast = useToast()

const products = ref<Product[]>([])
const loading = ref(true)
const search = ref('')

// Import/Export state
const showImportModal = ref(false)
const importFile = ref<File | null>(null)
const skymanCsvFile = ref<File | null>(null)
const imageBasePath = ref('d:/development/paid/matevzzupan/vuenest/ignore')
const importType = ref<'csv' | 'csv-v2' | 'zip' | 'skyman-zip'>('csv-v2')
const importing = ref(false)
const importResult = ref<ImportResult | ImportResultV2 | ImportResultV3 | null>(null)
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

// Import/Export functions
function openImportModal() {
  showImportModal.value = true
  importFile.value = null
  importResult.value = null
}

function closeImportModal() {
  showImportModal.value = false
  importFile.value = null
  skymanCsvFile.value = null
  importResult.value = null
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    importFile.value = file
    
    // Auto-detect type from extension
    if (file.name.endsWith('.zip')) {
      importType.value = 'zip'
    } else if (file.name.endsWith('.csv') && importType.value !== 'skyman-zip') {
      importType.value = 'csv'
    }
  }
}

function handleSkymanFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    skymanCsvFile.value = target.files[0]
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
    if (importType.value === 'skyman-zip') {
      if (!skymanCsvFile.value) {
        toast.error('Please select the skyman.csv file')
        importing.value = false
        return
      }
      importResult.value = await productsApi.importSkymanZIP(
        importFile.value,
        skymanCsvFile.value,
        imageBasePath.value,
      )
    } else if (importType.value === 'zip') {
      importResult.value = await productsApi.importZIP(importFile.value)
    } else if (importType.value === 'csv-v2') {
      importResult.value = await productsApi.importCSVv2(importFile.value)
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
                  <input type="radio" v-model="importType" value="skyman-zip" class="mr-2" />
                  <span class="font-medium text-primary-700">Skyman ZIP Import (Local Images)</span>
                </label>
                <label class="flex items-center">
                  <input type="radio" v-model="importType" value="csv-v2" class="mr-2" />
                  <span>CSV V2 (New Format)</span>
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

            <!-- Skyman ZIP specific inputs -->
            <template v-if="importType === 'skyman-zip'">
              <div>
                <label class="block text-sm font-medium text-secondary-700 mb-2">Products CSV (slovene.csv)</label>
                <input
                  type="file"
                  accept=".csv"
                  @change="handleFileSelect"
                  class="block w-full text-sm text-secondary-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-secondary-700 mb-2">Skyman CSV (skyman.csv)</label>
                <input
                  type="file"
                  accept=".csv"
                  @change="handleSkymanFileSelect"
                  class="block w-full text-sm text-secondary-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-secondary-700 mb-2">Image Base Path</label>
                <input
                  v-model="imageBasePath"
                  type="text"
                  placeholder="d:/project/ignore"
                  class="block w-full border rounded-lg px-3 py-2 text-sm"
                />
                <p class="text-xs text-secondary-500 mt-1">
                  Path to the folder containing the images/ subfolder (e.g., d:/project/ignore)
                </p>
              </div>
            </template>

            <!-- Standard file input -->
            <div v-else>
              <label class="block text-sm font-medium text-secondary-700 mb-2">Select File</label>
              <input
                type="file"
                :accept="importType === 'zip' ? '.zip' : '.csv'"
                @change="handleFileSelect"
                class="block w-full text-sm text-secondary-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <p class="text-xs text-secondary-500 mt-1">
                {{ importType === 'zip' 
                  ? 'ZIP file should contain products.csv and an images/ folder' 
                  : importType === 'csv-v2'
                    ? 'CSV with columns: SKU, BRAND, IME PRODUKTA, KATEGORIJA, etc. Images are downloaded in background.'
                    : 'CSV file in WooCommerce export format' 
                }}
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
