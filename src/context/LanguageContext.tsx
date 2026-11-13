// src/context/LanguageContext.tsx
import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type PropsWithChildren,
} from 'react';

import {
    translations,
    type Language,
    type TranslationKey,
} from '@/i18n/translations';

interface LanguageContextValue {
    language: Language;
    toggleLanguage: () => void;
    // Returns the text for a key in the current language.
    t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
    undefined
);

export function LanguageProvider({ children }: PropsWithChildren) {
    const [language, setLanguage] = useState<Language>('en');

    const toggleLanguage = useCallback(() => {
        setLanguage((current) => (current === 'en' ? 'fr' : 'en'));
    }, []);

    const t = useCallback(
        (key: TranslationKey) => translations[language][key],
        [language]
    );

    const value = useMemo<LanguageContextValue>(
        () => ({ language, toggleLanguage, t }),
        [language, toggleLanguage, t]
    );

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage(): LanguageContextValue {
    const context = useContext(LanguageContext);

    if (context === undefined) {
        throw new Error(
            'useLanguage must be used inside LanguageProvider.'
        );
    }

    return context;
}