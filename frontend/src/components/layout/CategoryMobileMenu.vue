<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { Category } from '@/types'

const { t } = useI18n()

interface Props {
  categories: Category[]
  visible: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

const router = useRouter()

// Navigation stack for drill-down
const navigationStack = ref<Category[]>([])

// Get only top-level categories
const topLevelCategories = computed(() => {
  return props.categories.filter(cat => !cat.parentId && cat.isActive !== false)
})

// Current categories to display (either top-level or children of current)
const currentCategories = computed(() => {
  if (navigationStack.value.length === 0) {
    return topLevelCategories.value
  }
  const current = navigationStack.value[navigationStack.value.length - 1]
  return current.children || []
})

// Current title (category name or "Categories")
const currentTitle = computed(() => {
  if (navigationStack.value.length === 0) {
    return t('categoryMenu.title')
  }
  return navigationStack.value[navigationStack.value.length - 1].name
})

// Current category for "View All" link
const currentCategory = computed(() => {
  if (navigationStack.value.length === 0) {
    return null
  }
  return navigationStack.value[navigationStack.value.length - 1]
})

// Reset navigation when menu closes
watch(() => props.visible, (visible) => {
  if (!visible) {
    setTimeout(() => {
      navigationStack.value = []
    }, 300) // Wait for close animation
  }
})

function drillDown(category: Category) {
  if (category.children?.length) {
    navigationStack.value = [...navigationStack.value, category]
  } else {
    // Navigate to category page
    navigateToCategory(category)
  }
}

function goBack() {
  navigationStack.value = navigationStack.value.slice(0, -1)
}

function navigateToCategory(category: Category) {
  router.push(`/category/${category.slug}`)
  emit('close')
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <!-- Backdrop -->
  <Transition
    enter-active-class="transition-opacity duration-300"
    enter-from-class="opacity-0"
    enter-to-class="opacity-100"
    leave-active-class="transition-opacity duration-300"
    leave-from-class="opacity-100"
    leave-to-class="opacity-0"
  >
    <div
      v-if="visible"
      class="fixed inset-0 bg-black/50 z-40"
      @click="handleClose"
    />
  </Transition>

  <!-- Drawer -->
  <Transition
    enter-active-class="transition-transform duration-300 ease-out"
    enter-from-class="-translate-x-full"
    enter-to-class="translate-x-0"
    leave-active-class="transition-transform duration-300 ease-in"
    leave-from-class="translate-x-0"
    leave-to-class="-translate-x-full"
  >
    <div
      v-if="visible"
      class="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white z-50 shadow-2xl flex flex-col"
    >
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-4 border-b border-secondary-100 bg-secondary-50">
        <div class="flex items-center gap-3">
          <button
            v-if="navigationStack.length > 0"
            @click="goBack"
            class="p-2 -ml-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h2 class="text-lg font-semibold text-secondary-900">{{ currentTitle }}</h2>
        </div>
        <button
          @click="handleClose"
          class="p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg transition-colors"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Categories List with Animation -->
      <div class="flex-1 overflow-y-auto">
        <Transition
          mode="out-in"
          enter-active-class="transition-all duration-200"
          enter-from-class="opacity-0 translate-x-4"
          enter-to-class="opacity-100 translate-x-0"
          leave-active-class="transition-all duration-200"
          leave-from-class="opacity-100 translate-x-0"
          leave-to-class="opacity-0 -translate-x-4"
        >
          <ul :key="navigationStack.length" class="py-2">
            <!-- View All link when in subcategory -->
            <li v-if="currentCategory">
              <RouterLink
                :to="`/category/${currentCategory.slug}`"
                class="flex items-center px-4 py-3 text-primary-600 hover:bg-primary-50 font-medium transition-colors"
                @click="handleClose"
              >
                <svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                {{ t('categoryMenu.viewAll') }} {{ currentCategory.name }}
              </RouterLink>
            </li>

            <!-- Category items -->
            <li v-for="category in currentCategories" :key="category.id">
              <button
                v-if="category.children?.length"
                @click="drillDown(category)"
                class="w-full flex items-center justify-between px-4 py-3 text-secondary-700 hover:bg-secondary-50 hover:text-secondary-900 transition-colors"
              >
                <span class="font-medium">{{ category.name }}</span>
                <svg class="w-5 h-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <RouterLink
                v-else
                :to="`/category/${category.slug}`"
                class="block px-4 py-3 text-secondary-700 hover:bg-secondary-50 hover:text-secondary-900 font-medium transition-colors"
                @click="handleClose"
              >
                {{ category.name }}
              </RouterLink>
            </li>

            <!-- Empty state -->
            <li v-if="currentCategories.length === 0" class="px-4 py-8 text-center text-secondary-500">
              {{ t('categoryMenu.noCategories') }}
            </li>
          </ul>
        </Transition>
      </div>

      <!-- Footer with Products link -->
      <div class="border-t border-secondary-100 p-4 bg-secondary-50">
        <RouterLink
          to="/products"
          class="flex items-center justify-center gap-2 w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          @click="handleClose"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          {{ t('categoryMenu.browseAll') }}
        </RouterLink>
      </div>
    </div>
  </Transition>
</template>
