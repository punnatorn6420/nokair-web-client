import "server-only";

export type Locale = "th" | "en";

const SUPPORTED_LOCALES: Locale[] = ["th", "en"];

export function assertLocale(value: string): Locale {
  if (SUPPORTED_LOCALES.includes(value as Locale)) {
    return value as Locale;
  }

  throw new Error(`Unsupported locale: ${value}`);
}

type DictionaryValue = string | number | boolean | null | DictionaryValue[] | { [key: string]: DictionaryValue };
type Dictionary = { [key: string]: DictionaryValue };

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return (await import(`@/lib/i18n/${locale}.json`)).default as Dictionary;
}

export async function getT(locale: Locale, ns?: string) {
  const dictionary = await getDictionary(locale);

  return <T = string>(key: string, fallback?: T): T => {
    const parts = (ns ? `${ns}.${key}` : key).split(".");
    let current: DictionaryValue | Dictionary = dictionary;

    for (const part of parts) {
      if (typeof current !== "object" || current === null || Array.isArray(current)) {
        return (fallback as T) ?? (`${ns ? `${ns}.` : ""}${key}` as T);
      }

      current = (current as Record<string, DictionaryValue>)[part];

      if (current == null) {
        return (fallback as T) ?? (`${ns ? `${ns}.` : ""}${key}` as T);
      }
    }

    return current as T;
  };
}
