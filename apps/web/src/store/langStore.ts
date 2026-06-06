import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import idStrings from '../i18n/id.json';
import enStrings from '../i18n/en.json';

type Lang = 'id' | 'en';
type Strings = typeof idStrings;

const translations: Record<Lang, Strings> = { id: idStrings, en: enStrings };

type LangState = {
  lang: Lang;
  t: Strings;
  setLang: (lang: Lang) => void;
};

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: 'id',
      t: translations['id'],
      setLang: (lang) => set({ lang, t: translations[lang] }),
    }),
    { name: 'lang' }
  )
);
