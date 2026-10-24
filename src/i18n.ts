import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { TRANSLATIONS } from './constants';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: TRANSLATIONS.en },
      es: { translation: TRANSLATIONS.es },
    },
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
