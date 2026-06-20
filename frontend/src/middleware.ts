import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const locales = ["en", "es"];
const localeRegex = /^\/(en|es)(?:\/|$)/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Use regex for efficient locale matching instead of .some()
  if (localeRegex.test(pathname)) {
    return;
  }

  // Parse Accept-Language header properly with quality values
  const acceptLanguage = request.headers.get("Accept-Language") || "";
  const locale = parseAcceptLanguage(acceptLanguage);

  request.nextUrl.pathname = `/${locale}${pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

/**
 * Parse Accept-Language header respecting quality values
 * Example: "en-US,en;q=0.9,es;q=0.8" -> returns "en"
 */
function parseAcceptLanguage(header: string): "en" | "es" {
  if (!header) return "en";

  const parsed = header
    .split(",")
    .map((lang) => {
      const [code, q] = lang.trim().split(";q=");
      const quality = q ? parseFloat(q) : 1.0;
      const lang_code = code.split("-")[0].toLowerCase();
      return { lang_code, quality };
    })
    .sort((a, b) => b.quality - a.quality);

  const preferred = parsed[0]?.lang_code;

  if (preferred === "es") return "es";
  return "en";
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
