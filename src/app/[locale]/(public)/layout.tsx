import SiteFooter from "@/components/common/site-footer";
import SiteHeader from "@/components/common/site-header";
import type { Locale } from "@/lib/i18n/server";

export default async function PublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <SiteHeader locale={locale} />
      <div className="flex-1">{children}</div>
      <SiteFooter locale={locale} />
    </div>
  );
}
