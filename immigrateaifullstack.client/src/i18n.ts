import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enTranslations from '../translations/en.json';
import frTranslations from '../translations/fr.json';
import viTranslations from '../translations/vi.json';
import zhTranslations from '../translations/zh.json';
import hiTranslations from '../translations/hi.json';

const resources = {
  en: {
    translation: enTranslations
  },
  fr: {
    translation: frTranslations
  },
  vi: {
    translation: viTranslations
  },
  zh: {
    translation: zhTranslations
  },
  hi: {
    translation: hiTranslations
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en', // default language
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
