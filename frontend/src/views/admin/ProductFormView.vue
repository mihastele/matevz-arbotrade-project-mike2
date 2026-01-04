<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSelect from '@/components/ui/BaseSelect.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { productsApi } from '@/api/products'
import { categoriesApi } from '@/api/categories'
import { useToast } from '@/composables/useToast'
import type { Product, Category } from '@/types'

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
  // New fields for image handling
  image: null as File | null,
  images: [] as File[] | null,
})

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
      image: null,
      images: null,
    }
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
      isFeatured: form.value.isFeatured
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
      <!-- <div class="bg-white rounded-lg shadow-sm p-6">
        <h2 class="text-lg font-semibold text-secondary-900 mb-4">Images</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BaseInput
            v-model="form.image"
            label="Image"
            type="file"
            accept="image/*"
          />
          <BaseInput
            v-model="form.images"
            label="Images"
            type="file"
            accept="image/*"
            multiple
          />
        </div>
      </div> -->

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
