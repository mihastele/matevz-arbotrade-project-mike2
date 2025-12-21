<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="min-h-screen bg-secondary-50">
    <!-- Hero Section -->
    <section class="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-16">
      <div class="container-custom text-center">
        <h1 class="text-4xl md:text-5xl font-bold mb-4">{{ t('about.title') }}</h1>
        <p class="text-xl text-primary-100">{{ t('about.companyName') }}</p>
      </div>
    </section>

    <!-- About Content -->
    <section class="py-16">
      <div class="container-custom max-w-4xl">
        <div class="bg-white rounded-xl shadow-sm p-8 md:p-12 space-y-6">
          <p class="text-secondary-700 text-lg leading-relaxed">
            {{ t('about.content.intro') }}
          </p>
          
          <p class="text-secondary-700 text-lg leading-relaxed">
            {{ t('about.content.products') }}
          </p>
          
          <p class="text-secondary-700 text-lg leading-relaxed">
            {{ t('about.content.mission') }}
          </p>
          
          <p class="text-secondary-700 text-lg leading-relaxed font-medium text-primary-600">
            {{ t('about.content.cta') }}
          </p>
        </div>
      </div>
    </section>

    <!-- Contact Info Section -->
    <section class="py-16 bg-white">
      <div class="container-custom max-w-4xl">
        <h2 class="text-2xl md:text-3xl font-bold text-secondary-900 mb-8 text-center">
          {{ t('about.contactInfo.title') }}
        </h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Address -->
          <div class="text-center p-6 bg-secondary-50 rounded-xl">
            <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 class="font-semibold text-secondary-900 mb-2">Naslov</h3>
            <p class="text-secondary-600">{{ t('about.contactInfo.address') }}</p>
          </div>
          
          <!-- Email -->
          <div class="text-center p-6 bg-secondary-50 rounded-xl">
            <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="font-semibold text-secondary-900 mb-2">E-pošta</h3>
            <a href="mailto:info@arbotrade.si" class="text-primary-600 hover:text-primary-700">
              {{ t('about.contactInfo.email') }}
            </a>
          </div>
          
          <!-- Phone -->
          <div class="text-center p-6 bg-secondary-50 rounded-xl">
            <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 class="font-semibold text-secondary-900 mb-2">Telefon</h3>
            <a href="tel:+38631306421" class="text-primary-600 hover:text-primary-700">
              {{ t('about.contactInfo.phone') }}
            </a>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
