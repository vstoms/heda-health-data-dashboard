import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/i18n/en.json";
import fr from "@/i18n/fr.json";
import { STORAGE_KEYS } from "@/lib/constants";

const resources = {
  en: { translation: en },
  fr: { translation: fr },
} as const;

const savedLanguage = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
const defaultLanguage =
  savedLanguage || (navigator.language.startsWith("fr") ? "fr" : "en");

i18n.use(initReactI18next).init({
  resources,
  lng: defaultLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  load: "languageOnly",
});

export default i18n;
