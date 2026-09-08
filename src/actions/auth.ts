"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { cache } from "react";

import { unstable_cache } from "next/cache";

// Senha universal usada por baixo dos panos para permitir login apenas com o e-mail
const UNIVERSAL_PASSWORD = "UniversalPassword123!@#";

// Cache L2 para o perfil do usuário (5 minutos de TTL)
async function fetchUserProfile(userId: string) {
  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return profile || null;
}

const getCachedProfileInternal = unstable_cache(
  fetchUserProfile,
  ["user-profile-cache"],
  { revalidate: 300 }
);

async function getCachedProfile(userId: string) {
  return getCachedProfileInternal(userId);
}

export async function signInWithEmail(email: string) {
  const supabase = await createSupabaseServerClient();
  const normalizedEmail = email.toLowerCase().trim();

  // 1. Verifica se o usuário tem acesso (bypass RLS usando a RPC)
  const { data: hasAccess, error: rpcError } = await supabase.rpc(
    "check_email_access",
    { user_email: normalizedEmail }
  );

  if (rpcError) {
    console.error("RPC error:", rpcError);
    return { error: "Erro ao verificar acesso. Tente novamente." };
  }

  if (!hasAccess) {
    return {
      error:
        "Este e-mail não possui acesso à plataforma. Adquira o Protocolo Reset para liberar seu acesso.",
    };
  }

  // 2. Para fazer o login direto sem verificação de e-mail, usamos signInWithPassword com a senha universal.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: UNIVERSAL_PASSWORD,
  });

  // 3. Se falhar por senha (usuário antigo), busca diretamente pelo email no profile sem usar listUsers()
  if (signInError) {
    const admin = createSupabaseAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (profile?.id) {
      await admin.auth.admin.updateUserById(profile.id, {
        password: UNIVERSAL_PASSWORD,
      });

      // Tenta logar novamente
      const { error: retryError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: UNIVERSAL_PASSWORD,
      });

      if (retryError) {
        return { error: "Erro interno ao gerar sessão. Contate o suporte." };
      }
    } else {
      return { error: "Usuário não encontrado no sistema de autenticação." };
    }
  }

  // Get user's locale for redirect from cached profile
  const { data: { user: loggedUser } } = await supabase.auth.getUser();
  let locale = "pt";
  if (loggedUser) {
    const profile = await getCachedProfile(loggedUser.id);
    if (profile?.locale) {
      locale = profile.locale;
    }
  }

  redirect(`/${locale}/dashboard`);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/pt/login");
}

export const getAuthSessionUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  return supabase.auth.getUser();
});

export const getCurrentUser = cache(async () => {
  const {
    data: { user },
    error: userError,
  } = await getAuthSessionUser();

  if (userError || !user) {
    return null;
  }

  return await getCachedProfile(user.id);
});
