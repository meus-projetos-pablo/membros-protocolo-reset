"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { cache } from "react";

// Senha universal usada por baixo dos panos para permitir login apenas com o e-mail
const UNIVERSAL_PASSWORD = "UniversalPassword123!@#";

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

  // 2. Para fazer o login direto sem verificação de e-mail, usamos signInWithPassword.
  // Como o usuário não sabe a senha, nós usamos a senha universal configurada no sistema.
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: normalizedEmail,
    password: UNIVERSAL_PASSWORD,
  });

  // 3. Se falhar por senha incorreta (usuário antigo/criado antes da regra universal), 
  // forçamos a atualização da senha usando o admin client e tentamos novamente.
  if (signInError) {
    const admin = createSupabaseAdminClient();
    
    // Busca o usuário na tabela auth.users pelo email
    const { data: usersData } = await admin.auth.admin.listUsers();
    const userToUpdate = usersData?.users.find((u) => u.email === normalizedEmail);
    
    if (userToUpdate) {
      await admin.auth.admin.updateUserById(userToUpdate.id, {
        password: UNIVERSAL_PASSWORD,
      });
      
      // Tenta logar de novo
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

  // Get user's locale for redirect
  const { data: { user: loggedUser } } = await supabase.auth.getUser();
  let locale = "pt";
  if (loggedUser) {
    const admin = createSupabaseAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("locale")
      .eq("id", loggedUser.id)
      .single();
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

  if (userError) {
    console.log("getCurrentUser: getUser error:", userError.message);
  }

  if (!user) {
    console.log("getCurrentUser: No user found.");
    return null;
  }

  const admin = createSupabaseAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.log("getCurrentUser: profile query error:", profileError.message);
    return null;
  }

  if (!profile) {
    console.log("getCurrentUser: No profile returned.");
    return null;
  }

  return profile;
});
