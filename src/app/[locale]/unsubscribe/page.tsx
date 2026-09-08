"use client";

import { useParams } from "next/navigation";
import Link from "next/link";

export default function UnsubscribePage() {
  const params = useParams();
  const locale = (params?.locale as string) || "pt";

  const content = {
    pt: {
      title: "Inscrição Cancelada",
      message: "Você foi descadastrado com sucesso e não receberá mais mensagens ou e-mails promocionais.",
      submessage: "Seu acesso aos livros e conteúdos adquiridos continua ativo e seguro na plataforma.",
      back: "Acessar a Plataforma",
    },
    es: {
      title: "Suscripción Cancelada",
      message: "Te has dado de baja correctamente y ya no recibirás más correos o mensajes promocionales.",
      submessage: "Tu acceso a los libros y contenidos comprados sigue activo y seguro en la plataforma.",
      back: "Acceder a la Plataforma",
    },
    en: {
      title: "Unsubscribed Successfully",
      message: "You have been successfully unsubscribed and will no longer receive promotional emails or messages.",
      submessage: "Your access to purchased books and content remains active and secure on the platform.",
      back: "Access the Platform",
    },
  };

  const t = content[locale as keyof typeof content] || content.pt;

  return (
    <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#111111] border border-white/10 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-3 tracking-tight">
          {t.title}
        </h1>
        
        <p className="text-gray-300 text-sm mb-3 leading-relaxed">
          {t.message}
        </p>

        <p className="text-gray-500 text-xs mb-8">
          {t.submessage}
        </p>

        <Link 
          href={`/${locale}`}
          className="inline-flex items-center justify-center px-6 py-3 bg-white text-black font-semibold rounded-xl text-sm transition-transform hover:scale-105 active:scale-95"
        >
          {t.back}
        </Link>
      </div>
    </div>
  );
}
