import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Get user's locale from profile
    const admin = createSupabaseAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("locale")
      .eq("id", user.id)
      .single();

    const locale = profile?.locale || "pt";
    redirect(`/${locale}/dashboard`);
  } else {
    redirect("/pt/login");
  }
}
