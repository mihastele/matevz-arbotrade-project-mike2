<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { productsApi } from '@/api/products'
import { categoriesApi } from '@/api/categories'
import { useToast } from '@/composables/useToast'
import ImageUploader from '@/components/admin/ImageUploader.vue'
import DocumentUploader from '@/components/admin/DocumentUploader.vue'
import ProductImageGrid from '@/components/admin/ProductImageGrid.vue'
import type { Product, Category, ProductImage } from '@/types'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const isEdit = computed(() => !!route.params.id)
const loading = ref(false)
const saving = ref(false)
const categories = ref<Category[]>([])

const form = ref({
  name: '',
  slug: '',
  sku: '',
  description: '',
  shortDescription: '',
  price: '',
  salePrice: '',
  stock: '',
  categoryId: '',
  status: 'draft',
  isFeatured: false,
  images: [] as ProductImage[],
})

const uploadedImages = ref<ProductImage[]>([])

const errors = ref<Record<string, string>>({})

const categoryOptions = computed(() => 
  categories.value.map(c => ({ value: c.id, label: c.name }))
)

const statusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
]

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function handleNameChange() {
  if (!isEdit.value) {
    form.value.slug = generateSlug(form.value.name)
  }
}

async function loadCategories() {
  try {
    const response = await categoriesApi.getAll()
    categories.value = response
  } catch (error) {
    console.error('Failed to load categories:', error)
  }
}

async function loadProduct() {
  if (!isEdit.value) return
  
  loading.value = true
  try {
    const response = await productsApi.getOne(route.params.id as string)
    const product: Product = response
    
    form.value = {
      name: product.name,
      slug: product.slug,
      sku: product.sku || '',
      description: product.description || '',
      shortDescription: product.shortDescription || '',
      price: String(product.price),
      salePrice: product.salePrice ? String(product.salePrice) : '',
      stock: String(product.stock),
      categoryId: product.categoryId || '',
      status: product.status,
      isFeatured: product.isFeatured,
      images: product.images || [],
    }
    uploadedImages.value = [...(product.images || [])]
  } catch (error) {
    toast.error('Product not found')
    router.push('/admin/products')
  } finally {
    loading.value = false
  }
}

function validate(): boolean {
  errors.value = {}
  
  if (!form.value.name) errors.value.name = 'Name is required'
  if (!form.value.slug) errors.value.slug = 'Slug is required'
  if (!form.value.price) errors.value.price = 'Price is required'
  if (!form.value.stock) errors.value.stock = 'Stock is required'
  
  return Object.keys(errors.value).length === 0
}

function handleImagesUploaded(urls: string[]) {
  const newImages: ProductImage[] = urls.map((url, index) => ({
    id: `new-${Date.now()}-${index}`,
    url,
    type: 'image',
    sortOrder: uploadedImages.value.length + index,
    isPrimary: uploadedImages.value.length === 0 && index === 0
  }))
  uploadedImages.value = [...uploadedImages.value, ...newImages]
}

function removeImage(id: string) {
  uploadedImages.value = uploadedImages.value.filter(img => img.id !== id)
  // If we removed the primary image, set the first remaining one as primary
  if (uploadedImages.value.length > 0 && !uploadedImages.value.find(img => img.isPrimary)) {
    uploadedImages.value[0].isPrimary = true
  }
}

function setPrimaryImage(id: string) {
  uploadedImages.value = uploadedImages.value.map(img => ({
    ...img,
    isPrimary: img.id === id
  }))
}

const uploadedDocuments = computed(() => {
  return uploadedImages.value.filter(img => img.type === 'pdf')
})

const uploadedPhotos = computed(() => {
  return uploadedImages.value.filter(img => img.type === 'image' || !img.type)
})

function handleDocumentsUploaded(urls: string[]) {
  const newDocs: ProductImage[] = urls.map((url, index) => ({
    id: `new-doc-${Date.now()}-${index}`,
    url,
    type: 'pdf',
    sortOrder: uploadedImages.value.length + index,
    isPrimary: false
  }))
  uploadedImages.value = [...uploadedImages.value, ...newDocs]
}

async function handleSubmit() {
  if (!validate()) return
  
  saving.value = true
  try {
    const data = {
      name: form.value.name,
      slug: form.value.slug,
      sku: form.value.sku || undefined,
      description: form.value.description || undefined,
      shortDescription: form.value.shortDescription || undefined,
      price: Number(form.value.price),
      salePrice: form.value.salePrice ? Number(form.value.salePrice) : undefined,
      stock: Number(form.value.stock),
      categoryId: form.value.categoryId || undefined,
      status: form.value.status as 'draft' | 'published' | 'archived',
      isFeatured: form.value.isFeatured,
      images: uploadedImages.value.map((img, index) => ({
        id: img.id,
        url: img.url,
        alt: img.alt,
        type: img.type,
        sortOrder: index,
        isPrimary: img.isPrimary
      }))
    }
    
    if (isEdit.value) {
      await productsApi.update(route.params.id as string, data)
      toast.success('Product updated')
    } else {
      await productsApi.create(data)
      toast.success('Product created')
    }
    
    router.push('/admin/products')
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    toast.error(err.response?.data?.message || 'Failed to save product')
  } finally {
    saving.value = false
  }
}

