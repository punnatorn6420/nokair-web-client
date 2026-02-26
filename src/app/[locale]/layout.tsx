import localFont from "next/font/local";
import { notFound } from "next/navigation";
import { I18nProvider } from "@/lib/i18n";
import { getDictionary, type Locale } from "@/lib/i18n/server";

const dbOzoneX = localFont({
  src: [
    {
      path: "../../../public/fonts/DB Ozone X.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../../public/fonts/DB Ozone X Med.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../../public/fonts/DB Ozone X Bd.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-db-ozone-x",
});

function isLocale(locale: string): locale is Locale {
  return locale === "th" || locale === "en";
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const messages = await getDictionary(locale);

  return (
    <div lang={locale} className={`${dbOzoneX.variable} antialiased`}>
      <I18nProvider locale={locale} messages={messages}>
        {children}
      </I18nProvider>
    </div>
  );
}
