import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Language, translations, t as translate } from '@/i18n/translations';

type TranslationContextType = {
  language: Language;
  toggleLanguage: () => void;
  t: (key: keyof typeof translations.pt) => string;
};

const TranslationContext = createContext<TranslationContextType | null>(null);

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>('pt');

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === 'pt' ? 'en' : 'pt'));
  }, []);

  const t = useCallback(
    (key: keyof typeof translations.pt): string => {
      return translate(language, key);
    },
    [language]
  );

  return (
    <TranslationContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return context;
};