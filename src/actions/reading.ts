"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function saveReadingProgress(bookId: string, currentPage: number) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Not authenticated" };

  const { error } = await supabase.from("reading_progress").upsert(
    {
      user_id: user.id,
      book_id: bookId,
      current_page: currentPage,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,book_id",
    }
  );

  if (error) {
    console.error("Error saving progress:", error);
    return { error: error.message };
  }

  return { success: true };
}

export async function getReadingProgress(bookId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("reading_progress")
    .select("current_page")
    .eq("user_id", user.id)
    .eq("book_id", bookId)
    .single();

  return data?.current_page || 1;
}
