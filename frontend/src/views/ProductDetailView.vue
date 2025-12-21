<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import { productsApi } from '@/api/products'
import { useCartStore } from '@/stores/cart'
import { useToast } from '@/composables/useToast'
import type { Product, ProductVariant } from '@/types'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const toast = useToast()

const product = ref<Product | null>(null)
const loading = ref(true)
const quantity = ref(1)
const selectedVariant = ref<ProductVariant | null>(null)
const selectedImageIndex = ref(0)
const addingToCart = ref(false)
const activeTab = ref<'description' | 'specifications'>('description')

const images = computed(() => {
  if (!product.value?.images?.length) {
    return [{ id: '0', url: '/placeholder.jpg', alt: 'Product image', isPrimary: true, sortOrder: 0, type: 'image' as const }]
  }
  return product.value.images.sort((a, b) => {
    if (a.isPrimary) return -1
    if (b.isPrimary) return 1
    return a.sortOrder - b.sortOrder
  })
})

const currentImage = computed(() => images.value[selectedImageIndex.value])

const currentPrice = computed(() => {
  if (selectedVariant.value?.price) {
    return selectedVariant.value.price
  }
  return product.value?.salePrice || product.value?.price || 0
})

const originalPrice = computed(() => {
  return product.value?.price || 0
})

const hasDiscount = computed(() => {
  if (selectedVariant.value?.price) {
    return selectedVariant.value.price < originalPrice.value
  }
  return product.value?.salePrice && product.value.salePrice < product.value.price
})

const isInStock = computed(() => {
  if (selectedVariant.value) {
    return selectedVariant.value.stock > 0
  }
  return (product.value?.stock || 0) > 0
})

const stockQuantity = computed(() => {
  if (selectedVariant.value) {
    return selectedVariant.value.stock
  }
  return product.value?.stock || 0
})

const variantOptions = computed(() => {
  if (!product.value?.variants?.length) return []
  return product.value.variants.map(v => ({
    value: v.id,
    label: `${v.name}${v.stock === 0 ? ' (Out of Stock)' : ''}`
  }))
})

function formatPrice(price: number): string {
  return new Intl.NumberFormat('sl-SI', {
    style: 'currency',
    currency: 'EUR'
  }).format(price)
}

function handleVariantChange(variantId: string) {
  selectedVariant.value = product.value?.variants?.find(v => v.id === variantId) || null
}

async function addToCart() {
  if (!product.value || !isInStock.value) return
  
  addingToCart.value = true
  try {
    await cartStore.addItem({
      productId: product.value.id,
      quantity: quantity.value,
      variantId: selectedVariant.value?.id
    })
    toast.success('Added to cart!')
    quantity.value = 1
  } catch (error) {
    toast.error('Failed to add to cart')
  } finally {
    addingToCart.value = false
  }
}

async function loadProduct() {
  loading.value = true
  try {
    const slug = route.params.slug as string
    const response = await productsApi.getBySlug(slug)
    product.value = response
    
    // Set default variant if available
    if (product.value?.variants?.length) {
      selectedVariant.value = product.value.variants[0]
    }
  } catch (error) {
    toast.error('Product not found')
    router.push('/products')
  } finally {
    loading.value = false
  }
}

onMounted(loadProduct)

watch(() => route.params.slug, loadProduct)
</script>

