import { updateSession } from "@/lib/supabase/middleware";
import { type NextRequest, NextResponse } from "next/server";

const VALID_LOCALES = ["pt", "es", "en"];
const DEFAULT_LOCALE = "pt";

function getLocaleFromHeaders(request: NextRequest): string {
  const acceptLanguage = request.headers.get("accept-language") || "";
  
  // Check for exact matches first (pt, es, en)
  for (const locale of VALID_LOCALES) {
    if (acceptLanguage.toLowerCase().includes(locale)) {
      return locale;
    }
  }
  
  return DEFAULT_LOCALE;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip locale logic for API routes, static files, admin, etc.
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return await updateSession(request);
  }

  // Check if pathname already has a valid locale prefix
  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  if (firstSegment && VALID_LOCALES.includes(firstSegment)) {
    // Valid locale in URL — proceed normally
    return await updateSession(request);
  }

  // No locale in URL — detect and redirect
  const detectedLocale = getLocaleFromHeaders(request);
  
  // Redirect / to /{locale}/dashboard or /{locale}/login
  const newPath = pathname === "/" ? `/${detectedLocale}/dashboard` : `/${detectedLocale}${pathname}`;
  
  return NextResponse.redirect(new URL(newPath, request.url));
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/webhooks (webhook endpoints - no auth needed)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|api/webhooks|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|css|js|ico)$).*)",
  ],
};
