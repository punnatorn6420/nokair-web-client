import Link from "next/link";
import LanguageSwitcher from "@/components/common/language-switcher";
import { Button } from "@/components/ui/button";
import { getT, type Locale } from "@/lib/i18n/server";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getT(locale, "home");

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="w-full flex justify-end">
        <LanguageSwitcher currentLocale={locale} />
      </div>
      <p className="text-sm uppercase tracking-widest text-muted-foreground">
        Locale: {locale}
      </p>
      <h1 className="text-4xl font-bold md:text-5xl">{t("title")}</h1>
      <p className="max-w-2xl text-lg text-muted-foreground">{t("description")}</p>
      <Button size="lg" asChild>
        <Link href={`/${locale}/booking`}>{t("cta")}</Link>
      </Button>
    </main>
  );
}
