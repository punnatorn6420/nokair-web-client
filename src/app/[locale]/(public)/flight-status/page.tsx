import { getT, type Locale } from "@/lib/i18n/server";

export default async function FlightStatusPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = await getT(locale, "flightStatus");

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-16">
      <h1 className="text-5xl font-bold text-slate-900">{t("title")}</h1>
      <p className="mt-4 max-w-4xl text-xl text-slate-700">{t("description")}</p>
    </main>
  );
}
