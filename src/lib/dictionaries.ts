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
    dashboard: {
      greeting: "Olá, {name}!",
      subtitle: "Aqui você encontra todo o seu conteúdo disponível.",
      logout: "Sair",
    },
    reader: {
      previous: "Anterior",
      next: "Próximo",
      finish: "Finalizar",
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
    dashboard: {
      greeting: "¡Hola, {name}!",
      subtitle: "Aquí encontrarás todo tu contenido disponible.",
      logout: "Salir",
    },
    reader: {
      previous: "Anterior",
      next: "Siguiente",
      finish: "Finalizar",
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
    dashboard: {
      greeting: "Hello, {name}!",
      subtitle: "Here you will find all your available content.",
      logout: "Logout",
    },
    reader: {
      previous: "Previous",
      next: "Next",
      finish: "Finish",
    },
  },
};

export function getDictionary(locale: string) {
  return dictionaries[locale as Locale] || dictionaries["pt"];
}
