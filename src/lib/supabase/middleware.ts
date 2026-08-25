import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session - important!
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  const user = session?.user;

  // Protected routes - account for locale prefix if present
  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.includes("/login");
  const isDashboardRoute = pathname.includes("/dashboard") || pathname.includes("/reader");
  const isAdminRoute = pathname.startsWith("/admin");

  // Extract locale from pathname (e.g. /pt/dashboard -> pt)
  const segments = pathname.split("/").filter(Boolean);
  const locale = (segments[0] && ["pt", "es", "en"].includes(segments[0])) ? segments[0] : "pt";

  if (!user && isDashboardRoute) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/dashboard`;
    return NextResponse.redirect(url);
  }

  // Admin route protection is handled securely inside /admin/layout.tsx
  // We remove the Edge middleware DB query to prevent RLS failures

  return supabaseResponse;
}
