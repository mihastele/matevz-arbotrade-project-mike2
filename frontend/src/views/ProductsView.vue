<script setup lang="ts">
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ProductCard from '@/components/product/ProductCard.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { productsApi } from '@/api/products'
import { categoriesApi } from '@/api/categories'
import type { Product, Category } from '@/types'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const products = ref<Product[]>([])
const categories = ref<Category[]>([])
const loading = ref(true)
const pagination = ref({
  page: 1,
  limit: 12,
  total: 0,
  totalPages: 0
})

// Filters
const search = ref('')
const categoryId = ref('')
const sortBy = ref('createdAt')
const sortOrder = ref<'ASC' | 'DESC'>('DESC')
const minPrice = ref('')
const maxPrice = ref('')

const sortOptions = computed(() => [
  { value: 'createdAt-DESC', label: t('productsPage.sort.newestFirst') },
  { value: 'createdAt-ASC', label: t('productsPage.sort.oldestFirst') },
  { value: 'price-ASC', label: t('productsPage.sort.priceLowHigh') },
  { value: 'price-DESC', label: t('productsPage.sort.priceHighLow') },
  { value: 'name-ASC', label: t('productsPage.sort.nameAZ') },
  { value: 'name-DESC', label: t('productsPage.sort.nameZA') },
])

// Get top-level categories for the navigation bar
const topLevelCategories = computed(() => {
  return categories.value.filter(cat => !cat.parentId && cat.isActive !== false)
})

const flatCategoryOptions = computed(() => {
  const options: { value: string; label: string }[] = []
  
  const processCategory = (cat: Category, level: number) => {
    const prefix = level === 0 ? '' : level === 1 ? '> ' : '>> '
    options.push({ value: cat.id, label: prefix + cat.name })
    if (cat.children?.length) {
      cat.children.forEach(child => processCategory(child, level + 1))
    }
  }
  
  // Process only top-level categories (those with children defined from tree)
  categories.value.forEach(cat => processCategory(cat, 0))
  return options
})

async function loadProducts() {
  loading.value = true
  try {
    const params: Record<string, unknown> = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      sortBy: sortBy.value,
      sortOrder: sortOrder.value,
    }
    
    if (search.value) params.search = search.value
    if (categoryId.value) params.categoryId = categoryId.value
    if (minPrice.value) params.minPrice = Number(minPrice.value)
    if (maxPrice.value) params.maxPrice = Number(maxPrice.value)
    
    const response = await productsApi.getAll(params)
    
    products.value = response.data
    pagination.value.total = response.meta.total
    pagination.value.totalPages = response.meta.totalPages
  } catch (error) {
    console.error('Failed to load products:', error)
  } finally {
    loading.value = false
  }
}

async function loadCategories() {
  try {
    // Load tree structure for hierarchical navigation
    const response = await categoriesApi.getTree()
    categories.value = response
  } catch (error) {
    console.error('Failed to load categories:', error)
  }
}

function selectCategory(catId: string) {
  categoryId.value = catId
  pagination.value.page = 1
  updateUrl()
  loadProducts()
}

function handleSortChange(value: string) {
  const [field, order] = value.split('-')
  sortBy.value = field
  sortOrder.value = order as 'ASC' | 'DESC'
  pagination.value.page = 1
  updateUrl()
  loadProducts()
}

function handleCategoryChange(value: string) {
  categoryId.value = value
  pagination.value.page = 1
  updateUrl()
  loadProducts()
}

function handleSearch() {
  pagination.value.page = 1
  updateUrl()
  loadProducts()
}

