export type Locale = "pt" | "es" | "en";

export const dictionaries = {
  pt: {
    login: {
      title: "Login",
      subtitle: "Insira o e-mail utilizado no momento da compra",
      emailLabel: "E-mail",
      emailPlaceholder: "seu@email.com",
      buttonText: "Login",
      buttonLoading: "Entrando...",
      helpText: "Precisa de ajuda?",
      supportLink: "Contate o suporte",
    },
  },
  es: {
    login: {
      title: "Login",
      subtitle: "Introduce el correo electrónico utilizado en el momento de la compra",
      emailLabel: "Correo electrónico",
      emailPlaceholder: "tu@email.com",
      buttonText: "Iniciar sesión",
      buttonLoading: "Entrando...",
      helpText: "¿Necesitas ayuda?",
      supportLink: "Contacta con soporte",
    },
  },
  en: {
    login: {
      title: "Login",
      subtitle: "Enter the email used at the time of purchase",
      emailLabel: "Email",
      emailPlaceholder: "your@email.com",
      buttonText: "Login",
      buttonLoading: "Loading...",
      helpText: "Need help?",
      supportLink: "Contact support",
    },
  },
};

export function getDictionary(locale: string) {
  return dictionaries[locale as Locale] || dictionaries["pt"];
}
