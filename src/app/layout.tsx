import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Protocolo Reset — Cure a Procrastinação",
  description:
    "Plataforma de aprendizado focada em curar procrastinação e vício digital. Reconquiste seu foco e produtividade.",
  keywords: ["procrastinação", "foco", "produtividade", "reset digital", "vício digital"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">{children}</body>
    </html>
  );
}