<template>
  <div class="py-8">
    <div class="container-custom">
      <!-- Loading State -->
      <div v-if="loading" class="animate-pulse">
        <div class="lg:flex lg:gap-12">
          <div class="lg:w-1/2">
            <div class="aspect-square bg-secondary-200 rounded-lg"></div>
          </div>
          <div class="lg:w-1/2 mt-8 lg:mt-0">
            <div class="h-8 bg-secondary-200 rounded w-3/4 mb-4"></div>
            <div class="h-6 bg-secondary-200 rounded w-1/4 mb-6"></div>
            <div class="h-4 bg-secondary-200 rounded mb-2"></div>
            <div class="h-4 bg-secondary-200 rounded mb-2"></div>
            <div class="h-4 bg-secondary-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>

      <!-- Product Content -->
      <div v-else-if="product" class="lg:flex lg:gap-12">
        <!-- Images -->
        <div class="lg:w-1/2">
          <!-- Main Image -->
          <div class="aspect-square bg-secondary-100 rounded-lg overflow-hidden mb-4">
            <img 
              :src="currentImage.url" 
              :alt="currentImage.alt || product.name"
              class="w-full h-full object-cover"
            />
          </div>
          
          <!-- Thumbnails -->
          <div v-if="images.length > 1" class="flex gap-2 overflow-x-auto pb-2">
            <button
              v-for="(image, index) in images"
              :key="image.id"
              :class="[
                'w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors',
                index === selectedImageIndex ? 'border-primary-600' : 'border-transparent hover:border-secondary-300'
              ]"
              @click="selectedImageIndex = index"
            >
              <img 
                :src="image.url" 
                :alt="image.alt || `${product.name} ${index + 1}`"
                class="w-full h-full object-cover"
              />
            </button>
          </div>
        </div>

        <!-- Details -->
        <div class="lg:w-1/2 mt-8 lg:mt-0">
          <!-- Breadcrumb -->
          <nav class="text-sm mb-4">
            <ol class="flex items-center space-x-2 text-secondary-500">
              <li><RouterLink to="/" class="hover:text-primary-600">Home</RouterLink></li>
              <li>/</li>
              <li><RouterLink to="/products" class="hover:text-primary-600">Products</RouterLink></li>
              <li v-if="product.category">/</li>
              <li v-if="product.category">
                <RouterLink 
                  :to="`/products?category=${product.category.id}`" 
                  class="hover:text-primary-600"
                >
                  {{ product.category.name }}
                </RouterLink>
              </li>
            </ol>
          </nav>

          <!-- Name -->
          <h1 class="text-2xl md:text-3xl font-bold text-secondary-900 mb-2">
            {{ product.name }}
          </h1>

          <!-- SKU -->
          <p v-if="product.sku" class="text-sm text-secondary-500 mb-4">
            SKU: {{ product.sku }}
          </p>

          <!-- Price -->
          <div class="flex items-center gap-3 mb-6">
            <span class="text-3xl font-bold text-primary-600">
              {{ formatPrice(currentPrice) }}
            </span>
            <span 
              v-if="hasDiscount"
              class="text-lg text-secondary-400 line-through"
            >
              {{ formatPrice(originalPrice) }}
            </span>
          </div>

          <!-- Stock Status -->
          <div class="mb-6">
            <span 
              v-if="isInStock"
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800"
            >
              <span class="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              In Stock ({{ stockQuantity }} available)
            </span>
            <span 
              v-else
              class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800"
            >
              <span class="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              Out of Stock
            </span>
          </div>

          <!-- Short Description -->
          <p v-if="product.shortDescription" class="text-secondary-600 mb-6">
            {{ product.shortDescription }}
          </p>

          <!-- Variants -->
          <div v-if="variantOptions.length > 0" class="mb-6">
            <BaseSelect
              :model-value="selectedVariant?.id || ''"
              label="Select Option"
              :options="variantOptions"
              @update:model-value="handleVariantChange"
            />
          </div>

          <!-- Quantity & Add to Cart -->
          <div class="flex items-center gap-4 mb-8">
            <div class="flex items-center border border-secondary-300 rounded-lg">
              <button
                class="px-4 py-2 text-secondary-600 hover:bg-secondary-50 disabled:opacity-50"
                :disabled="quantity <= 1"
                @click="quantity--"
              >
                -
              </button>
              <span class="px-4 py-2 font-medium">{{ quantity }}</span>
              <button
                class="px-4 py-2 text-secondary-600 hover:bg-secondary-50 disabled:opacity-50"
                :disabled="quantity >= stockQuantity"
                @click="quantity++"
              >
                +
              </button>
            </div>

            <BaseButton
              :disabled="!isInStock"
              :loading="addingToCart"
              class="flex-1"
              @click="addToCart"
            >
              Add to Cart
            </BaseButton>
          </div>

          <!-- Tabs -->
          <div class="border-t border-secondary-200 pt-6">
            <div class="flex border-b border-secondary-200">
              <button
                :class="[
                  'px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors',
                  activeTab === 'description' 
                    ? 'border-primary-600 text-primary-600' 
                    : 'border-transparent text-secondary-600 hover:text-secondary-900'
                ]"
                @click="activeTab = 'description'"
              >
                Description
              </button>
              <button
                :class="[
                  'px-4 py-2 font-medium text-sm border-b-2 -mb-px transition-colors',
                  activeTab === 'specifications' 
                    ? 'border-primary-600 text-primary-600' 
                    : 'border-transparent text-secondary-600 hover:text-secondary-900'
                ]"
                @click="activeTab = 'specifications'"
              >
                Specifications
              </button>
            </div>

            <div class="py-6">
              <div v-if="activeTab === 'description'" class="prose prose-sm max-w-none">
                <div v-html="product.description || 'No description available.'"></div>
              </div>
              <div v-else>
                <p class="text-secondary-500">No specifications available.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
