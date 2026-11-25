// src/utils/merchantType.ts
import type { TranslationKey } from '@/i18n/translations';

// The server sends the merchant type as a number in text form.
// This maps each number to the translation key of its name.
const MERCHANT_TYPE_KEYS: Record<string, TranslationKey> = {
    '1': 'merchant',
    '2': 'branch',
    '3': 'shop',
    '4': 'till',
};

// Returns the translation key for a type code, or null for an unknown code.
// Use it like:  const key = merchantTypeKey(code);  key ? t(key) : code
export function merchantTypeKey(code: string): TranslationKey | null {
    return MERCHANT_TYPE_KEYS[code.trim()] ?? null;
}