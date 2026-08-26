import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const SUPPORT_EMAIL = "holaprotocoloreset@gmail.com";

// Anti-spam: plain text version of the email
function getPlainText(
  buyerName: string,
  productName: string,
  loginUrl: string,
  unsubscribeUrl: string,
  locale: string
): string {
  if (locale === "es") {
    return [
      `Hola, ${buyerName || "Estudiante"}:`,
      "",
      `Tu acceso a ${productName} ha sido habilitado correctamente. Ya puedes ingresar a la plataforma y acceder a todo el contenido incluido en tu compra.`,
      "",
      `Acceder a la Plataforma: ${loginUrl}`,
      "",
      `Si el boton no funciona, copia y pega el siguiente enlace en tu navegador:`,
      loginUrl,
      "",
      "---",
      `¿Necesitas ayuda? Contacta con soporte: ${SUPPORT_EMAIL}`,
      "Protocolo Reset (c) 2026",
      `Unsubscribe: ${unsubscribeUrl}`
    ].join("\n");
  }

  if (locale === "en") {
    return [
      `Hello, ${buyerName || "Student"}:`,
      "",
      `Your access to ${productName} has been successfully enabled. You can now enter the platform and access all the content included in your purchase.`,
      "",
      `Access the Platform: ${loginUrl}`,
      "",
      `If the button does not work, copy and paste the following link into your browser:`,
      loginUrl,
      "",
      "---",
      `Need help? Contact support: ${SUPPORT_EMAIL}`,
      "Protocolo Reset (c) 2026",
      `Unsubscribe: ${unsubscribeUrl}`
    ].join("\n");
  }

  return [
    `Olá, ${buyerName || "Estudante"}:`,
    "",
    `Seu acesso ao ${productName} foi habilitado corretamente. Você já pode acessar a plataforma e todo o conteúdo incluído na sua compra.`,
    "",
    `Acessar a Plataforma: ${loginUrl}`,
    "",
    `Se o botao nao funcionar, copie e cole o seguinte link no seu navegador:`,
    loginUrl,
    "",
    "---",
    `Precisa de ajuda? Entre em contato com o suporte: ${SUPPORT_EMAIL}`,
    "Protocolo Reset (c) 2026",
    `Unsubscribe: ${unsubscribeUrl}`
  ].join("\n");
}

function getEmailContent(
  buyerName: string,
  productName: string,
  locale: string
) {
  const content = {
    pt: {
      subject: `Seu acesso ao ${productName} foi habilitado`,
      greeting: `Olá, ${buyerName || "Estudante"}:`,
      message: `Seu acesso ao <strong style="color: #ffffff;">${productName}</strong> foi habilitado corretamente. Você já pode acessar a plataforma e todo o conteúdo incluído na sua compra.`,
      button: "Acessar a Plataforma",
      linkFallback: "Se o botão não funcionar, copie e cole o seguinte link no seu navegador:",
      supportLabel: "Precisa de ajuda?",
      supportLink: "Entre em contato com o suporte",
    },
    es: {
      subject: `Tu acceso a ${productName} ha sido habilitado`,
      greeting: `Hola, ${buyerName || "Estudiante"}:`,
      message: `Tu acceso a <strong style="color: #ffffff;">${productName}</strong> ha sido habilitado correctamente. Ya puedes ingresar a la plataforma y acceder a todo el contenido incluido en tu compra.`,
      button: "Acceder a la Plataforma",
      linkFallback: "Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:",
      supportLabel: "¿Necesitas ayuda?",
      supportLink: "Contacta con soporte",
    },
    en: {
      subject: `Your access to ${productName} is enabled`,
      greeting: `Hello, ${buyerName || "Student"}:`,
      message: `Your access to <strong style="color: #ffffff;">${productName}</strong> has been successfully enabled. You can now enter the platform and access all the content included in your purchase.`,
      button: "Access the Platform",
      linkFallback: "If the button does not work, copy and paste the following link into your browser:",
      supportLabel: "Need help?",
      supportLink: "Contact support",
    },
  };

  return content[locale as keyof typeof content] || content.pt;
}

export async function sendAccessGrantedEmail(
  to: string,
  buyerName: string,
  locale: string = "pt",
  productName: string = "Protocolo Reset"
): Promise<{ success: boolean; error?: string }> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://resetmembers.site";
    const loginUrl = `${appUrl}/${locale}/login?email=${encodeURIComponent(to)}`;
    const unsubscribeUrl = `${appUrl}/${locale}/unsubscribe`;
    const t = getEmailContent(buyerName, productName, locale);
    const plainText = getPlainText(buyerName, productName, loginUrl, unsubscribeUrl, locale);

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Protocolo Reset <send@resetmembers.site>",
      to: [to],
      subject: t.subject,
      text: plainText,
      headers: {
        "List-Unsubscribe": `<mailto:${SUPPORT_EMAIL}?subject=unsubscribe>`,
      },
      html: `<!DOCTYPE html>
<html lang="${locale}" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${t.subject}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    @media only screen and (max-width: 520px) {
      .container { width: 100% !important; padding: 16px !important; }
      .card { width: 100% !important; }
      .content-cell { padding: 32px 24px !important; }
      .footer-cell { padding: 20px 24px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0c0c0c; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; -webkit-font-smoothing: antialiased;">

  <!-- Preheader -->
  <div style="display: none; font-size: 1px; color: #0c0c0c; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden;">
    ${t.greeting} - ${t.subject}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0c0c0c;">
    <tr>
      <td align="center" style="padding: 48px 16px;" class="container">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" class="card" style="background-color: #111111; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); overflow: hidden; max-width: 480px;">

          <!-- Content -->
          <tr>
            <td style="padding: 44px 40px 36px;" class="content-cell">
              <!-- Greeting -->
              <p style="margin: 0 0 8px; font-size: 20px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em; text-align: center;">
                ${t.greeting}
              </p>

              <!-- Message -->
              <p style="margin: 0 0 32px; font-size: 15px; line-height: 1.7; color: #888888; text-align: center;">
                ${t.message}
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: #ffffff; border-radius: 100px; text-align: center;">
                          <a href="${loginUrl}"
                             style="display: inline-block; padding: 14px 36px; color: #000000; font-size: 14px; font-weight: 600; text-decoration: none; letter-spacing: -0.01em;"
                             target="_blank">
                            ${t.button}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Link fallback -->
              <p style="margin: 24px 0 0; font-size: 12px; line-height: 1.6; color: #555555; text-align: center;">
                ${t.linkFallback}
              </p>
              <p style="margin: 4px 0 0; font-size: 11px; line-height: 1.5; color: #444444; text-align: center; word-break: break-all;">
                <a href="${loginUrl}" style="color: #666666; text-decoration: underline;">${loginUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="height: 1px; background-color: rgba(255,255,255,0.06);"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px;" class="footer-cell">
              <p style="margin: 0 0 16px; font-size: 13px; color: #555555; text-align: center;">
                ${t.supportLabel} <a href="mailto:${SUPPORT_EMAIL}" style="color: #888888; text-decoration: underline;">${t.supportLink}</a>
              </p>
              <p style="margin: 0 0 8px; font-size: 11px; color: #333333; text-align: center;">
                Protocolo Reset &copy; 2026
              </p>
              <p style="margin: 0; font-size: 11px; text-align: center;">
                <a href="${unsubscribeUrl}" style="color: #444444; text-decoration: underline;">Unsubscribe</a>
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
