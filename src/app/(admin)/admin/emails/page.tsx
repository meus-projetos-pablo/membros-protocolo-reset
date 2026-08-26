"use client";

import { useState, useEffect } from "react";
import { getAllProducts } from "@/actions/users";

interface Product {
  id: string;
  name: string;
  hotmart_product_id: string;
}

const WEBHOOK_EVENTS = [
  { value: "PURCHASE_APPROVED", label: "Compra Aprovada", description: "Simula uma compra aprovada na Hotmart" },
  { value: "PURCHASE_COMPLETE", label: "Compra Completa", description: "Simula uma compra completa" },
  { value: "PURCHASE_CANCELED", label: "Compra Cancelada", description: "Simula um cancelamento de compra" },
  { value: "PURCHASE_REFUNDED", label: "Compra Reembolsada", description: "Simula um reembolso" },
  { value: "PURCHASE_CHARGEBACK", label: "Chargeback", description: "Simula um chargeback" },
];

export default function AdminTestsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("PURCHASE_APPROVED");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{
    type: "success" | "error";
    status?: number;
    body?: string;
    time?: number;
  } | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    const data = await getAllProducts();
    setProducts(data);
    if (data.length > 0) {
      setSelectedProductId(data[0].hotmart_product_id || data[0].id);
    }
    setLoading(false);
  }

  async function handleTest(e: React.FormEvent) {
    e.preventDefault();
    if (!buyerEmail || !selectedProductId) return;

    setSending(true);
    setResult(null);

    const product = products.find(
      (p) => p.hotmart_product_id === selectedProductId || p.id === selectedProductId
    );
    const hotmartProductId = product?.hotmart_product_id || selectedProductId;

    // Build the Hotmart-like webhook payload
    const payload = {
      id: `test-${Date.now()}`,
      creation_date: Date.now(),
      event: selectedEvent,
      version: "2.0.0",
      data: {
        product: {
          id: Number(hotmartProductId) || 0,
          name: product?.name || "Produto Teste",
        },
        buyer: {
          name: buyerName || "Usuário Teste",
          email: buyerEmail,
          first_name: (buyerName || "Usuário Teste").split(" ")[0],
          last_name: (buyerName || "Usuário Teste").split(" ").slice(1).join(" ") || "",
        },
        purchase: {
          approved_date: Date.now(),
          status: selectedEvent === "PURCHASE_APPROVED" ? "approved" : "canceled",
          transaction: `TEST-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          order_date: Date.now(),
          full_price: {
            value: 97.0,
            currency_value: "BRL",
          },
          price: {
            value: 97.0,
            currency_value: "BRL",
          },
          checkout_country: {
            name: "Brazil",
            iso: "BR",
          },
          payment: {
            type: "CREDIT_CARD",
            installments_number: 1,
          },
        },
      },
    };

    const startTime = performance.now();

    try {
      // Determine the base URL from the current window location
      const baseUrl = window.location.origin;

      const response = await fetch(`${baseUrl}/api/webhooks/hotmart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-hotmart-hottok": "__TEST_FROM_ADMIN__",
        },
        body: JSON.stringify(payload),
      });

      const endTime = performance.now();
      const responseBody = await response.text();

      setResult({
        type: response.ok ? "success" : "error",
        status: response.status,
        body: responseBody,
        time: Math.round(endTime - startTime),
      });
    } catch (error) {
      const endTime = performance.now();
      setResult({
        type: "error",
        body: error instanceof Error ? error.message : "Erro de rede",
        time: Math.round(endTime - startTime),
      });
    }

    setSending(false);
  }

  const selectedEventInfo = WEBHOOK_EVENTS.find((e) => e.value === selectedEvent);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Teste de Webhook
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--text-secondary)" }}
          >
            Simule chamadas do webhook da Hotmart para testar o fluxo completo.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div
          className="p-6 rounded-2xl"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <h2
            className="text-sm font-semibold mb-5 flex items-center gap-2"
            style={{ color: "var(--text-primary)" }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: "var(--accent-orange)" }}
            />
            Configurar Payload
          </h2>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="spinner"></div>
            </div>
          ) : (
            <form onSubmit={handleTest} className="space-y-5">
              {/* Event */}
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Evento do Webhook *
                </label>
                <select
                  className="input"
                  value={selectedEvent}
                  onChange={(e) => setSelectedEvent(e.target.value)}
                  required
                >
                  {WEBHOOK_EVENTS.map((ev) => (
                    <option key={ev.value} value={ev.value}>
                      {ev.label} ({ev.value})
                    </option>
                  ))}
                </select>
                {selectedEventInfo && (
                  <p
                    className="text-[11px] mt-1.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {selectedEventInfo.description}
                  </p>
                )}
              </div>

              {/* Product */}
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Produto *
                </label>
                <select
                  className="input"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  required
                >
                  {products.map((p) => (
                    <option
                      key={p.id}
                      value={p.hotmart_product_id || p.id}
                    >
                      {p.name} (ID: {p.hotmart_product_id || "N/A"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Buyer Name */}
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Nome do Comprador
                </label>
                <input
                  type="text"
                  className="input"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="João Silva"
                />
              </div>

              {/* Buyer Email */}
              <div>
                <label
                  className="block text-xs font-medium mb-1.5"
                  style={{ color: "var(--text-secondary)" }}
                >
                  E-mail do Comprador *
                </label>
                <input
                  type="email"
                  className="input"
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="comprador@email.com"
                  required
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="btn-primary w-full flex items-center justify-center gap-2"
                  disabled={sending || !buyerEmail}
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      Disparando...
                    </>
                  ) : (
                    <>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M22 2L11 13" />
                        <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                      </svg>
                      Disparar Webhook
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Result */}
        <div
          className="p-6 rounded-2xl"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <h2
            className="text-sm font-semibold mb-5 flex items-center gap-2"
            style={{ color: "var(--text-primary)" }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{
                background: result
                  ? result.type === "success"
                    ? "#10b981"
                    : "#ef4444"
                  : "var(--text-muted)",
              }}
            />
            Resposta do Servidor
          </h2>

          {result ? (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="flex items-center gap-3">
                <span
                  className="text-xs font-bold px-3 py-1.5 rounded-lg"
                  style={{
                    background:
                      result.type === "success"
                        ? "rgba(16, 185, 129, 0.1)"
                        : "rgba(239, 68, 68, 0.1)",
                    color:
                      result.type === "success" ? "#10b981" : "#ef4444",
                    border: `1px solid ${
                      result.type === "success"
                        ? "rgba(16, 185, 129, 0.2)"
                        : "rgba(239, 68, 68, 0.2)"
                    }`,
                  }}
                >
                  {result.status
                    ? `HTTP ${result.status}`
                    : "Erro de Rede"}
                </span>
                {result.time !== undefined && (
                  <span
                    className="text-xs font-mono"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {result.time}ms
                  </span>
                )}
              </div>

              {/* Response Body */}
              <div>
                <label
                  className="block text-xs font-medium mb-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Corpo da Resposta
                </label>
                <pre
                  className="text-xs p-4 rounded-xl overflow-auto max-h-60 font-mono"
                  style={{
                    background: "var(--bg-primary)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {(() => {
                    try {
                      return JSON.stringify(
                        JSON.parse(result.body || ""),
                        null,
                        2
                      );
                    } catch {
                      return result.body || "Sem resposta";
                    }
                  })()}
                </pre>
              </div>

              {/* Result summary */}
              <div
                className="p-4 rounded-xl text-sm"
                style={{
                  background:
                    result.type === "success"
                      ? "rgba(16, 185, 129, 0.05)"
                      : "rgba(239, 68, 68, 0.05)",
                  border: `1px solid ${
                    result.type === "success"
                      ? "rgba(16, 185, 129, 0.15)"
                      : "rgba(239, 68, 68, 0.15)"
                  }`,
                  color:
                    result.type === "success"
                      ? "#10b981"
                      : "#ef4444",
                }}
              >
                {result.type === "success" ? (
                  <div className="flex items-start gap-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="mt-0.5 flex-shrink-0"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span>
                      Webhook processado com sucesso! O usuário deve ter
                      sido criado/atualizado e recebido acesso ao produto.
                    </span>
                  </div>
                ) : (
                  <div className="flex items-start gap-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="mt-0.5 flex-shrink-0"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <span>
                      O webhook retornou um erro. Verifique o console do
                      servidor para mais detalhes.
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div
              className="flex flex-col items-center justify-center h-60 text-center"
            >
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                style={{ color: "var(--text-muted)" }}
                className="mb-4 opacity-30"
              >
                <path d="M14.5 2v6.5L18 14a4 4 0 0 1-4 6H10a4 4 0 0 1-4-6l3.5-5.5V2" />
                <line x1="9" y1="2" x2="15" y2="2" />
              </svg>
              <p
                className="text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                Dispare um webhook para ver a resposta aqui.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
