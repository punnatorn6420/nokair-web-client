import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getT, type Locale } from "@/lib/i18n/server";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getT(locale, "publicHome");

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16">
      <section className="rounded-3xl bg-yellow-50 p-10 text-center">
        <p className="text-lg text-slate-600">{t("subtitle")}</p>
        <h1 className="mt-2 text-5xl font-bold text-slate-900">{t("title")}</h1>
        <p className="mx-auto mt-6 max-w-3xl text-xl leading-relaxed text-slate-700">{t("lorem")}</p>
        <Button className="mt-8" size="lg" asChild>
          <Link href={`/${locale}/booking`}>{t("cta")}</Link>
        </Button>
      </section>
    </main>
  );
}
