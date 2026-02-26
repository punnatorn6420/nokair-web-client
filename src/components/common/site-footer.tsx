import { getT, type Locale } from "@/lib/i18n/server";

export default async function SiteFooter({ locale }: { locale: Locale }) {
  const t = await getT(locale, "footer");
  const links = t<string[]>("links", []);

  return (
    <footer className="border-t bg-slate-50">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-10 md:grid-cols-2">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-yellow-500">{t("title")}</h2>
          <p className="text-lg text-slate-700">{t("description")}</p>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-slate-900">{t("linksTitle")}</h3>
          <ul className="mt-2 space-y-2 text-lg text-slate-700">
            {links.map((link) => (
              <li key={link}>{link}</li>
            ))}
          </ul>
        </div>
      </div>
      <p className="border-t px-6 py-4 text-center text-base text-slate-500">{t("copyright")}</p>
    </footer>
  );
}
