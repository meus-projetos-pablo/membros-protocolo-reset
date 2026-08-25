"use client";

import { useState, useEffect } from "react";
import { signInWithEmail } from "@/actions/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get("email");
      if (emailParam) {
        setEmail(emailParam);
      }
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setMessage(null);

    const result = await signInWithEmail(email);

    if (result?.error) {
      setMessage({ type: "error", text: result.error });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans">
      
      {/* Centered Floating Container */}
      <div className="w-full max-w-[800px] bg-white rounded-[32px] md:rounded-[40px] shadow-2xl flex flex-col md:flex-row overflow-hidden relative" style={{ minHeight: '550px' }}>
        
        {/* Left Area (Desktop) / Top Area (Mobile) - Black Pattern */}
        <div className="w-full md:w-1/2 h-[35vh] md:h-auto bg-[#111111] relative flex items-center justify-center flex-shrink-0 overflow-hidden">
          
          {/* Subtle Geometric Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-10 right-0 w-32 h-32 rounded-full border-[16px] border-white" />
            <div className="absolute top-10 -right-16 w-40 h-40 rounded-full bg-white" />
            <div className="absolute top-20 -left-10 w-24 h-24 bg-white rotate-45" />
            <div className="absolute bottom-10 left-10 w-32 h-32 rounded-full border-[12px] border-white" />
            <div className="absolute -bottom-16 right-10 w-48 h-48 bg-white opacity-50 rounded-tl-full" />
          </div>

          {/* Logo */}
          <div className="relative z-10 w-20 h-20 bg-white rounded-[24px] flex items-center justify-center shadow-lg">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="black">
              <path d="M20 12c0 4.418-3.582 8-8 8-1.523 0-2.946-.426-4.168-1.168L3 20l1.168-4.832C3.426 13.946 3 12.523 3 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
            </svg>
          </div>
        </div>

        {/* Right Area (Desktop) / Bottom Area (Mobile) - White Form */}
        <div className="w-full md:w-1/2 bg-white flex flex-col justify-center items-center px-8 py-10 relative">
          
          {/* Decorative curve for mobile only */}
          <div className="absolute -top-6 left-0 w-full h-12 bg-white rounded-t-[40px] md:hidden" />

          <div className="w-full max-w-[320px] flex flex-col relative z-10">
            <h2 className="text-[32px] font-medium text-left text-gray-900 mb-2 tracking-tight">
              Login
            </h2>
            <p className="text-[13px] text-gray-500 mb-8 text-left">
              Insira o e-mail utilizado no momento da compra
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
              
              {/* Input Group */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-[13px] font-semibold text-gray-800 mb-2 ml-1"
                >
                  E-mail
                </label>
                <div className="bg-white rounded-2xl shadow-[0_2px_15px_rgb(0,0,0,0.05)] border border-gray-100 p-4 transition-shadow focus-within:shadow-[0_4px_20px_rgb(0,0,0,0.08)] focus-within:border-gray-200">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full text-[14px] text-gray-900 outline-none bg-transparent placeholder:text-gray-300"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Message Alert */}
              {message && (
                <div
                  className={`p-4 text-sm rounded-xl text-center shadow-sm transition-all duration-300 ${
                    message.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-100"
                      : "bg-red-50 text-red-700 border border-red-100"
                  }`}
                >
                  {message.text}
                </div>
              )}

              {/* Login Button */}
              <button
                type="submit"
                className="w-full bg-black hover:bg-gray-800 text-white rounded-2xl py-4 font-medium text-[15px] transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md mt-2"
                disabled={loading || !email.trim()}
              >
                {loading ? "Entrando..." : "Login"}
              </button>

              {/* Footer Support Link */}
              <div className="text-center pt-2">
                <p className="text-[13px] text-gray-500 font-medium">
                  Precisa de ajuda?{" "}
                  <a href="#" className="text-gray-900 hover:underline transition-colors duration-200">
                    Contate o suporte
                  </a>
                </p>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
