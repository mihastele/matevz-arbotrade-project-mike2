<script setup lang="ts">
import { RouterView, RouterLink, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

const navItems = [
  { to: '/account', label: 'Dashboard', icon: 'home' },
  { to: '/account/orders', label: 'Orders', icon: 'orders' },
  { to: '/account/profile', label: 'Profile', icon: 'user' },
  { to: '/account/addresses', label: 'Addresses', icon: 'location' },
]

function isActive(path: string): boolean {
  if (path === '/account') {
    return route.path === '/account'
  }
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="py-8">
    <div class="container-custom">
      <div class="lg:flex lg:gap-8">
        <!-- Sidebar -->
        <aside class="lg:w-64 flex-shrink-0 mb-8 lg:mb-0">
          <div class="bg-white rounded-lg shadow-sm p-6">
            <!-- User Info -->
            <div class="text-center mb-6 pb-6 border-b border-secondary-200">
              <div class="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span class="text-2xl font-bold text-primary-600">
                  {{ authStore.user?.firstName?.[0] }}{{ authStore.user?.lastName?.[0] }}
                </span>
              </div>
              <h2 class="font-semibold text-secondary-900">
                {{ authStore.user?.firstName }} {{ authStore.user?.lastName }}
              </h2>
              <p class="text-sm text-secondary-500">{{ authStore.user?.email }}</p>
            </div>

            <!-- Navigation -->
            <nav class="space-y-1">
              <RouterLink
                v-for="item in navItems"
                :key="item.to"
                :to="item.to"
                :class="[
                  'flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive(item.to)
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-secondary-600 hover:bg-secondary-50'
                ]"
              >
                <!-- Icons -->
                <svg v-if="item.icon === 'home'" class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <svg v-else-if="item.icon === 'orders'" class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <svg v-else-if="item.icon === 'user'" class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <svg v-else-if="item.icon === 'location'" class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {{ item.label }}
              </RouterLink>
            </nav>
          </div>
        </aside>

        <!-- Main Content -->
        <main class="flex-1">
          <RouterView />
        </main>
      </div>
    </div>
  </div>
</template>
