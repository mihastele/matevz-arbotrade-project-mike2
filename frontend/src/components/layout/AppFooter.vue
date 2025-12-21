<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <footer class="bg-secondary-900 text-secondary-300">
    <div class="container-custom py-12">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Brand -->
        <div class="space-y-4">
          <RouterLink to="/" class="flex items-center">
            <span class="text-xl font-bold text-white">{{ t('brand.name') }}</span>
          </RouterLink>
          <p class="text-sm">
            {{ t('footer.description') }}
          </p>
        </div>

        <!-- Quick Links -->
        <div>
          <h4 class="text-white font-semibold mb-4">{{ t('footer.quickLinks') }}</h4>
          <ul class="space-y-2 text-sm">
            <li>
              <RouterLink to="/products" class="hover:text-white transition-colors">
                {{ t('nav.products') }}
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/about" class="hover:text-white transition-colors">
                {{ t('nav.about') }}
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/cart" class="hover:text-white transition-colors">
                {{ t('nav.cart') }}
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- Account -->
        <div>
          <h4 class="text-white font-semibold mb-4">{{ t('footer.account') }}</h4>
          <ul class="space-y-2 text-sm">
            <li>
              <RouterLink to="/login" class="hover:text-white transition-colors">
                {{ t('nav.login') }}
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/register" class="hover:text-white transition-colors">
                {{ t('nav.register') }}
              </RouterLink>
            </li>
            <li>
              <RouterLink to="/account/orders" class="hover:text-white transition-colors">
                {{ t('account.orderHistory') }}
              </RouterLink>
            </li>
          </ul>
        </div>

        <!-- Contact -->
        <div>
          <h4 class="text-white font-semibold mb-4">{{ t('footer.contact') }}</h4>
          <ul class="space-y-2 text-sm">
            <li>{{ t('about.contactInfo.address') }}</li>
            <li>
              <a href="mailto:info@arbotrade.si" class="hover:text-white transition-colors">
                {{ t('about.contactInfo.email') }}
              </a>
            </li>
            <li>
              <a href="tel:+38631306421" class="hover:text-white transition-colors">
                {{ t('about.contactInfo.phone') }}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div class="border-t border-secondary-800 mt-8 pt-8 text-sm text-center">
        <p>{{ t('footer.copyright', { year: new Date().getFullYear() }) }}</p>
      </div>
    </div>
  </footer>
</template>
