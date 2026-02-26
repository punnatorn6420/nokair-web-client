import { NextResponse, type NextRequest } from "next/server";

const LOCALES = ["th", "en"];
const DEFAULT_LOCALE = "th";

function hasFileExtension(pathname: string) {
  return /\.[^/]+$/.test(pathname);
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/icons/") ||
    hasFileExtension(pathname)
  ) {
    const requestHeaders = new Headers(request.headers);
    const localeFromPath = LOCALES.find((locale) =>
      pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
    );

    if (localeFromPath) {
      requestHeaders.set("x-locale", localeFromPath);
    }

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  const pathnameLocale = LOCALES.find(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );

  if (!pathnameLocale) {
    const redirectUrl = new URL(`/${DEFAULT_LOCALE}${pathname}${search}`, request.url);
    return NextResponse.redirect(redirectUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-locale", pathnameLocale);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
