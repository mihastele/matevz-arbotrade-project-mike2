<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { categoriesApi } from '@/api/categories'
import { useToast } from '@/composables/useToast'
import type { Category } from '@/types'

const toast = useToast()

const categories = ref<Category[]>([])
const categoryTree = ref<Category[]>([])
const loading = ref(true)
const showForm = ref(false)
const editingId = ref<string | null>(null)

const form = ref({
  name: '',
  slug: '',
  description: '',
  parentId: null as string | null
})

// Flatten tree for dropdown options (excluding current category when editing)
const parentOptions = computed(() => {
  const flatten = (cats: Category[], depth = 0): { id: string; name: string; depth: number }[] => {
    const result: { id: string; name: string; depth: number }[] = []
    for (const cat of cats) {
      // Exclude current category and its children when editing
      if (editingId.value && cat.id === editingId.value) continue
      result.push({ id: cat.id, name: cat.name, depth })
      if (cat.children?.length) {
        result.push(...flatten(cat.children, depth + 1))
      }
    }
    return result
  }
  return flatten(categoryTree.value)
})

// Flatten tree for display with depth info
const flatCategories = computed(() => {
  const flatten = (cats: Category[], depth = 0): (Category & { depth: number })[] => {
    const result: (Category & { depth: number })[] = []
    for (const cat of cats) {
      result.push({ ...cat, depth })
      if (cat.children?.length) {
        result.push(...flatten(cat.children, depth + 1))
      }
    }
    return result
  }
  return flatten(categoryTree.value)
})

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function handleNameChange() {
  if (!editingId.value) {
    form.value.slug = generateSlug(form.value.name)
  }
}

async function loadCategories() {
  loading.value = true
  try {
    const [allCategories, tree] = await Promise.all([
      categoriesApi.getAll(),
      categoriesApi.getTree()
    ])
    categories.value = allCategories
    categoryTree.value = tree
  } catch (error) {
    toast.error('Failed to load categories')
  } finally {
    loading.value = false
  }
}

function openForm(category?: Category) {
  if (category) {
    editingId.value = category.id
    form.value = {
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parentId: category.parentId || null
    }
  } else {
    editingId.value = null
    form.value = { name: '', slug: '', description: '', parentId: null }
  }
  showForm.value = true
}

function closeForm() {
  showForm.value = false
  editingId.value = null
  form.value = { name: '', slug: '', description: '', parentId: null }
}

async function saveCategory() {
  if (!form.value.name || !form.value.slug) {
    toast.error('Name and slug are required')
    return
  }

  try {
    const payload = {
      name: form.value.name,
      slug: form.value.slug,
      description: form.value.description || undefined,
      parentId: form.value.parentId || undefined
    }

    if (editingId.value) {
      await categoriesApi.update(editingId.value, payload)
      toast.success('Category updated')
    } else {
      await categoriesApi.create(payload)
      toast.success('Category created')
    }
    closeForm()
    loadCategories()
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } }
    toast.error(err.response?.data?.message || 'Failed to save category')
  }
}

async function deleteCategory(id: string) {
  if (!confirm('Are you sure you want to delete this category?')) return

  try {
    await categoriesApi.delete(id)
    toast.success('Category deleted')
    loadCategories()
  } catch (error) {
    toast.error('Failed to delete category')
  }
}

function getParentName(parentId: string | undefined): string {
  if (!parentId) return ''
  const findParent = (cats: Category[]): string => {
    for (const cat of cats) {
      if (cat.id === parentId) return cat.name
      if (cat.children?.length) {
        const found = findParent(cat.children)
        if (found) return found
      }
    }
    return ''
  }
  return findParent(categoryTree.value)
}

onMounted(loadCategories)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold text-secondary-900">Categories</h1>
      <BaseButton @click="openForm()">
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        Add Category
      </BaseButton>
    </div>

    <!-- Form Modal -->
    <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6">
        <h2 class="text-lg font-semibold text-secondary-900 mb-4">
          {{ editingId ? 'Edit Category' : 'New Category' }}
        </h2>
        
        <div class="space-y-4">
          <BaseInput
            v-model="form.name"
            label="Name"
            required
            @input="handleNameChange"
          />
          <BaseInput
            v-model="form.slug"
            label="Slug"
            required
          />
          
          <!-- Parent Category Dropdown -->
          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Parent Category</label>
            <select
              v-model="form.parentId"
              class="w-full px-4 py-2.5 rounded-lg border border-secondary-300 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
            >
              <option :value="null">— None (Top Level) —</option>
              <option 
                v-for="option in parentOptions" 
                :key="option.id" 
                :value="option.id"
              >
                {{ '—'.repeat(option.depth) }} {{ option.name }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-secondary-700 mb-1">Description</label>
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full px-4 py-2.5 rounded-lg border border-secondary-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
            ></textarea>
          </div>
        </div>

        <div class="flex justify-end gap-4 mt-6">
          <BaseButton variant="outline" @click="closeForm">Cancel</BaseButton>
          <BaseButton @click="saveCategory">Save</BaseButton>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="bg-white rounded-lg shadow-sm p-6">
      <div v-for="i in 5" :key="i" class="animate-pulse flex items-center mb-4">
        <div class="w-12 h-12 bg-secondary-200 rounded mr-4"></div>
        <div class="flex-1">
          <div class="h-4 bg-secondary-200 rounded w-1/3 mb-2"></div>
          <div class="h-3 bg-secondary-200 rounded w-1/4"></div>
        </div>
      </div>
    </div>

    <!-- Categories Table -->
    <div v-else class="bg-white rounded-lg shadow-sm overflow-hidden">
      <table class="min-w-full divide-y divide-secondary-200">
        <thead class="bg-secondary-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
              Name
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
              Parent
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
              Slug
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-secondary-500 uppercase tracking-wider">
              Products
            </th>
            <th class="px-6 py-3 text-right text-xs font-medium text-secondary-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-secondary-200">
          <tr v-if="flatCategories.length === 0">
            <td colspan="5" class="px-6 py-12 text-center text-secondary-500">
              No categories found
            </td>
          </tr>
          <tr v-for="category in flatCategories" :key="category.id" class="hover:bg-secondary-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div 
                  class="flex items-center"
                  :style="{ paddingLeft: `${category.depth * 24}px` }"
                >
                  <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                    <svg class="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p class="font-medium text-secondary-900">{{ category.name }}</p>
                    <p v-if="category.description" class="text-sm text-secondary-500 truncate max-w-xs">
                      {{ category.description }}
                    </p>
                  </div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
              {{ getParentName(category.parentId) || '—' }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
              {{ category.slug }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-secondary-500">
              {{ category.productCount || 0 }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button 
                @click="openForm(category)"
                class="text-primary-600 hover:text-primary-900 mr-4"
              >
                Edit
              </button>
              <button 
                @click="deleteCategory(category.id)"
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
