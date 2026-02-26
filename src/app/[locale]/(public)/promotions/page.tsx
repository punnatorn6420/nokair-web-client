import { getT, type Locale } from "@/lib/i18n/server";

export default async function PromotionsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getT(locale, "promotions");
  const items = t<string[]>("items", []);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16">
      <h1 className="text-5xl font-bold text-slate-900">{t("title")}</h1>
      <ul className="mt-6 list-disc space-y-3 pl-6 text-xl text-slate-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </main>
  );
}
