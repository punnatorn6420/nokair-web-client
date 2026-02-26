"use client";

import * as React from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Locale } from "@/lib/i18n/server";

const LOCALES: { code: Locale; label: string; flagSrc: string }[] = [
  { code: "th", label: "ภาษาไทย", flagSrc: "/icons/th.svg" },
  { code: "en", label: "English", flagSrc: "/icons/gb.svg" },
];

function withLocalePath(pathname: string, nextLocale: Locale) {
  const parts = pathname.split("/").filter(Boolean);
  const hasLocale = parts[0] === "th" || parts[0] === "en";
  const remaining = hasLocale ? parts.slice(1) : parts;

  return `/${[nextLocale, ...remaining].join("/")}`;
}

export default function LanguageSwitcher({
  currentLocale,
}: {
  currentLocale: Locale;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = React.useState(false);

  const selected =
    LOCALES.find((locale) => locale.code === currentLocale) ?? LOCALES[0];

  const onChangeLocale = (nextLocale: Locale) => {
    if (nextLocale === currentLocale) return;

    const queryString = searchParams.toString();
    const localizedPath = withLocalePath(pathname, nextLocale);
    const nextUrl = queryString ? `${localizedPath}?${queryString}` : localizedPath;

    router.replace(nextUrl);
    router.refresh();
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 rounded-xl bg-white px-4 font-bold text-black shadow-md hover:bg-yellow-50 lg:px-5"
        >
          <span className="relative mr-3 inline-flex h-7 w-7 overflow-hidden rounded-full ring-1 ring-black/5">
            <Image
              src={selected.flagSrc}
              alt=""
              fill
              sizes="28px"
              className="object-cover"
            />
          </span>
          <span className="text-[20px] leading-none">{selected.label}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={10}
        className="w-52 rounded-2xl border bg-white p-2 shadow-xl"
      >
        {LOCALES.map((locale) => {
          const active = locale.code === currentLocale;

          return (
            <DropdownMenuItem
              key={locale.code}
              disabled={active}
              onClick={() => onChangeLocale(locale.code)}
              className={[
                "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2",
                "text-[18px] font-extrabold text-gray-900",
                active ? "cursor-default bg-yellow-100" : "hover:bg-gray-50",
              ].join(" ")}
            >
              <span className="relative inline-flex h-7 w-7 overflow-hidden rounded-full ring-1 ring-black/5">
                <Image
                  src={locale.flagSrc}
                  alt=""
                  fill
                  sizes="28px"
                  className="object-cover"
                />
              </span>
              <span className="ml-1 text-[20px] leading-none">{locale.label}</span>
              <span className="ml-auto text-yellow-700">{active ? "✓" : ""}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
