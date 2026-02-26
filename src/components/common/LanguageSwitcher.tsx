"use client";

import * as React from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type Locale = "th" | "en";
const LOCALES: { code: Locale; label: string; flagSrc: string }[] = [
  { code: "th", label: "ภาษาไทย", flagSrc: "/icons/th.svg" },
  { code: "en", label: "English", flagSrc: "/icons/gb.svg" },
];

function withLocalePath(pathname: string, next: Locale) {
  // pathname like "/th/booking?x=1" (but pathname here has no query)
  const parts = pathname.split("/").filter(Boolean); // ["th","booking"]
  const hasLocale = parts[0] === "th" || parts[0] === "en";
  const rest = hasLocale ? parts.slice(1) : parts;
  return "/" + [next, ...rest].join("/");
}

export default function LanguageSwitcher({
  currentLocale,
}: {
  currentLocale: Locale; // ส่งจาก server/middleware จะนิ่งสุด
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const [open, setOpen] = React.useState(false);

  const currentDef =
    LOCALES.find((l) => l.code === currentLocale) ?? LOCALES[0];

  const changeLocale = (next: Locale) => {
    if (next === currentLocale) return;

    const qs = search?.toString();
    const nextPath = withLocalePath(pathname, next);
    const url = qs ? `${nextPath}?${qs}` : nextPath;

    router.replace(url);
    // ใน v16 useRouter อยู่ใน next/navigation ตาม doc
    // และ refresh ใช้เพื่อให้ server re-render ตาม locale ใหม่ (ถ้ามี) :contentReference[oaicite:1]{index=1}
    router.refresh();
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-10 px-4 lg:px-5 rounded-xl bg-white hover:bg-yellow-50 text-black font-bold shadow-md"
        >
          <span className="relative mr-3 inline-flex h-7 w-7 overflow-hidden rounded-full ring-1 ring-black/5">
            <Image
              src={currentDef.flagSrc}
              alt=""
              fill
              sizes="28px"
              className="object-cover"
            />
          </span>
          <span className="text-[20px] leading-none">{currentDef.label}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={10}
        className="w-52 rounded-2xl border shadow-xl bg-white p-2"
      >
        {LOCALES.map((l) => {
          const active = l.code === currentLocale;
          return (
            <DropdownMenuItem
              key={l.code}
              disabled={active}
              onClick={() => changeLocale(l.code)}
              className={[
                "flex items-center gap-3 rounded-xl px-3 py-2",
                "text-[18px] font-extrabold text-gray-900",
                active
                  ? "bg-yellow-100 cursor-default"
                  : "hover:bg-gray-50 cursor-pointer",
              ].join(" ")}
            >
              <span className="relative inline-flex h-7 w-7 overflow-hidden rounded-full ring-1 ring-black/5">
                <Image
                  src={l.flagSrc}
                  alt=""
                  fill
                  sizes="28px"
                  className="object-cover"
                />
              </span>
              <span className="ml-1 text-[20px] leading-none">{l.label}</span>
              <span className="ml-auto text-yellow-700">
                {active ? "✓" : ""}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
