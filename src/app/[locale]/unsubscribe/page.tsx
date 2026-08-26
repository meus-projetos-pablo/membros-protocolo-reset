"use client";

import { useParams } from "next/navigation";
import Link from "next/link";

export default function UnsubscribePage() {
  const params = useParams();
  const locale = (params?.locale as string) || "pt";

  const content = {
    pt: {
      title: "Inscrição Cancelada",
      message: "Você não receberá mais e-mails não essenciais desta plataforma.",
      back: "Voltar para a página inicial",
    },
    es: {
      title: "Suscripción Cancelada",
      message: "Ya no recibirás correos electrónicos no esenciales de esta plataforma.",
      back: "Volver a la página principal",
    },
    en: {
      title: "Unsubscribed",
      message: "You will no longer receive non-essential emails from this platform.",
      back: "Return to homepage",
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
        
        <p className="text-gray-400 text-sm mb-8">
          {t.message}
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
