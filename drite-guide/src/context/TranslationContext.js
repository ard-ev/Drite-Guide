import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from 'react';

import { translate, translateCount } from '../i18n/translations';
import { useAuth } from './AuthContext';

const TranslationContext = createContext(null);

export function TranslationProvider({ children }) {
  const { currentLanguage } = useAuth();
  const language = currentLanguage || 'en';

  const t = useCallback(
    (key, params) => translate(language, key, params),
    [language]
  );

  const tc = useCallback(
    (key, count, params) => translateCount(language, key, count, params),
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      t,
      tc,
    }),
    [language, t, tc]
  );

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);

  if (!context) {
    throw new Error('useTranslation must be used inside TranslationProvider.');
  }

  return context;
}
