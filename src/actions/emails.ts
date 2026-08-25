"use server";

import { sendAccessGrantedEmail } from "@/lib/email";

export async function sendTestEmailAction(email: string, locale: string, productName: string) {
  try {
    const result = await sendAccessGrantedEmail(email, "Teste de Compra", locale, productName);
    if (!result.success) {
      return { error: result.error };
    }
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Erro desconhecido" };
  }
}
