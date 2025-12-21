import { createI18n } from 'vue-i18n'
import sl from './locales/sl'
import en from './locales/en'

const i18n = createI18n({
  legacy: false,
  locale: 'sl', // Slovenščina kot privzeti jezik
  fallbackLocale: 'en', // Angleščina kot sekundarni jezik
  messages: {
    sl,
    en,
  },
})

export default i18n
