<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()

const mobileMenuOpen = ref(false)
const userMenuOpen = ref(false)

const cartItemCount = computed(() => cartStore.itemCount)

function handleLogout() {
  authStore.logout()
  router.push('/')
  userMenuOpen.value = false
}

function closeMobileMenu() {
  mobileMenuOpen.value = false
}
</script>

<template>
  <header class="sticky top-0 z-50 bg-white shadow-sm">
    <div class="container-custom">
      <div class="flex items-center justify-between h-16">
        <!-- Logo -->
        <RouterLink to="/" class="flex items-center">
          <span class="text-xl font-bold text-primary-600">VueNest</span>
          <span class="text-xl font-light text-secondary-600">Store</span>
        </RouterLink>

        <!-- Desktop Navigation -->
        <nav class="hidden md:flex items-center space-x-8">
          <RouterLink 
            to="/products" 
            class="text-secondary-600 hover:text-primary-600 font-medium"
          >
            Products
          </RouterLink>
        </nav>

        <!-- Right Side -->
        <div class="flex items-center space-x-4">
          <!-- Cart -->
          <RouterLink 
            to="/cart" 
            class="relative p-2 text-secondary-600 hover:text-primary-600 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span 
              v-if="cartItemCount > 0"
              class="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-primary-600 text-white text-xs font-medium rounded-full"
            >
              {{ cartItemCount > 99 ? '99+' : cartItemCount }}
            </span>
          </RouterLink>

          <!-- User Menu (Desktop) -->
          <div v-if="authStore.isAuthenticated" class="hidden md:block relative">
            <button 
              @click="userMenuOpen = !userMenuOpen"
              class="flex items-center space-x-2 text-secondary-600 hover:text-primary-600 transition-colors"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span class="font-medium">{{ authStore.user?.firstName }}</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <!-- Dropdown -->
            <div 
              v-if="userMenuOpen"
              class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 border border-secondary-100"
            >
              <RouterLink 
                to="/account" 
                @click="userMenuOpen = false"
                class="block px-4 py-2 text-secondary-700 hover:bg-secondary-50"
              >
                My Account
              </RouterLink>
              <RouterLink 
                to="/account/orders" 
                @click="userMenuOpen = false"
                class="block px-4 py-2 text-secondary-700 hover:bg-secondary-50"
              >
                Orders
              </RouterLink>
              <RouterLink 
                v-if="authStore.isAdmin"
                to="/admin" 
                @click="userMenuOpen = false"
                class="block px-4 py-2 text-secondary-700 hover:bg-secondary-50"
              >
                Admin Panel
              </RouterLink>
              <hr class="my-2 border-secondary-100" />
              <button 
                @click="handleLogout"
                class="w-full text-left px-4 py-2 text-secondary-700 hover:bg-secondary-50"
              >
                Logout
              </button>
            </div>
          </div>

          <!-- Login/Register (Desktop) -->
          <div v-else class="hidden md:flex items-center space-x-4">
            <RouterLink 
              to="/login" 
              class="text-secondary-600 hover:text-primary-600 font-medium"
            >
              Login
            </RouterLink>
            <RouterLink 
              to="/register" 
              class="btn-primary btn-sm"
            >
              Register
            </RouterLink>
          </div>

          <!-- Mobile Menu Button -->
          <button 
            @click="mobileMenuOpen = !mobileMenuOpen"
            class="md:hidden p-2 text-secondary-600"
          >
            <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Mobile Menu -->
      <div v-if="mobileMenuOpen" class="md:hidden py-4 border-t border-secondary-100">
        <nav class="space-y-2">
          <RouterLink 
            to="/products" 
            @click="closeMobileMenu"
            class="block px-4 py-2 text-secondary-700 hover:bg-secondary-50 rounded-lg"
          >
            Products
          </RouterLink>
          
          <template v-if="authStore.isAuthenticated">
            <RouterLink 
              to="/account" 
              @click="closeMobileMenu"
              class="block px-4 py-2 text-secondary-700 hover:bg-secondary-50 rounded-lg"
            >
              My Account
            </RouterLink>
            <RouterLink 
              to="/account/orders" 
              @click="closeMobileMenu"
              class="block px-4 py-2 text-secondary-700 hover:bg-secondary-50 rounded-lg"
            >
              Orders
            </RouterLink>
            <RouterLink 
              v-if="authStore.isAdmin"
              to="/admin" 
              @click="closeMobileMenu"
              class="block px-4 py-2 text-secondary-700 hover:bg-secondary-50 rounded-lg"
            >
              Admin Panel
            </RouterLink>
            <button 
              @click="handleLogout"
              class="w-full text-left px-4 py-2 text-secondary-700 hover:bg-secondary-50 rounded-lg"
            >
              Logout
            </button>
          </template>
          <template v-else>
            <RouterLink 
              to="/login" 
              @click="closeMobileMenu"
              class="block px-4 py-2 text-secondary-700 hover:bg-secondary-50 rounded-lg"
            >
              Login
            </RouterLink>
            <RouterLink 
              to="/register" 
              @click="closeMobileMenu"
              class="block px-4 py-2 text-secondary-700 hover:bg-secondary-50 rounded-lg"
            >
              Register
            </RouterLink>
          </template>
        </nav>
      </div>
    </div>
  </header>
</template>
