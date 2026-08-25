import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendAccessGrantedEmail(
  to: string,
  buyerName: string,
  locale: string = "pt"
): Promise<{ success: boolean; error?: string }> {
  try {
    let subject = "🔓 Seu acesso ao Protocolo Reset está liberado";
    let title = "Protocolo Reset";
    let greeting = `Olá${buyerName ? `, <strong style="color: #f9fafb;">${buyerName}</strong>` : ""},`;
    let message = `Seu acesso ao <strong style="color: #34d399;">Protocolo Reset</strong> foi liberado com sucesso. Você já pode acessar todo o conteúdo da plataforma.`;
    let buttonText = "Acessar Plataforma →";
    let footer = "Protocolo Reset — Cure a procrastinação. Reconquiste seu foco.";

    if (locale === "es") {
      subject = "🔓 Tu acceso al Protocolo Reset está habilitado";
      greeting = `Hola${buyerName ? `, <strong style="color: #f9fafb;">${buyerName}</strong>` : ""},`;
      message = `Tu acceso al <strong style="color: #34d399;">Protocolo Reset</strong> ha sido habilitado con éxito. Ya puedes acceder a todo el contenido de la plataforma.`;
      buttonText = "Acceder a la Plataforma →";
      footer = "Protocolo Reset — Cura la procrastinación. Recupera tu enfoque.";
    } else if (locale === "en") {
      subject = "🔓 Your access to the Reset Protocol is granted";
      title = "Reset Protocol";
      greeting = `Hello${buyerName ? `, <strong style="color: #f9fafb;">${buyerName}</strong>` : ""},`;
      message = `Your access to the <strong style="color: #34d399;">Reset Protocol</strong> has been successfully granted. You can now access all platform content.`;
      buttonText = "Access Platform →";
      footer = "Reset Protocol — Cure procrastination. Reclaim your focus.";
    }

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Protocolo Reset <onboarding@resend.dev>",
      to: [to],
      subject,
      html: `
<!DOCTYPE html>
<html lang="${locale}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0f1a; font-family: 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0f1a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #111827 0%, #1a2332 100%); border-radius: 16px; border: 1px solid rgba(52, 211, 153, 0.15); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 24px; text-align: center;">
              <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #34d399, #0ea5e9); border-radius: 14px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 28px; line-height: 56px;">⚡</span>
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #f9fafb; letter-spacing: -0.02em;">
                ${title}
              </h1>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #9ca3af;">
                ${greeting}
              </p>
              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #9ca3af;">
                ${message}
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL}/login?email=${encodeURIComponent(to)}" 
                       style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #34d399, #0ea5e9); color: #0a0f1a; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 10px; letter-spacing: 0.02em;">
                      ${buttonText}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: rgba(0,0,0,0.2);">
              <p style="margin: 0; font-size: 12px; color: #4b5563; text-align: center;">
                ${footer}
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("Email send error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
