<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <footer class="bg-secondary-900 text-secondary-300">
    <div class="container-custom py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Brand -->
        <div class="space-y-4">
          <RouterLink to="/" class="flex items-center">
            <span class="text-xl font-bold text-white">VueNest</span>
            <span class="text-xl font-light text-secondary-400">Store</span>
          </RouterLink>
          <p class="text-sm">
            Your premium ecommerce destination. Quality products, exceptional service.
          </p>
        </div>

        <!-- Quick Links -->
        <div>
          <h4 class="text-white font-semibold mb-4">Quick Links</h4>
          <ul class="space-y-2 text-sm">
            <li>
              <RouterLink to="/products" class="hover:text-white transition-colors">
                Products
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/cart" class="hover:text-white transition-colors">
                Cart
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- Account -->
        <div>
          <h4 class="text-white font-semibold mb-4">Account</h4>
          <ul class="space-y-2 text-sm">
            <li>
              <RouterLink to="/login" class="hover:text-white transition-colors">
                Login
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/register" class="hover:text-white transition-colors">
                Register
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/account/orders" class="hover:text-white transition-colors">
                Order History
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- Contact -->
        <div>
          <h4 class="text-white font-semibold mb-4">Contact</h4>
          <ul class="space-y-2 text-sm">
            <li>support@vuenest.store</li>
            <li>+1 (555) 123-4567</li>
          </ul>
        </div>
      </div>

      <div class="border-t border-secondary-800 mt-8 pt-8 text-sm text-center">
        <p>&copy; {{ new Date().getFullYear() }} VueNest Store. All rights reserved.</p>
      </div>
    </div>
  </footer>
</template>
