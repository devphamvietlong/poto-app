import { ref, computed } from 'vue';
import en from '../locales/en.json';
import vi from '../locales/vi.json';

const messages = { en, vi };
const currentLocale = ref(localStorage.getItem('poto_lang') || 'en');

// Set theme-like class on html or body if needed, but not strictly required
export function useI18n() {
  const locale = computed({
    get: () => currentLocale.value,
    set: (val) => {
      currentLocale.value = val;
      localStorage.setItem('poto_lang', val);
    }
  });

  const t = (key, params = {}) => {
    const keys = key.split('.');
    let value = messages[locale.value];
    
    for (const k of keys) {
      if (value && value[k] !== undefined) {
        value = value[k];
      } else {
        // Fallback to English if key is missing in active locale
        let engValue = messages['en'];
        for (const ek of keys) {
          if (engValue && engValue[ek] !== undefined) {
            engValue = engValue[ek];
          } else {
            engValue = key;
            break;
          }
        }
        value = engValue;
        break;
      }
    }

    if (typeof value === 'string') {
      let result = value;
      Object.keys(params).forEach(p => {
        result = result.replace(new RegExp(`{${p}}`, 'g'), params[p]);
      });
      return result;
    }
    
    return key;
  };

  return {
    locale,
    t
  };
}
