"use client";

import { Button } from "@/components/ui/button";
import { useLocale, useT } from "@/lib/i18n";

export default function HomeContent() {
  const t = useT("home");
  const locale = useLocale();

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-6 px-6 text-center">
      <p className="text-sm uppercase tracking-widest text-muted-foreground">
        Locale: {locale}
      </p>
      <h1 className="text-4xl font-bold md:text-5xl">{t("title")}</h1>
      <p className="max-w-2xl text-lg text-muted-foreground">
        {t("description")}
      </p>
      <Button size="lg">{t("cta")}</Button>
    </main>
  );
}
