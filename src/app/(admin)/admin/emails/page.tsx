"use client";

import { useState, useEffect } from "react";
import { getAllProducts } from "@/actions/users";
import { sendTestEmailAction } from "@/actions/emails";

interface Product {
  id: string;
  name: string;
}

export default function AdminEmailsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [formEmail, setFormEmail] = useState("");
  const [formLocale, setFormLocale] = useState("pt");
  const [formProductId, setFormProductId] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    const data = await getAllProducts();
    setProducts(data);
    if (data.length > 0) {
      setFormProductId(data[0].id);
    }
    setLoading(false);
  }

  async function handleSendTest(e: React.FormEvent) {
    e.preventDefault();
    if (!formEmail || !formProductId) return;

    setSending(true);
    setMessage(null);

    const product = products.find(p => p.id === formProductId);
    const productName = product ? product.name : "Protocolo Reset";

    const result = await sendTestEmailAction(formEmail, formLocale, productName);

    if (result.error) {
      setMessage({ type: "error", text: result.error });
    } else {
      setMessage({ type: "success", text: "E-mail de teste enviado com sucesso! Verifique sua caixa de entrada (e o spam)." });
    }

    setSending(false);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Teste de E-mails
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Envie e-mails de teste simulando a aprovação de uma compra.
          </p>
        </div>
      </div>

      <div 
        className="max-w-xl p-6 rounded-2xl" 
        style={{ 
          background: "var(--bg-card)", 
          border: "1px solid var(--border-subtle)" 
        }}
      >
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="spinner"></div>
          </div>
        ) : (
          <form onSubmit={handleSendTest} className="space-y-5">
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                E-mail de Destino *
              </label>
              <input
                type="email"
                className="input"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="seu_email@teste.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Produto Comprado *
              </label>
              <select
                className="input"
                value={formProductId}
                onChange={(e) => setFormProductId(e.target.value)}
                required
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Idioma do E-mail
              </label>
              <select
                className="input"
                value={formLocale}
                onChange={(e) => setFormLocale(e.target.value)}
              >
                <option value="pt">Português</option>
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>

            {message && (
              <div
                className="p-4 text-sm rounded-xl mt-4"
                style={{
                  background: message.type === "success" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                  color: message.type === "success" ? "#10b981" : "#ef4444",
                  border: `1px solid ${message.type === "success" ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)"}`
                }}
              >
                {message.text}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="btn-primary w-full flex items-center justify-center"
                disabled={sending || !formEmail}
              >
                {sending ? "Enviando..." : "Disparar E-mail de Teste"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
