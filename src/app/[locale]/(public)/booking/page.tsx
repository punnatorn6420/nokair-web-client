import type { Locale } from "@/lib/i18n/server";

export default async function BookingPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-4xl font-bold md:text-5xl">Booking</h1>
      <p className="text-lg text-muted-foreground">Current locale: {locale}</p>
    </main>
  );
}