function handlePageChange(page: number) {
  pagination.value.page = page
  updateUrl()
  loadProducts()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function clearFilters() {
  search.value = ''
  categoryId.value = ''
  minPrice.value = ''
  maxPrice.value = ''
  sortBy.value = 'createdAt'
  sortOrder.value = 'DESC'
  pagination.value.page = 1
  updateUrl()
  loadProducts()
}

function updateUrl() {
  const query: Record<string, string> = {}
  if (search.value) query.search = search.value
  if (categoryId.value) query.category = categoryId.value
  if (pagination.value.page > 1) query.page = String(pagination.value.page)
  if (sortBy.value !== 'createdAt' || sortOrder.value !== 'DESC') {
    query.sort = `${sortBy.value}-${sortOrder.value}`
  }
  router.replace({ query })
}

function initFromUrl() {
  const { search: s, category, page, sort } = route.query
  if (s) search.value = s as string
  if (category) categoryId.value = category as string
  if (page) pagination.value.page = Number(page)
  if (sort) {
    const [field, order] = (sort as string).split('-')
    sortBy.value = field
    sortOrder.value = order as 'ASC' | 'DESC'
  }
}

onMounted(() => {
  initFromUrl()
  loadCategories()
  loadProducts()
})

// Watch for route changes from category pages
watch(() => route.query.category, (newCategory) => {
  if (newCategory !== categoryId.value) {
    categoryId.value = newCategory as string || ''
    loadProducts()
  }
})
</script>

<template>
  <div>
    <!-- Persistent Category Navigation Bar -->
    <div class="bg-white border-b border-secondary-200 shadow-sm">
      <div class="container-custom">
        <div class="py-3">
          <!-- Category Navigation - Boxy Design -->
          <div class="flex flex-wrap gap-1">
            <!-- All Products -->
            <button
              @click="selectCategory('')"
              :class="[
                'px-4 py-2 text-sm font-medium transition-all border',
                !categoryId
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-secondary-700 border-secondary-200 hover:bg-secondary-50 hover:border-secondary-300'
              ]"
            >
              {{ t('productsPage.allCategories') }}
            </button>

            <!-- Category buttons with hover dropdowns -->
            <div 
              v-for="category in topLevelCategories" 
              :key="category.id"
              class="relative group"
            >
              <button
                @click="selectCategory(category.id)"
                :class="[
                  'px-4 py-2 text-sm font-medium transition-all border flex items-center gap-1',
                  categoryId === category.id
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-secondary-700 border-secondary-200 hover:bg-secondary-50 hover:border-secondary-300'
                ]"
              >
                {{ category.name }}
                <svg 
                  v-if="category.children?.length"
                  class="w-4 h-4 transition-transform group-hover:rotate-180"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <!-- Hover Dropdown with Subcategories and Sub-subcategories -->
              <div
                v-if="category.children?.length"
                class="absolute left-0 top-full mt-0 bg-white shadow-lg border border-secondary-200 min-w-64 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150"
              >
                <!-- View all in this category -->
                <button
                  @click="selectCategory(category.id)"
                  class="w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 font-medium border-b border-secondary-100"
                >
                  {{ t('productsPage.viewAll') }} {{ category.name }}
                </button>
                
                <!-- Subcategories with sub-subcategories -->
                <div class="max-h-80 overflow-y-auto">
                  <div
                    v-for="child in category.children"
                    :key="child.id"
                    class="border-b border-secondary-50 last:border-b-0"
                  >
                    <!-- Subcategory -->
                    <button
                      @click="selectCategory(child.id)"
                      :class="[
                        'w-full text-left px-4 py-2 text-sm transition-colors font-medium',
                        categoryId === child.id
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-secondary-800 hover:bg-secondary-50'
                      ]"
                    >
                      {{ child.name }}
                    </button>
                    
                    <!-- Sub-subcategories (3rd level) -->
                    <div v-if="child.children?.length" class="bg-secondary-50">
                      <button
                        v-for="subChild in child.children"
                        :key="subChild.id"
                        @click="selectCategory(subChild.id)"
                        :class="[
                          'w-full text-left px-6 py-1.5 text-xs transition-colors',
                          categoryId === subChild.id
                            ? 'bg-primary-100 text-primary-700 font-medium'
                            : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-800'
                        ]"
                      >
                        {{ subChild.name }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Click-outside handler removed - using hover instead -->

    <div class="py-8">
      <div class="container-custom">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-secondary-900">{{ t('productsPage.title') }}</h1>
          <p class="text-secondary-600 mt-2">{{ t('productsPage.subtitle') }}</p>
        </div>

      <div class="lg:flex lg:gap-8">
        <!-- Sidebar Filters (Desktop) -->
        <aside class="hidden lg:block lg:w-64 flex-shrink-0">
          <div class="bg-white rounded-lg shadow-sm p-6 sticky top-24">
            <div class="flex items-center justify-between mb-6">
              <h3 class="font-semibold text-secondary-900">{{ t('productsPage.filters') }}</h3>
              <button 
                @click="clearFilters"
                class="text-sm text-primary-600 hover:text-primary-700"
              >
                {{ t('productsPage.clearAll') }}
              </button>
            </div>

            <!-- Category Filter -->
            <div class="mb-6">
              <BaseSelect
                v-model="categoryId"
                :label="t('productsPage.category')"
                :options="flatCategoryOptions"
                :placeholder="t('productsPage.allCategories')"
                @update:model-value="handleCategoryChange"
              />
            </div>

            <!-- Price Range -->
            <div class="mb-6">
              <label class="block text-sm font-medium text-secondary-700 mb-2">
                {{ t('productsPage.priceRange') }}
              </label>
              <div class="flex gap-2">
                <BaseInput
                  v-model="minPrice"
                  type="number"
                  :placeholder="t('productsPage.min')"
                  @change="handleSearch"
                />
                <BaseInput
                  v-model="maxPrice"
                  type="number"
                  :placeholder="t('productsPage.max')"
                  @change="handleSearch"
                />
              </div>
            </div>
          </div>
        </aside>

        <!-- Main Content -->
        <div class="flex-1">
          <!-- Search & Sort Bar -->
          <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div class="flex flex-col sm:flex-row gap-4">
              <!-- Search -->
              <div class="flex-1">
                <div class="relative">
                  <input
                    v-model="search"
                    type="text"
                    :placeholder="t('productsPage.searchPlaceholder')"
                    class="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    @keyup.enter="handleSearch"
                  />
                  <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <!-- Sort -->
              <div class="w-full sm:w-48">
                <select
                  :value="`${sortBy}-${sortOrder}`"
                  class="w-full px-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  @change="handleSortChange(($event.target as HTMLSelectElement).value)"
                >
                  <option v-for="option in sortOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Mobile Category Filter -->
            <div class="mt-4 lg:hidden">
              <BaseSelect
                v-model="categoryId"
                :options="flatCategoryOptions"
                :placeholder="t('productsPage.allCategories')"
                @update:model-value="handleCategoryChange"
              />
            </div>
          </div>

          <!-- Results Info -->
          <div class="flex items-center justify-between mb-4 text-sm text-secondary-600">
            <span>{{ pagination.total }} {{ t('productsPage.results') }}</span>
            <span v-if="pagination.totalPages > 1">
              {{ t('productsPage.page') }} {{ pagination.page }} {{ t('productsPage.of') }} {{ pagination.totalPages }}
            </span>
          </div>

          <!-- Loading State -->
          <div v-if="loading" class="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div v-for="i in 12" :key="i" class="animate-pulse">
              <div class="aspect-square bg-secondary-200 rounded-lg mb-4"></div>
              <div class="h-4 bg-secondary-200 rounded w-3/4 mb-2"></div>
              <div class="h-4 bg-secondary-200 rounded w-1/2"></div>
            </div>
          </div>

          <!-- Products Grid -->
          <div v-else-if="products.length > 0" class="grid grid-cols-2 md:grid-cols-3 gap-6">
            <ProductCard 
              v-for="product in products" 
              :key="product.id" 
              :product="product" 
            />
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-16 bg-white rounded-lg">
            <svg class="w-16 h-16 mx-auto text-secondary-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <h3 class="text-lg font-medium text-secondary-900 mb-2">{{ t('productsPage.noResults') }}</h3>
            <p class="text-secondary-500 mb-4">{{ t('productsPage.subtitle') }}</p>
            <button @click="clearFilters" class="btn-primary">
              {{ t('productsPage.clearAll') }}
            </button>
          </div>

          <!-- Pagination -->
          <div v-if="pagination.totalPages > 1" class="mt-8 flex justify-center">
            <nav class="flex items-center gap-2">
              <button
                :disabled="pagination.page === 1"
                class="px-3 py-2 rounded-lg border border-secondary-300 hover:bg-secondary-50 disabled:opacity-50 disabled:cursor-not-allowed"
                @click="handlePageChange(pagination.page - 1)"
              >
                {{ t('common.previous') }}
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
                {{ t('common.next') }}
              </button>
            </nav>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</template>
