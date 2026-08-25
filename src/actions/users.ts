"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function getAllUsers() {
  const adminClient = createSupabaseAdminClient();

  const { data: profiles, error } = await adminClient
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }

  return profiles || [];
}

export async function createUserManually(userData: {
  email: string;
  full_name: string;
  locale?: string;
}) {
  const adminClient = createSupabaseAdminClient();

  // Create auth user
  const { data: authUser, error: authError } =
    await adminClient.auth.admin.createUser({
      email: userData.email.toLowerCase().trim(),
      email_confirm: true,
      password: "UniversalPassword123!@#",
    });

  if (authError) {
    console.error("Error creating auth user:", authError);
    return { error: authError.message };
  }

  // Update profile with full name and role
  const { error: profileError } = await adminClient
    .from("profiles")
    .update({
      full_name: userData.full_name,
      locale: userData.locale || "pt",
    })
    .eq("id", authUser.user.id);

  if (profileError) {
    console.error("Error updating profile:", profileError);
    return { error: profileError.message };
  }

  return { data: authUser.user };
}

export async function updateUser(
  userId: string,
  userData: Partial<{
    email: string;
    full_name: string;
    locale: string;
  }>
) {
  const adminClient = createSupabaseAdminClient();

  // Update email in auth if changed
  if (userData.email) {
    const { error: authError } = await adminClient.auth.admin.updateUserById(
      userId,
      {
        email: userData.email.toLowerCase().trim(),
      }
    );
    if (authError) {
      console.error("Error updating auth user:", authError);
      return { error: authError.message };
    }
  }

  // Update profile
  const { error } = await adminClient
    .from("profiles")
    .update({
      ...userData,
      email: userData.email?.toLowerCase().trim(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("Error updating user:", error);
    return { error: error.message };
  }

  return { success: true };
}

export async function deleteUser(userId: string) {
  const adminClient = createSupabaseAdminClient();

  const { error } = await adminClient.auth.admin.deleteUser(userId);

  if (error) {
    console.error("Error deleting user:", error);
    return { error: error.message };
  }

  return { success: true };
}

export async function getUserAccess(userId: string) {
  const adminClient = createSupabaseAdminClient();

  const { data, error } = await adminClient
    .from("user_access")
    .select("*, books(id, title)")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching user access:", error);
    return [];
  }

  return data || [];
}

export async function grantBookAccess(userId: string, bookId: string, productId?: string) {
  const adminClient = createSupabaseAdminClient();

  const { error } = await adminClient.from("user_access").upsert(
    {
      user_id: userId,
      book_id: bookId,
      product_id: productId || null,
    },
    { onConflict: "user_id,book_id" }
  );

  if (error) {
    console.error("Error granting access:", error);
    return { error: error.message };
  }

  return { success: true };
}

export async function revokeBookAccess(userId: string, bookId: string) {
  const adminClient = createSupabaseAdminClient();

  const { error } = await adminClient
    .from("user_access")
    .delete()
    .eq("user_id", userId)
    .eq("book_id", bookId);

  if (error) {
    console.error("Error revoking access:", error);
    return { error: error.message };
  }

  return { success: true };
}

export async function grantProductAccess(userId: string, productId: string) {
  const adminClient = createSupabaseAdminClient();

  // Find all books for this product
  const { data: books } = await adminClient
    .from("books")
    .select("id")
    .eq("product_id", productId);

  if (!books || books.length === 0) {
    return { error: "Nenhum livro encontrado para este produto." };
  }

  const accessRecords = books.map((book) => ({
    user_id: userId,
    book_id: book.id,
    product_id: productId,
  }));

  const { error } = await adminClient
    .from("user_access")
    .upsert(accessRecords, { onConflict: "user_id,book_id" });

  if (error) {
    console.error("Error granting product access:", error);
    return { error: error.message };
  }

  return { success: true };
}

export async function revokeProductAccess(userId: string, productId: string) {
  const adminClient = createSupabaseAdminClient();

  const { error } = await adminClient
    .from("user_access")
    .delete()
    .eq("user_id", userId)
    .eq("product_id", productId);

  if (error) {
    console.error("Error revoking product access:", error);
    return { error: error.message };
  }

  return { success: true };
}

// Product management
export async function getAllProducts() {
  const adminClient = createSupabaseAdminClient();

  const { data, error } = await adminClient
    .from("products")
    .select("*, books(id, title)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
    return [];
  }

  return data || [];
}

export async function createProduct(productData: {
  hotmart_product_id: string;
  name: string;
  description: string;
  locale?: string;
}) {
  const adminClient = createSupabaseAdminClient();

  const { data, error } = await adminClient
    .from("products")
    .insert(productData)
    .select()
    .single();

  if (error) {
    console.error("Error creating product:", error);
    return { error: error.message };
  }

  return { data };
}

export async function updateProduct(
  productId: string,
  productData: Partial<{
    hotmart_product_id: string;
    name: string;
    description: string;
    locale: string;
  }>
) {
  const adminClient = createSupabaseAdminClient();

  const { data, error } = await adminClient
    .from("products")
    .update(productData)
    .eq("id", productId)
    .select()
    .single();

  if (error) {
    console.error("Error updating product:", error);
    return { error: error.message };
  }

  return { data };
}

export async function deleteProduct(productId: string) {
  const adminClient = createSupabaseAdminClient();

  const { error } = await adminClient
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) {
    console.error("Error deleting product:", error);
    return { error: error.message };
  }

  return { success: true };
}
