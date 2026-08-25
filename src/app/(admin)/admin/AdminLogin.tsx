"use client";

import { useState } from "react";
import { loginAdmin } from "@/actions/admin-auth";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setError(null);
    const result = await loginAdmin(formData);
    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-white/20 selection:text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="black">
              <path d="M20 12c0 4.418-3.582 8-8 8-1.523 0-2.946-.426-4.168-1.168L3 20l1.168-4.832C3.426 13.946 3 12.523 3 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
            </svg>
          </div>
        </div>
        <h2 className="text-center text-2xl font-bold text-white tracking-tight">
          Painel de Administração
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Acesso restrito. Insira as credenciais.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-[#111] border border-white/5 py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10">
          <form action={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300">
                Usuário
              </label>
              <div className="mt-2">
                <input
                  name="username"
                  type="text"
                  required
                  className="block w-full rounded-xl border border-white/10 bg-[#161616] px-4 py-3 text-white placeholder-gray-600 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-colors"
                  placeholder="admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">
                Senha
              </label>
              <div className="mt-2">
                <input
                  name="password"
                  type="password"
                  required
                  className="block w-full rounded-xl border border-white/10 bg-[#161616] px-4 py-3 text-white placeholder-gray-600 focus:border-white focus:outline-none focus:ring-1 focus:ring-white transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium text-center">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-semibold text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-[#111] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Acessando..." : "Acessar Painel"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
