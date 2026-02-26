import { getT, type Locale } from "@/lib/i18n/server";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getT(locale, "contact");

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16">
      <h1 className="text-5xl font-bold text-slate-900">{t("title")}</h1>
      <p className="mt-4 max-w-4xl text-xl text-slate-700">{t("description")}</p>
      <div className="mt-6 space-y-2 text-xl text-slate-800">
        <p>{t("phone")}</p>
        <p>{t("email")}</p>
      </div>
    </main>
  );
}
