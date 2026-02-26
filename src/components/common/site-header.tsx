import Link from "next/link";
import LanguageSwitcher from "@/components/common/language-switcher";
import { getT, type Locale } from "@/lib/i18n/server";

const NAV_PATHS = [
  { href: "/", key: "home" },
  { href: "/booking", key: "booking" },
  { href: "/promotions", key: "promotions" },
  { href: "/flight-status", key: "flightStatus" },
  { href: "/contact", key: "contact" },
] as const;

export default async function SiteHeader({ locale }: { locale: Locale }) {
  const t = await getT(locale, "header");

  return (
    <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <Link href={`/${locale}`} className="text-3xl font-bold text-yellow-500">
            {t("brand")}
          </Link>
          <LanguageSwitcher currentLocale={locale} />
        </div>

        <nav className="flex flex-wrap gap-5 text-lg font-medium text-slate-700">
          {NAV_PATHS.map((item) => (
            <Link
              key={item.href}
              href={`/${locale}${item.href}`}
              className="transition hover:text-yellow-500"
            >
              {t(`nav.${item.key}`)}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
