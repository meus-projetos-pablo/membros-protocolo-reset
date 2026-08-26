"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthSessionUser } from "@/actions/auth";
import type { Book, BookChapter } from "@/lib/types";
import { unstable_cache, updateTag } from "next/cache";

export async function getUserBooks() {
  const {
    data: { user },
  } = await getAuthSessionUser();

  if (!user) return [];

  const adminClient = createSupabaseAdminClient();

  const { data: accessList } = await adminClient
    .from("user_access")
    .select("book_id")
    .eq("user_id", user.id);

  if (!accessList || accessList.length === 0) return [];

  const bookIds = accessList.map((a) => a.book_id);

  const [booksResponse, progressResponse] = await Promise.all([
    adminClient
      .from("books")
      .select("id, title, description, cover_image_url, total_pages, locale, created_at")
      .in("id", bookIds)
      .order("created_at", { ascending: true }),
    adminClient
      .from("reading_progress")
      .select("book_id, current_page")
      .eq("user_id", user.id)
      .in("book_id", bookIds)
  ]);

  const books = booksResponse.data;
  const progressList = progressResponse.data;

  const progressMap = new Map(
    (progressList || []).map((p) => [p.book_id, p.current_page])
  );

  return (books || []).map((book) => ({
    ...book,
    current_page: progressMap.get(book.id) || 1,
  }));
}

export async function getBookContent(bookId: string) {
  const {
    data: { user },
  } = await getAuthSessionUser();

  if (!user) return null;

  const adminClient = createSupabaseAdminClient();

  // Fetch access and progress concurrently
  const [accessResponse, progressResponse] = await Promise.all([
    adminClient
      .from("user_access")
      .select("id")
      .eq("user_id", user.id)
      .eq("book_id", bookId)
      .single(),
    adminClient
      .from("reading_progress")
      .select("current_page")
      .eq("user_id", user.id)
      .eq("book_id", bookId)
      .single()
  ]);

  const access = accessResponse.data;
  const progress = progressResponse.data;

  if (!access) return null;

  const getCachedBook = unstable_cache(
    async (id: string) => {
      const adminForCache = createSupabaseAdminClient();
      const { data } = await adminForCache
        .from("books")
        .select("*")
        .eq("id", id)
        .single();
      return data;
    },
    [`book-content-${bookId}`],
    { tags: [`book-${bookId}`] }
  );

  const book = await getCachedBook(bookId);

  return {
    ...book,
    current_page: progress?.current_page || 1,
  };
}

// Admin actions
export async function getAllBooks() {
  const adminClient = createSupabaseAdminClient();

  const { data: books, error } = await adminClient
    .from("books")
    .select("*, products(name, hotmart_product_id)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching books:", error);
    return [];
  }

  return books || [];
}

export async function createBook(bookData: {
  title: string;
  description: string;
  cover_image_url: string;
  product_id: string | null;
  content: BookChapter[];
  locale?: string;
  show_chapters?: boolean;
}) {
  const adminClient = createSupabaseAdminClient();

  // Calculate total pages
  const totalPages = bookData.content.reduce(
    (sum, ch) => sum + ch.pages.length,
    0
  );

  const { data, error } = await adminClient
    .from("books")
    .insert({
      ...bookData,
      total_pages: totalPages,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating book:", error);
    return { error: error.message };
  }

  return { data };
}

export async function updateBook(
  bookId: string,
  bookData: Partial<{
    title: string;
    description: string;
    cover_image_url: string;
    product_id: string | null;
    content: BookChapter[];
    locale: string;
    show_chapters: boolean;
  }>
) {
  const adminClient = createSupabaseAdminClient();

  const updatePayload: Record<string, unknown> = { ...bookData, updated_at: new Date().toISOString() };

  if (bookData.content) {
    updatePayload.total_pages = bookData.content.reduce(
      (sum, ch) => sum + ch.pages.length,
      0
    );
  }

  const { data, error } = await adminClient
    .from("books")
    .update(updatePayload)
    .eq("id", bookId)
    .select()
    .single();

  if (error) {
    console.error("Error updating book:", error);
    return { error: error.message };
  }

  // Invalidate cache for this book since it was updated
  updateTag(`book-${bookId}`);

  return { data };
}

export async function deleteBook(bookId: string) {
  const adminClient = createSupabaseAdminClient();

  const { error } = await adminClient.from("books").delete().eq("id", bookId);

  if (error) {
    console.error("Error deleting book:", error);
    return { error: error.message };
  }

  return { success: true };
}
