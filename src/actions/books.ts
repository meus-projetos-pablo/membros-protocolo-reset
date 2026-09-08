"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getAuthSessionUser } from "@/actions/auth";
import type { Book, BookChapter } from "@/lib/types";
import { unstable_cache, updateTag, revalidateTag } from "next/cache";

// Cache L2 Global: catálogo de livros (1 hora de TTL, compartilhado entre todos os usuários)
async function fetchCatalogBooks() {
  const adminClient = createSupabaseAdminClient();
  const { data: books } = await adminClient
    .from("books")
    .select("id, title, description, cover_image_url, total_pages, locale, created_at, show_chapters")
    .order("created_at", { ascending: true });
  return books || [];
}

const getCachedCatalogBooksInternal = unstable_cache(
  fetchCatalogBooks,
  ["books-catalog-global"],
  { revalidate: 3600, tags: ["books-catalog"] }
);

export async function getCachedCatalogBooks() {
  return getCachedCatalogBooksInternal();
}

// Cache L2 por Usuário: lista de book_id que o usuário tem acesso (5 min de TTL ou invalidado pelo webhook)
async function fetchUserBookIds(userId: string) {
  const adminClient = createSupabaseAdminClient();
  const { data: accessList } = await adminClient
    .from("user_access")
    .select("book_id")
    .eq("user_id", userId);
  return (accessList || []).map((a) => a.book_id);
}

const getCachedUserBookIdsInternal = unstable_cache(
  fetchUserBookIds,
  ["user-access-list"],
  { revalidate: 300 }
);

export async function getCachedUserBookIds(userId: string) {
  return getCachedUserBookIdsInternal(userId);
}

// Cache L2 por Livro: conteúdo completo do livro (capítulos e páginas)
async function fetchSingleBook(bookId: string) {
  const adminClient = createSupabaseAdminClient();
  const { data } = await adminClient
    .from("books")
    .select("*")
    .eq("id", bookId)
    .maybeSingle();
  return data;
}

const getCachedBookInternal = unstable_cache(
  fetchSingleBook,
  ["book-content-cache"],
  { revalidate: 3600 }
);

async function getCachedBook(bookId: string) {
  return getCachedBookInternal(bookId);
}

export async function getUserBooks() {
  const {
    data: { user },
  } = await getAuthSessionUser();

  if (!user) return [];

  // Pega os acessos cacheados do usuário e o catálogo global em paralelo (0 chamadas repetidas ao Postgres para o catálogo)
  const [userBookIds, catalogBooks] = await Promise.all([
    getCachedUserBookIds(user.id),
    getCachedCatalogBooks(),
  ]);

  if (!userBookIds || userBookIds.length === 0) return [];

  const allowedBookIdsSet = new Set(userBookIds);
  const userAllowedBooks = catalogBooks.filter((book) => allowedBookIdsSet.has(book.id));

  if (userAllowedBooks.length === 0) return [];

  // Consulta apenas o progresso de leitura atual do usuário
  const adminClient = createSupabaseAdminClient();
  const { data: progressList } = await adminClient
    .from("reading_progress")
    .select("book_id, current_page")
    .eq("user_id", user.id)
    .in("book_id", userBookIds);

  const progressMap = new Map(
    (progressList || []).map((p) => [p.book_id, p.current_page])
  );

  return userAllowedBooks.map((book) => ({
    ...book,
    current_page: progressMap.get(book.id) || 1,
  }));
}

export async function getBookContent(bookId: string) {
  const {
    data: { user },
  } = await getAuthSessionUser();

  if (!user) return null;

  // Verifica acesso via cache do usuário
  const userBookIds = await getCachedUserBookIds(user.id);
  if (!userBookIds.includes(bookId)) {
    return null;
  }

  // Busca progresso de leitura e livro cacheado em paralelo
  const adminClient = createSupabaseAdminClient();
  const [progressResponse, book] = await Promise.all([
    adminClient
      .from("reading_progress")
      .select("current_page")
      .eq("user_id", user.id)
      .eq("book_id", bookId)
      .maybeSingle(),
    getCachedBook(bookId),
  ]);

  if (!book) return null;

  return {
    ...book,
    current_page: progressResponse.data?.current_page || 1,
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

  // Invalida o catálogo global de livros para todos os usuários
  updateTag("books-catalog");

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

  // Invalidate cache for this book and the global catalog
  updateTag(`book-${bookId}`);
  updateTag("books-catalog");

  return { data };
}

export async function deleteBook(bookId: string) {
  const adminClient = createSupabaseAdminClient();

  const { error } = await adminClient.from("books").delete().eq("id", bookId);

  if (error) {
    console.error("Error deleting book:", error);
    return { error: error.message };
  }

  updateTag(`book-${bookId}`);
  updateTag("books-catalog");

  return { success: true };
}
