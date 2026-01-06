<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { Category } from '@/types'

interface Props {
  categories: Category[]
  visible: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  close: []
}>()

// Get only top-level categories (those without parents)
const topLevelCategories = computed(() => {
  return props.categories.filter(cat => !cat.parentId && cat.isActive !== false)
})

function handleCategoryClick() {
  emit('close')
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-200 ease-out"
    enter-from-class="opacity-0 -translate-y-2"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-150 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-2"
  >
    <div
      v-if="visible"
      class="mega-menu absolute left-0 right-0 top-full bg-white shadow-xl border-t border-secondary-100 z-50"
      @mouseleave="$emit('close')"
    >
      <div class="container-custom py-8">
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          <!-- Each top-level category column -->
          <div 
            v-for="category in topLevelCategories" 
            :key="category.id"
            class="category-column"
          >
            <!-- Parent category header -->
            <RouterLink
              :to="`/category/${category.slug}`"
              class="group flex items-center gap-2 mb-4"
              @click="handleCategoryClick"
            >
              <h3 class="text-lg font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">
                {{ category.name }}
              </h3>
              <svg 
                class="w-4 h-4 text-secondary-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </RouterLink>

            <!-- Subcategories list -->
            <ul v-if="category.children?.length" class="space-y-2">
              <li v-for="child in category.children" :key="child.id">
                <RouterLink
                  :to="`/category/${child.slug}`"
                  class="block text-secondary-600 hover:text-primary-600 hover:translate-x-1 transition-all text-sm py-1"
                  @click="handleCategoryClick"
                >
                  {{ child.name }}
                </RouterLink>
                
                <!-- Third-level subcategories (if any) -->
                <ul v-if="child.children?.length" class="pl-4 mt-1 space-y-1">
                  <li v-for="subChild in child.children" :key="subChild.id">
                    <RouterLink
                      :to="`/category/${subChild.slug}`"
                      class="block text-secondary-500 hover:text-primary-600 text-xs py-0.5 transition-colors"
                      @click="handleCategoryClick"
                    >
                      {{ subChild.name }}
                    </RouterLink>
                  </li>
                </ul>
              </li>
            </ul>

            <!-- View All link -->
            <RouterLink
              :to="`/category/${category.slug}`"
              class="inline-block mt-4 text-sm text-primary-600 hover:text-primary-700 font-medium"
              @click="handleCategoryClick"
            >
              View All {{ category.name }} →
            </RouterLink>
          </div>
        </div>

        <!-- Promotional banner or featured section -->
        <div v-if="topLevelCategories.length > 0" class="mt-8 pt-6 border-t border-secondary-100">
          <RouterLink
            to="/products"
            class="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium transition-colors"
            @click="handleCategoryClick"
          >
            <span>Browse All Products</span>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </RouterLink>
        </div>

        <!-- Empty state -->
        <div v-if="topLevelCategories.length === 0" class="text-center py-8">
          <p class="text-secondary-500">No categories available</p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.mega-menu {
  max-height: calc(100vh - 100px);
  overflow-y: auto;
}

.category-column {
  min-width: 0;
}
</style>