function getFileNameFromUrl(url: string): string {
  const parts = url.split('/')
  return parts[parts.length - 1] || 'Document'
}

onMounted(() => {
  loadCategories()
  loadProduct()
})
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-secondary-900">
        {{ isEdit ? 'Edit Product' : 'New Product' }}
      </h1>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="animate-pulse bg-white rounded-lg p-6">
      <div class="h-6 bg-secondary-200 rounded w-1/3 mb-4"></div>
      <div class="space-y-4">
        <div class="h-10 bg-secondary-200 rounded"></div>
        <div class="h-10 bg-secondary-200 rounded"></div>
        <div class="h-32 bg-secondary-200 rounded"></div>
      </div>
    </div>

    <!-- Form -->
    <form v-else @submit.prevent="handleSubmit" class="space-y-6">
      <!-- Basic Info -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-semibold text-secondary-900 mb-4">Basic Information</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseInput
            v-model="form.name"
            label="Product Name"
            required
            :error="errors.name"
            @input="handleNameChange"
          />
          <BaseInput
            v-model="form.slug"
            label="Slug"
            required
            :error="errors.slug"
          />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <BaseInput
            v-model="form.sku"
            label="SKU"
          />
          <BaseSelect
            v-model="form.categoryId"
            label="Category"
            :options="categoryOptions"
            placeholder="Select category"
          />
        </div>

        <div class="mt-4">
          <BaseInput
            v-model="form.shortDescription"
            label="Short Description"
          />
        </div>

        <div class="mt-4">
          <label class="block text-sm font-medium text-secondary-700 mb-1">Description</label>
          <textarea
            v-model="form.description"
            rows="5"
            class="w-full px-4 py-2.5 rounded-lg border border-secondary-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
          ></textarea>
        </div>
      </div>

      <!-- Pricing -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-semibold text-secondary-900 mb-4">Pricing & Inventory</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <BaseInput
            v-model="form.price"
            label="Price (€)"
            type="number"
            step="0.01"
            required
            :error="errors.price"
          />
          <BaseInput
            v-model="form.salePrice"
            label="Sale Price (€)"
            type="number"
            step="0.01"
          />
          <BaseInput
            v-model="form.stock"
            label="Stock Quantity"
            type="number"
            required
            :error="errors.stock"
          />
        </div>
      </div>

      <!-- Status -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-semibold text-secondary-900 mb-4">Status</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseSelect
            v-model="form.status"
            label="Status"
            :options="statusOptions"
          />
          <div class="flex items-center">
            <label class="flex items-center">
              <input 
                v-model="form.isFeatured"
                type="checkbox"
                class="w-4 h-4 text-primary-600 border-secondary-300 rounded focus:ring-primary-500"
              />
              <span class="ml-2 text-secondary-700">Featured Product</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Images -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-secondary-900">Product Images</h2>
          <span class="text-sm text-secondary-500">{{ uploadedImages.length }} image(s)</span>
        </div>
        
        <div class="space-y-6">
          <ProductImageGrid 
            v-if="uploadedPhotos.length > 0"
            :images="uploadedPhotos"
            @remove="removeImage"
            @set-primary="setPrimaryImage"
          />

          <ImageUploader 
            multiple
            @uploaded="handleImagesUploaded"
            @error="toast.error"
          />
        </div>
      </div>

      <!-- Documents -->
      <div class="bg-white rounded-lg shadow-sm p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-secondary-900">Product Documents (PDF)</h2>
          <span class="text-sm text-secondary-500">{{ uploadedDocuments.length }} document(s)</span>
        </div>
        
        <div class="space-y-6">
          <div v-if="uploadedDocuments.length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div 
              v-for="doc in uploadedDocuments" 
              :key="doc.id"
              class="flex items-center gap-3 p-3 border border-secondary-200 rounded-xl bg-secondary-50/50"
            >
              <div class="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600">
                <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4z"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-secondary-900 truncate">{{ doc.alt || getFileNameFromUrl(doc.url) }}</p>
                <p class="text-xs text-secondary-500">PDF Document</p>
              </div>
              <button 
                type="button"
                @click="removeImage(doc.id)"
                class="p-2 text-secondary-400 hover:text-red-600 transition-colors"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <DocumentUploader 
            multiple
            @uploaded="handleDocumentsUploaded"
            @error="toast.error"
          />
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-4">
        <BaseButton type="button" variant="outline" @click="router.push('/admin/products')">
          Cancel
        </BaseButton>
        <BaseButton type="submit" :loading="saving">
          {{ isEdit ? 'Update Product' : 'Create Product' }}
        </BaseButton>
      </div>
    </form>
  </div>
</template>
