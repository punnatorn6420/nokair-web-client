import "server-only";

export type Locale = "th" | "en";

const SUPPORTED_LOCALES: Locale[] = ["th", "en"];

export function assertLocale(value: string): Locale {
  if (SUPPORTED_LOCALES.includes(value as Locale)) {
    return value as Locale;
  }

  throw new Error(`Unsupported locale: ${value}`);
}

type Dictionary = Record<string, Record<string, string>>;

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return (await import(`@/content/i18n/${locale}.json`)).default as Dictionary;
}

export async function getT(locale: Locale, ns: string) {
  const dictionary = await getDictionary(locale);

  return (key: string) => dictionary?.[ns]?.[key] ?? `${ns}.${key}`;
}
